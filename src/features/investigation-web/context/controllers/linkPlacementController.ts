import type { ViewController } from "./viewController";
import { reactive } from "vue";

export interface LinkPlacementGhost {
  active: boolean;
  step: 0 | 1 | 2;
  sourceId: string | null;
  targetHoverId: string | null;
  pointer: { x: number; y: number };
  type: string;
  color: string;
  stroke: string;
  valid: boolean;
  reason: string | null;
}

export interface LinkPlacementController {
  ghost: LinkPlacementGhost;
  isActive(): boolean;
  start(type: string, color: string, stroke: string): void;
  setSource(nodeId: string): void;
  pointerMove(clientX: number, clientY: number): void;
  hoverNode(nodeId: string | null): void;
  tryCommit(nodeId: string, opts: { shift: boolean }): boolean;
  cancel(): void;
  setStore(store: any): void;
}

export function createLinkPlacementController(
  view: ViewController,
  store: any,
  selection?: { set: (id: string) => void }
): LinkPlacementController {
  let storeRef: any = store;

  const ghost = reactive<LinkPlacementGhost>({
    active: false,
    step: 0,
    sourceId: null,
    targetHoverId: null,
    pointer: { x: 0, y: 0 },
    type: "straight",
    color: "#64748b",
    stroke: "solid",
    valid: false,
    reason: null
  });

  function setStore(s: any) { storeRef = s; }

  function reset(full = true) {
    ghost.active = !full;
    ghost.step = 0;
    ghost.sourceId = null;
    ghost.targetHoverId = null;
    ghost.valid = false;
    ghost.reason = null;
  }

  function isActive() { return ghost.active; }

  function start(type: string, color: string, stroke: string) {
    ghost.active = true;
    ghost.step = 0;
    ghost.type = type;
    ghost.color = color;
    ghost.stroke = stroke;
  }

  function setSource(nodeId: string) {
    if (!ghost.active) return;
    ghost.sourceId = nodeId;
    ghost.step = 1;
    ghost.valid = false;
    ghost.reason = null;
  }

  function pointerMove(clientX: number, clientY: number) {
    if (!ghost.active) return;
    const w = view.worldFromClient(clientX, clientY);
    ghost.pointer.x = w.x;
    ghost.pointer.y = w.y;
    validate();
  }

  function hoverNode(nodeId: string | null) {
    if (!ghost.active || ghost.step === 0) return;
    ghost.targetHoverId = nodeId;
    validate();
  }

  function validate() {
    if (ghost.step !== 1) { ghost.valid = false; return; }
    if (!ghost.sourceId || !ghost.targetHoverId) {
      ghost.valid = false; ghost.reason = "need-target"; return;
    }
    if (ghost.sourceId === ghost.targetHoverId) {
      ghost.valid = false; ghost.reason = "self"; return;
    }
    const links = storeRef?.links || [];
    const a = ghost.sourceId;
    const b = ghost.targetHoverId;
    const dup = links.some((l: any) =>
      (l.from === a && l.to === b) || (l.from === b && l.to === a)
    );
    if (dup) { ghost.valid = false; ghost.reason = "duplicate"; return; }
    ghost.valid = true;
    ghost.reason = null;
  }

  function tryCommit(nodeId: string, opts: { shift: boolean }) {
    if (!ghost.active) return false;
    if (ghost.step === 0) {
      setSource(nodeId);
      return false;
    }
    if (ghost.step === 1) {
      hoverNode(nodeId);
      if (!ghost.valid || !storeRef) return false;
      const linkId = storeRef.addLink?.({
        type: ghost.type,
        from: ghost.sourceId!,
        to: nodeId,
        color: ghost.color,
        stroke: ghost.stroke
      });
      if (linkId && selection?.set) selection.set(linkId);
      if (opts.shift) {
        const t = ghost.type; const c = ghost.color; const s = ghost.stroke;
        reset(false);
        start(t, c, s);
      } else {
        storeRef?.setAddLink?.(false);
        reset(true);
      }
      return !!linkId;
    }
    return false;
  }

  function cancel() {
    if (!ghost.active) return;
    reset(true);
  }

  return {
    ghost,
    isActive,
    start,
    setSource,
    pointerMove,
    hoverNode,
    tryCommit,
    cancel,
    setStore
  };
}