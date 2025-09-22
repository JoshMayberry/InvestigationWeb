import { reactive } from "vue";
import type { ViewController } from "./viewController";

export interface TrackPlacementGhost {
  active: boolean;
  step: 0 | 1 | 2;
  p1: { x:number; y:number } | null;
  p2: { x:number; y:number } | null;
  pointer: { x:number; y:number };
  color: string;
  valid: boolean;
  reason: string | null;
  snap: boolean; // Ctrl
}

export interface TrackPlacementController {
  ghost: TrackPlacementGhost;
  isActive(): boolean;
  start(color: string): void;
  // CHANGED: pass ctrl state for live snapping during move
  pointerMove(clientX:number, clientY:number, opts?:{ ctrl?: boolean; alt?: boolean }): void;
  tryCommitAt(clientX:number, clientY:number, opts:{ shift:boolean; ctrl:boolean; alt?:boolean }): string | null;
  cancel(): void;
  setStore(store:any): void;
}

function deg(a:number){ return a * 180 / Math.PI; }
function rad(a:number){ return a * Math.PI / 180; }

// UPDATED: snap to 15° increments around full circle
function snappedToAngles(from:{x:number;y:number}, to:{x:number;y:number}){
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx,dy) || 0;
  if (len === 0) return to;
  const th = Math.atan2(dy, dx);
  const twoPI = 2 * Math.PI;
  const thN = (th + twoPI) % twoPI;

  const step = Math.PI / 12; // 15°
  let best = 0, bestD = Infinity;
  for (let k = 0; k < 24; k++){
    const a = k * step;
    const d = Math.min(Math.abs(thN - a), twoPI - Math.abs(thN - a));
    if (d < bestD){ bestD = d; best = a; }
  }

  const nx = Math.cos(best), ny = Math.sin(best);
  return { x: from.x + nx*len, y: from.y + ny*len };
}

function segIntersect(a1:{x:number;y:number}, a2:{x:number;y:number}, b1:{x:number;y:number}, b2:{x:number;y:number}){
  function orient(p:{x:number;y:number}, q:{x:number;y:number}, r:{x:number;y:number}) {
    const v = (q.y - p.y)*(r.x - q.x) - (q.x - p.x)*(r.y - q.y);
    return Math.sign(v);
  }
  function onSeg(p:{x:number;y:number}, q:{x:number;y:number}, r:{x:number;y:number}) {
    return Math.min(p.x,r.x) - 1e-6 <= q.x && q.x <= Math.max(p.x,r.x) + 1e-6 &&
           Math.min(p.y,r.y) - 1e-6 <= q.y && q.y <= Math.max(p.y,r.y) + 1e-6;
  }
  const o1 = orient(a1,a2,b1), o2 = orient(a1,a2,b2), o3 = orient(b1,b2,a1), o4 = orient(b1,b2,a2);
  if (o1 !== o2 && o3 !== o4) return true; // proper intersection
  // colinear cases
  if (o1 === 0 && onSeg(a1,b1,a2)) return true;
  if (o2 === 0 && onSeg(a1,b2,a2)) return true;
  if (o3 === 0 && onSeg(b1,a1,b2)) return true;
  if (o4 === 0 && onSeg(b1,a2,b2)) return true;
  return false;
}

function snapToGridIf(p:{x:number;y:number}, settings:any, alt:boolean){
  if (!settings?.enableGrid || alt) return p;
  const step = settings.gridSize || 16;
  const x = Math.round(p.x / step) * step;
  const y = Math.round(p.y / step) * step;
  return { x, y };
}

export function createTrackPlacementController(view:ViewController, store:any): TrackPlacementController {
  let storeRef:any = store;
  const ghost = reactive<TrackPlacementGhost>({
    active:false, step:0, p1:null, p2:null,
    pointer:{ x:0, y:0 }, color:"#93c5fd",
    valid:false, reason:null, snap:false
  });

  function setStore(s:any){ storeRef = s; }
  function isActive(){ return ghost.active; }

  function start(color:string){
    ghost.active = true;
    ghost.step = 0;
    ghost.p1 = null; ghost.p2 = null;
    ghost.pointer.x = 0; ghost.pointer.y = 0;
    ghost.color = color;
    ghost.valid = false; ghost.reason = null;
  }

  function pointerMove(clientX:number, clientY:number, opts?:{ ctrl?: boolean; alt?: boolean }){
    if (!ghost.active) return;
    const w = view.worldFromClient(clientX, clientY);
    const alt = !!opts?.alt;
    ghost.pointer = snapToGridIf({ x:w.x, y:w.y }, storeRef?.settings, alt);
    if (typeof opts?.ctrl === "boolean") ghost.snap = !!opts.ctrl;
    if (ghost.step === 1 && ghost.p1){
      const dst = ghost.snap ? snappedToAngles(ghost.p1, ghost.pointer) : ghost.pointer;
      ghost.p2 = dst;
      validate();
    }
  }

  function validate(){
    if (!storeRef) { ghost.valid = false; return; }
    if (ghost.step !== 1 || !ghost.p1 || !ghost.p2){ ghost.valid = false; return; }
    if (!storeRef.settings?.preventTrackCrossing){ ghost.valid = true; return; }
    // test against existing tracks
    for (const t of (storeRef.tracks || [])){
      const A1 = ghost.p1, A2 = ghost.p2;
      const B1 = t.p1, B2 = t.p2;
      // allow touching at endpoints
      const touchesEndpoint =
        (Math.hypot(A1.x-B1.x,A1.y-B1.y) < 1e-4) || (Math.hypot(A1.x-B2.x,A1.y-B2.y) < 1e-4) ||
        (Math.hypot(A2.x-B1.x,A2.y-B1.y) < 1e-4) || (Math.hypot(A2.x-B2.x,A2.y-B2.y) < 1e-4);
      if (touchesEndpoint) continue;
      if (segIntersect(A1,A2,B1,B2)) { ghost.valid = false; ghost.reason = "cross"; return; }
    }
    ghost.valid = true; ghost.reason = null;
  }

  function tryCommitAt(clientX:number, clientY:number, opts:{ shift:boolean; ctrl:boolean; alt?:boolean }): string | null {
    if (!ghost.active) return null;
    const w = view.worldFromClient(clientX, clientY);
    const alt = !!opts.alt;
    if (ghost.step === 0){
      ghost.p1 = snapToGridIf({ x:w.x, y:w.y }, storeRef?.settings, alt);
      ghost.step = 1;
      ghost.p2 = null;
      ghost.snap = !!opts.ctrl;
      return null;
    }
    if (ghost.step === 1){
      ghost.snap = !!opts.ctrl;
      const raw = { x:w.x, y:w.y };
      const snapped = snapToGridIf(raw, storeRef?.settings, alt);
      const p2 = ghost.snap ? snappedToAngles(ghost.p1!, snapped) : snapped;
      ghost.p2 = p2;
      validate();
      if (!ghost.valid) return null;
      const id = storeRef?.addFreeTrack?.({ p1: ghost.p1!, p2: ghost.p2!, color: ghost.color, locked: false }) || null;
      if (opts.shift){
        const color = ghost.color;
        start(color);
      } else {
        ghost.active = false; ghost.step = 0; ghost.p1 = null; ghost.p2 = null; ghost.valid = false;
      }
      return id;
    }
    return null;
  }

  function cancel(){
    if (!ghost.active) return;
    ghost.active = false;
    ghost.step = 0;
    ghost.p1 = null; ghost.p2 = null;
    ghost.valid = false; ghost.reason = null;
  }

  return { ghost, isActive, start, pointerMove, tryCommitAt, cancel, setStore };
}