export function useLinkInteractions({ runtime, store }:{ runtime:any; store:any }){
  function getHoveredNodeId(e?: PointerEvent | MouseEvent): string | null {
    // 1) Prefer hover controller id if it’s a node
    const hid = runtime?.controllers?.hover?.id || runtime?.controllers?.hover?.get?.();
    if (hid && (store.nodes || []).some((n:any) => n.id === hid)) return hid;
    // 2) Fallback from the DOM under pointer
    const el = (e?.target as Element | null) ?? (e ? document.elementFromPoint((e as any).clientX, (e as any).clientY) : null);
    const nodeEl = el?.closest?.("[data-id], .node") as HTMLElement | null;
    const id = nodeEl?.getAttribute?.("data-id") || nodeEl?.dataset?.id || null;
    if (id && (store.nodes || []).some((n:any) => n.id === id)) return id;
    return null;
  }

  function onClick(e:MouseEvent): boolean {
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
    // Swallow clicks while in addLink mode so background doesn’t clear selection
    e.stopPropagation();
    e.preventDefault();
    return true;
  }

  function onPointerMove(e:PointerEvent){
    const lp = runtime.controllers?.linkPlacement;
    if (!store.tools.addLink || !lp) return;
    lp.pointerMove(e.clientX, e.clientY);
    const nodeId = getHoveredNodeId(e);
    lp.hoverNode(nodeId);
  }

  function cancelAll(){
    const lp = runtime.controllers?.linkPlacement;
    if (lp?.isActive()) lp.cancel();
    store.setAddLink(false);
  }
  return { onClick, onPointerMove, cancelAll };
}