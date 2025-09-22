import type { DragController } from "./dragController";
import type { SelectionController } from "./selectionController";
import type { ViewController } from "./viewController";

/**
 * NodePlacementController
 * Handles placing:
 *  - Free nodes
 *  - Staged nodes
 *
 * Controller now maintains its own lightweight state so commit does not depend
 * on store.tools flags (those are UI concerns).
 */
export interface NodePlacementController {
  activeMode(): "none" | "add-free" | "place-staged";
  isActive(): boolean;
  startFree(defaultNode:{ r:number; color:string; label?:string }, clientX:number, clientY:number): void;
  startStaged(stagedId:string, staged:{ r:number; color:string; label?:string }, clientX:number, clientY:number): void;
  updatePointer(clientX:number, clientY:number): void;
  commitAt(clientX:number, clientY:number): boolean;
  cancel(): void;
  setStore(store:any): void;
  debugState(): any;
}

interface InternalState {
  mode:"none"|"add-free"|"place-staged";
  stagedId:string|null;
}

export function createNodePlacementController(
  drag:DragController,
  selection:SelectionController,
  view:ViewController,
  store:any
): NodePlacementController {

  const state: InternalState = { mode:"none", stagedId:null };
  let storeRef:any = store;

  function requireStore(op:string){
    if (!storeRef) {
      console.error(`[nodePlacement] store is null during ${op}. Did you call runtime.setStore()?`);
      return false;
    }
    return true;
  }

  function setStore(s:any){
    storeRef = s;
  }

  function activeMode(){
    const k = drag.kind();
    if (!drag.isActive()) return "none";
    return (k === "add-free" || k === "place-staged") ? k : "none";
  }

  function setState(mode:InternalState["mode"], stagedId:string|null){
    state.mode = mode;
    state.stagedId = stagedId;
  }

  function startFree(defaultNode:{ r:number; color:string; label?:string }, clientX:number, clientY:number){
    const w = view.worldFromClient(clientX, clientY);
    drag.startPlacement({
      x:w.x, y:w.y,
      r: defaultNode.r,
      color: defaultNode.color,
      label: defaultNode.label || "",
      mode:"add-free"
    });
    setState("add-free", null);
  }

  function startStaged(stagedId:string, staged:{ r:number; color:string; label?:string }, clientX:number, clientY:number){
    const w = view.worldFromClient(clientX, clientY);
    drag.startPlacement({
      x:w.x, y:w.y,
      r: staged.r,
      color: staged.color,
      label: staged.label || "",
      mode:"place-staged"
    });
    setState("place-staged", stagedId);
  }

  function updatePointer(clientX:number, clientY:number){
    drag.updatePointer(clientX, clientY);
  }

  function commitAt(_clientX:number, _clientY:number){
    if (!drag.isActive() || drag.isInvalid()) return false;
    const mode = state.mode;
    const gx = drag.ghost.x;
    const gy = drag.ghost.y;
    const r  = drag.ghost.r;
    const color = drag.ghost.color;
    const label = drag.ghost.label;

    if (mode === "add-free"){
      if (!requireStore("add-free commit")) { drag.cancel(); setState("none", null); return false; }
      if (typeof storeRef.addNode !== "function"){
        console.error("[nodePlacement] store.addNode missing");
        drag.cancel(); setState("none", null); return false;
      }
      const n = storeRef.addNode({ x: gx, y: gy, r, color, label });
      selection.set(n?.id || null);
      drag.cancel();
      setState("none", null);
      return true;
    }
    if (mode === "place-staged"){
      if (!requireStore("place-staged commit")) { drag.cancel(); setState("none", null); return false; }
      if (!state.stagedId){
        console.error("[nodePlacement] stagedId missing at commit");
        drag.cancel(); setState("none", null); return false;
      }
      if (typeof storeRef.placeFromStaging !== "function"){
        console.error("[nodePlacement] store.placeFromStaging missing");
        drag.cancel(); setState("none", null); return false;
      }
      const placed = storeRef.placeFromStaging(state.stagedId, gx, gy);
      selection.set(placed?.id || null);
      if (storeRef.tools?.placeStagedId === state.stagedId && typeof storeRef.setPlaceStaged === "function"){
        storeRef.setPlaceStaged(null);
      }
      drag.cancel();
      setState("none", null);
      return true;
    }
    return false;
  }

  function cancel(){
    if (drag.isActive()) drag.cancel();
    setState("none", null);
  }

  return {
    activeMode,
    isActive: () => activeMode() !== "none",
    startFree,
    startStaged,
    updatePointer,
    commitAt,
    cancel,
    setStore,
    debugState: () => ({ ...state, ghostMode: drag.kind(), active: drag.isActive(), hasStore: !!storeRef })
  };
}