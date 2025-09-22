export function useKeys({ runtime, store }:{ runtime:any; store:any }){
  const state = { shiftDown:false, altDown:false };
  function onKey(e: KeyboardEvent){
    if (e.key === "Shift") state.shiftDown = e.type === "keydown";
    if (e.key === "Alt") state.altDown = e.type === "keydown";
    if (e.key === "Escape") {
      if (runtime.controllers.drag?.ghost?.mode === "drag-node") return;
      runtime.controllers.nodePlacement?.cancel?.();
      if (store.tools.addLink) { runtime.controllers.linkPlacement.cancel(); store.setAddLink(false); }
      if (store.tools.addFreeNode) store.setAddFreeNode(false);
      if (store.tools.placeStagedId) store.setPlaceStaged(null);
      if (store.tools.addTrack) { runtime.controllers.trackPlacement.cancel(); store.setAddTrack(false); }
      if (store.tools.linkLasso) { runtime.controllers.linkPlacement.cancel(); store.setLinkLasso(false); }
      if (store.tools.linkCutter) { store.setLinkCutter(false); } // NEW
    }
  }
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKey);
  function dispose(){ window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); }
  return { state, dispose };
}