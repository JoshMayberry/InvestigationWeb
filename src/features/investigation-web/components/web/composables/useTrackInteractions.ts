export function useTrackInteractions({ runtime, store, getSvg }:{ runtime:any; store:any; getSvg:()=>SVGSVGElement|null }){
  function onClick(e:MouseEvent): boolean {
    if (!store?.policy?.canEditStructure) return false;
    if (!store.tools.addTrack) return false;
    const tp = runtime.controllers.trackPlacement;
    if (tp && !tp.isActive()){
      const color = store.trackDraft?.color || "#93c5fd";
      tp.start(color);
      store.setCurrentEditState?.("add-track");
    }
    const id = tp.tryCommitAt(e.clientX, e.clientY, { shift: e.shiftKey, ctrl: e.ctrlKey, alt: (e as any).altKey } as any);
    if (id && !e.shiftKey) {
      runtime.controllers.selection.set(id);
      store.setAddTrack(false);
      store.setCurrentEditState?.("edit-selected-node");
    }
    return true;
  }
  function onPointerMove(e:PointerEvent){
    if (!store?.policy?.canEditStructure) return;
    if (store.tools.addTrack) {
      const tp = runtime.controllers.trackPlacement;
      if (tp) tp.pointerMove(e.clientX, e.clientY, { ctrl: e.ctrlKey, alt: (e as any).altKey });
    }
  }
  function cancelAll(){
    const tp = runtime.controllers?.trackPlacement;
    if (tp?.isActive()) tp.cancel();
    store.setAddTrack(false);
  }
  const off = store.$watch ? store.$watch(()=>store.tools.addTrack, (on:boolean)=>{
    const tp = runtime.controllers?.trackPlacement;
    if (on) { const color = store.trackDraft?.color || "#93c5fd"; tp?.start?.(color); store.setCurrentEditState?.("add-track"); }
    else { if (tp?.isActive()) tp.cancel(); store.setCurrentEditState?.("none"); }
  }) : null;
  function dispose(){ off && off(); }
  return { onClick, onPointerMove, cancelAll, dispose };
}