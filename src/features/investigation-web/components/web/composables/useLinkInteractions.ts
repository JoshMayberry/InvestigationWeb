export function useLinkInteractions({ runtime, store }:{ runtime:any; store:any }){
  const lasso = {
    sourceId: null as string | null,
    lastToId: null as string | null,
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
    if (store.tools.linkLasso) {
      // Lasso uses pointermove + button hold; suppress normal click selection
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
    if (store.tools.addLink) store.setAddLink(false);
    if (store.tools.linkLasso) store.setLinkLasso(false);
  }

  return { onClick, onPointerMove, cancelAll };
}