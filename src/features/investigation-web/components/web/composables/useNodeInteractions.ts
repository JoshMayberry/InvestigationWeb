export function useNodeInteractions({ runtime, store }:{ runtime:any; store:any }){
  function onClick(e:MouseEvent): boolean {
    if (!store?.policy?.canEditStructure) return false;
    const np = runtime.controllers.nodePlacement;

    // placing staged
    if (store.tools.placeStagedId) {
      const staged = store.staging.find((n:any)=> n.id === store.tools.placeStagedId);
      if (!staged) return true;
      if (!np?.isActive?.()) np.startStaged(staged.id, { r: staged.r, color: staged.color, label: staged.label }, e.clientX, e.clientY);
      if (runtime.controllers.drag?.ghost?.invalid) return true;
      const ok = np.commitAt(e.clientX, e.clientY);
      if (ok && !e.shiftKey) store.setPlaceStaged(null);
      return true;
    }

    // placing free
    if (store.tools.addFreeNode) {
      if (np?.isActive()) {
        if (runtime.controllers.drag?.ghost?.invalid) return true;
        const ok = np.commitAt(e.clientX, e.clientY);
        if (ok && !e.shiftKey) store.setAddFreeNode(false);
      } else {
        const d = store.settings.defaultNode;
        np.startFree({ r: d.r, color: d.color, label: d.label }, e.clientX, e.clientY);
        const ok = np.commitAt(e.clientX, e.clientY);
        if (ok && !e.shiftKey) store.setAddFreeNode(false);
      }
      return true;
    }

    return false;
  }
  function onPointerMove(e:PointerEvent){
    if (!store?.policy?.canEditStructure) return;
    const np = runtime.controllers.nodePlacement;
    const addFree = store.tools.addFreeNode;
    const placeId = store.tools.placeStagedId;

    if (!addFree && !placeId) {
      if (np.isActive()) np.cancel();
      return;
    }

    if (placeId) {
      const staged = store.staging.find((n:any)=> n.id === placeId);
      if (!staged) { if (np.activeMode?.() === "place-staged") np.cancel(); return; }
      if (np.activeMode?.() !== "place-staged") {
        np.startStaged(placeId, { r: staged.r, color: staged.color, label: staged.label }, e.clientX, e.clientY);
      } else {
        np.updatePointer(e.clientX, e.clientY);
      }
      return;
    }

    if (addFree) {
      const d = store.settings.defaultNode;
      if (np.activeMode?.() !== "add-free") {
        np.startFree({ r: d.r, color: d.color, label: d.label }, e.clientX, e.clientY);
      } else {
        np.updatePointer(e.clientX, e.clientY);
      }
    }
  }
  function onPointerLeave(e:PointerEvent){
    if (!store?.policy?.canEditStructure) return;
    const svg:any = (e.currentTarget as any) || null;
    if (runtime.controllers.nodePlacement.isActive()) {
      // best-effort cancel; view containment check is in original impl
      runtime.controllers.nodePlacement.cancel();
    }
  }
  function cancelAll(){
    const np = runtime.controllers?.nodePlacement;
    if (np?.isActive()) np.cancel();
    store.setAddFreeNode(false);
    store.setPlaceStaged(null);
  }
  return { onClick, onPointerMove, onPointerLeave, cancelAll };
}