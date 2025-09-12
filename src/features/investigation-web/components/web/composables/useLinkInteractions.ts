export function useLinkInteractions({ runtime, store, getSvg }:{ runtime:any; store:any; getSvg?:()=>SVGSVGElement|null }){
  const lasso = {
    sourceId: null as string | null,
    lastToId: null as string | null,
  };
  const cutter = {                           // NEW
    prevClient: null as { x:number; y:number } | null,
    cutIds: new Set<string>(),
  };

  function getHoveredNodeId(e?: PointerEvent | MouseEvent): string | null {
    const hid = runtime?.controllers?.hover?.id || runtime?.controllers?.hover?.get?.();
    if (hid && (store.nodes || []).some((n:any) => n.id === hid)) return hid;
    const el = (e?.target as Element | null) ?? (e ? document.elementFromPoint((e as any).clientX, (e as any).clientY) : null);
    const nodeEl = el?.closest?.("[data-id], .node") as HTMLElement | null;
    const id = nodeEl?.getAttribute?.("data-id") || nodeEl?.dataset?.id || null;
    if (id && (store.nodes || []).some((n:any) => n.id === id)) return id;
    return null;
  }

  function segSeg(a:any,b:any,c:any,d:any){
    // returns true if segments AB and CD intersect
    const cross = (p:any,q:any,r:any)=> (q.x-p.x)*(r.y-p.y) - (q.y-p.y)*(r.x-p.x);
    const onSeg = (p:any,q:any,r:any)=> Math.min(p.x,r.x) <= q.x && q.x <= Math.max(p.x,r.x) && Math.min(p.y,r.y) <= q.y && q.y <= Math.max(p.y,r.y);
    const d1 = cross(a,b,c), d2 = cross(a,b,d), d3 = cross(c,d,a), d4 = cross(c,d,b);
    if (((d1>0 && d2<0)||(d1<0 && d2>0)) && ((d3>0 && d4<0)||(d3<0 && d4>0))) return true;
    if (d1===0 && onSeg(a,c,b)) return true;
    if (d2===0 && onSeg(a,d,b)) return true;
    if (d3===0 && onSeg(c,a,d)) return true;
    if (d4===0 && onSeg(c,b,d)) return true;
    return false;
  }

  function worldFromClient(x:number,y:number){
    return runtime?.controllers?.view?.worldFromClient?.(x,y) || { x, y };
  }

  function tryCutAlong(prev:{x:number;y:number}, cur:{x:number;y:number}){
    const nodes = store.nodes || [];
    const nodeById = new Map<string, any>(nodes.map((n:any)=> [n.id, n]));
    const links = store.links || [];
    const toRemove: string[] = [];
    for (const l of links){
      if (!l?.from || !l?.to) continue;
      if (cutter.cutIds.has(l.id)) continue;
      const A = nodeById.get(l.from);
      const B = nodeById.get(l.to);
      if (!A || !B) continue;
      const a = { x: A.x, y: A.y };
      const b = { x: B.x, y: B.y };
      if (segSeg(prev, cur, a, b)) {
        toRemove.push(l.id);
        cutter.cutIds.add(l.id);
      }
    }
    if (toRemove.length){
      store.removeLinks?.(toRemove) || toRemove.forEach((id)=> store.removeLink?.(id));
    }
  }

  function cutterPointerMove(e:PointerEvent){
    // Only act when left button held
    if (!(e.buttons & 1)){
      cutter.prevClient = null;
      return;
    }
    const curClient = { x: e.clientX, y: e.clientY };
    if (!cutter.prevClient){
      cutter.prevClient = curClient;
      return;
    }
    const prevW = worldFromClient(cutter.prevClient.x, cutter.prevClient.y);
    const curW = worldFromClient(curClient.x, curClient.y);
    tryCutAlong(prevW, curW);
    cutter.prevClient = curClient;
  }

  function lassoPointerMove(e:PointerEvent){
    const lp = runtime.controllers?.linkPlacement;
    // Button released -> reset ongoing chain (but keep tool selected)
    if (!(e.buttons & 1)){
      lasso.sourceId = null;
      lasso.lastToId = null;
      lp?.cancel?.();
      return;
    }
    // Update ghost pointer (even if not over a node yet)
    if (lp?.isActive()) lp.pointerMove(e.clientX, e.clientY);

    const nodeId = getHoveredNodeId(e);
    if (!nodeId) return;

    // First node in a press
    if (!lasso.sourceId){
      // Start placement & set source
      if (!lp?.isActive()){
        const d = store.linkDraft;
        lp.start(d.type ?? "straight", d.color ?? "#64748b", d.stroke ?? "solid");
      }
      lp?.setSource(nodeId);
      lasso.sourceId = nodeId;
      lasso.lastToId = null;
      return;
    }

    // Already have a source, new node encountered
    if (nodeId !== lasso.sourceId && nodeId !== lasso.lastToId){
      lp?.hoverNode(nodeId);
      // Try commit (shift:true to keep placement alive)
      const committed = lp?.tryCommit(nodeId, { shift:true });
      if (committed){
        // New chain start at this node
        lasso.sourceId = nodeId;
        lasso.lastToId = nodeId;
        lp?.setSource(nodeId);
      }
    }
  }

  function onPointerMove(e:PointerEvent){
    if (store.tools.linkCutter){
      cutterPointerMove(e);
      return;
    }
    if (store.tools.linkLasso){
      lassoPointerMove(e);
      return;
    }
    // Normal single-link placement
    if (!store?.policy?.canEditStructure) return;
    if (!store.tools.addLink) return;
    const lp = runtime.controllers?.linkPlacement;
    lp.pointerMove(e.clientX, e.clientY);
    const nodeId = getHoveredNodeId(e);
    lp.hoverNode(nodeId);
  }

  function onClick(e:MouseEvent): boolean {
    if (store.tools.linkCutter || store.tools.linkLasso) {
      // Cutter/Lasso use pointermove + button hold; suppress normal click selection
      e.stopPropagation(); e.preventDefault();
      return true;
    }
    if (!store?.policy?.canEditStructure) return false;
    if (!store.tools.addLink) return false;

    const lp = runtime.controllers.linkPlacement;
    if (lp && !lp.isActive()) {
      const d = store.linkDraft;
      lp.start(d.type ?? "straight", d.color ?? "#93c5fd", d.stroke ?? "solid");
    }
    const nodeId = getHoveredNodeId(e);
    if (nodeId && lp) {
      const committed = lp.tryCommit(nodeId, { shift: e.shiftKey });
      if (committed && !e.shiftKey) store.setAddLink(false);
      e.stopPropagation();
      e.preventDefault();
      return true;
    }
    e.stopPropagation();
    e.preventDefault();
    return true;
  }

  function cancelAll(){
    const lp = runtime.controllers?.linkPlacement;
    if (lp?.isActive()) lp.cancel();
    lasso.sourceId = null;
    lasso.lastToId = null;
    cutter.prevClient = null;
    cutter.cutIds.clear?.();
    if (store.tools.addLink) store.setAddLink(false);
    if (store.tools.linkLasso) store.setLinkLasso(false);
    if (store.tools.linkCutter) store.setLinkCutter(false);
  }

  return { onClick, onPointerMove, cancelAll };
}