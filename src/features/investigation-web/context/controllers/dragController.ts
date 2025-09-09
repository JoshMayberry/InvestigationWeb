import { reactive } from "vue";
import type { ViewController } from "./viewController";

export type GhostMode = "none"|"drag-node"|"add-free"|"place-staged";

export interface GhostState {
  active:boolean;
  mode:GhostMode;
  sourceId:string|null;
  x:number; y:number;
  r:number;
  color:string;
  label:string;
  invalid:boolean;
  reason:string|null;
}

export interface DragController {
  ghost: GhostState;
  setValidator(fn:(g:GhostState)=>{ valid:boolean; reason?:string }): void;
  startNode(nodeId:string, node:{ x:number; y:number; r:number; color?:string; label?:string }): void;
  startPlacement(p:{ x:number; y:number; r?:number; color?:string; label?:string; mode:"add-free"|"place-staged" }): void;
  updatePointer(clientX:number, clientY:number): void;
  cancel(): void;
  isActive(): boolean;
  isInvalid(): boolean;
  kind(): GhostMode;
  setSnapper(fn: (x:number,y:number)=>{x:number;y:number} | null): void;
}

export function createDragController(view:ViewController): DragController {
  const ghost = reactive<GhostState>({
    active:false, mode:"none", sourceId:null,
    x:0, y:0, r:14, color:"#60a5fa", label:"",
    invalid:false, reason:null
  });

  let validator:(g:GhostState)=>{ valid:boolean; reason?:string } = () => ({ valid:true });
  let snapper: ((x:number,y:number)=>{x:number;y:number}) | null = null;

  function validate(){
    if (!ghost.active) return;
    const v = validator(ghost);
    ghost.invalid = !v.valid;
    ghost.reason = v.reason || null;
  }

  function setValidator(fn:(g:GhostState)=>{ valid:boolean; reason?:string }){
    validator = fn || (()=>({ valid:true }));
    validate();
  }

  function setSnapper(fn:any){ snapper = typeof fn === "function" ? fn : null; }

  function applySnap(w:{x:number;y:number}){ return snapper ? snapper(w.x, w.y) : w; }

  function startNode(nodeId:string, node:{ x:number; y:number; r:number; color?:string; label?:string }){
    ghost.active = true;
    ghost.mode = "drag-node";
    ghost.sourceId = nodeId;
    ghost.x = node.x; ghost.y = node.y;
    ghost.r = node.r;
    ghost.color = node.color || "#60a5fa";
    ghost.label = node.label || "";
    validate();
  }

  function startPlacement(p:{ x:number; y:number; r?:number; color?:string; label?:string; mode:"add-free"|"place-staged" }){
    ghost.active = true;
    ghost.mode = p.mode;
    ghost.sourceId = null;
    const w = applySnap({ x:p.x, y:p.y });
    ghost.x = w.x; ghost.y = w.y;
    ghost.r = p.r ?? 14;
    ghost.color = p.color || "#10b981";
    ghost.label = p.label || "";
    validate();
  }

  function updatePointer(clientX:number, clientY:number){
    if (!ghost.active) return;
    const w = view.worldFromClient(clientX, clientY);
    const s = applySnap(w);
    ghost.x = s.x; ghost.y = s.y;
    validate();
  }

  function cancel(){
    if (!ghost.active) return;
    ghost.active = false;
    ghost.mode = "none";
    ghost.sourceId = null;
    ghost.invalid = false;
    ghost.reason = null;
  }

  return {
    ghost,
    setValidator,
    startNode,
    startPlacement,
    updatePointer,
    cancel,
    isActive: () => ghost.active,
    isInvalid: () => ghost.active && ghost.invalid,
    kind: () => ghost.mode,
    setSnapper,
  };
}