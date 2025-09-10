import { projectPointToTrack, pointAtTrackPosition } from "@features/investigation-web/stores/util/trackGeometry";

export function useNodeInteractions({ runtime, store }:{ runtime:any; store:any }){
  function projectToTrack(w:{x:number;y:number}) {
    let best = null as null | { track:any; t:number; dist:number; x:number; y:number };
    for (const t of (store.tracks||[])){
      const proj = projectPointToTrack(t, w.x, w.y);
      if (!best || proj.dist < best.dist){
        best = { track: t, t: proj.t, dist: proj.dist, x: proj.x, y: proj.y };
      }
    }
    return best;
  }

  function handleSnapPlacementClick(e:MouseEvent){
    const ghost = store.snapPlacement;
    if (!ghost.active || !ghost.valid) return false;
    if (store.tools.addSnapNode){
      const track = store.tracks.find((t:any)=> t.id===ghost.trackId);
      const segCount = Math.max(1, track?.segments||1);
      const segIdx = Math.min(segCount-1, Math.floor(ghost.t * segCount));
      const snap = store.addSnapNode({ trackId: ghost.trackId, tHint: ghost.t, segmentHint: segIdx });
      runtime.controllers.selection.set(snap.id);
      if (!e.shiftKey) store.setAddSnapNode(false);
    } else if (store.tools.placeStagedSnapId){
      const snap = store.placeSnapFromStaging(store.tools.placeStagedSnapId, ghost.trackId, ghost.t);
      runtime.controllers.selection.set(snap?.id || null);
      if (!e.shiftKey) store.setPlaceStagedSnap(null);
    }
    store.clearSnapGhost();
    return true;
  }

  function onClick(e:MouseEvent): boolean {
    if (!store?.policy?.canEditStructure) return false;

    // snap node placement
    if (store.tools.addSnapNode || store.tools.placeStagedSnapId){
      if (handleSnapPlacementClick(e)) return true;
    }

    const np = runtime.controllers.nodePlacement;

    // placing staged free
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

    // snap placement ghost
    if (store.tools.addSnapNode || store.tools.placeStagedSnapId){
      const view = runtime.controllers.view;
      const w = view.worldFromClient(e.clientX, e.clientY);
      const proj = projectToTrack(w);
      const thresh = store.settings.snapPlacementThreshold || store.settings.slideTrackThreshold || 32;
      if (proj && proj.dist <= thresh){
        const track = proj.track;
        const tHint = proj.t;          // param along path (0..1)
        const snaps = (store.nodes||[])
          .filter((n:any)=> n.kind==="snap" && n.trackId === track.id)
          .sort((a:any,b:any)=> (a.trackPosition ?? 0) - (b.trackPosition ?? 0));

        // find insertion index comparing against existing trackPosition
        let insertIdx = snaps.findIndex(s => tHint < (s.trackPosition ?? 0.5));
        if (insertIdx === -1) insertIdx = snaps.length;

        const previewLayout = !!store.settings.snapPreviewLayout;

        let displayPosT: number;
        let finalPosT: number | undefined;

        if (previewLayout){
          // Even spacing preview (what layout will become after commit)
            const countAfter = snaps.length + 1;
            finalPosT = (insertIdx + 1) / (countAfter + 1);
            displayPosT = finalPosT;
        } else {
          // Show live cursor projection
          displayPosT = tHint;
        }

        const pt = pointAtTrackPosition(track, displayPosT);

        store.setSnapGhost({
          active: true,
          x: pt.x,
          y: pt.y,
          trackId: track.id,
          t: tHint,             // keep raw hint for insertion logic
          valid: true,
          staged: !!store.tools.placeStagedSnapId,
          insertIndex: insertIdx,
          finalPosT
        });
      } else {
        store.setSnapGhost({
          active: true,
          x: w.x, y: w.y,
          trackId: null,
          t: 0,
          valid: false,
          staged: !!store.tools.placeStagedSnapId
        });
      }
      return;
    } else if (store.snapPlacement.active){
      store.clearSnapGhost();
    }

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
    if (store.snapPlacement.active) store.clearSnapGhost();
    const np = runtime.controllers.nodePlacement;
    if (np.isActive()) np.cancel();
  }

  function cancelAll(){
    const np = runtime.controllers?.nodePlacement;
    if (np?.isActive()) np.cancel();
    store.setAddFreeNode(false);
    store.setPlaceStaged(null);
    store.clearSnapGhost();
  }

  return { onClick, onPointerMove, onPointerLeave, cancelAll };
}