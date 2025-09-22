import { ref } from "vue";
export interface UndoCommand {
  do(): void;
  undo(): void;
  label?: string;
  _coalesceKey?: string;
  _merge?(next: UndoCommand): boolean;
  [k: string]: any;
}
export interface UndoController {
  push(cmd: UndoCommand): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  stackSize(): number;
  peekUndo(): UndoCommand | undefined;
  peekRedo(): UndoCommand | undefined;
  clear(): void;
  undoDepth: ReturnType<typeof ref<number>>;
  redoDepth: ReturnType<typeof ref<number>>;
}
export function createUndoController(getWindowMs: () => number): UndoController {
  const stack: UndoCommand[] = [];
  const redoStack: UndoCommand[] = [];
  const undoDepth = ref(0);
  const redoDepth = ref(0);
  let lastTime = 0;
  function updateDepths(){
    undoDepth.value = stack.length;
    redoDepth.value = redoStack.length;
  }
  function tryCoalesce(cmd: UndoCommand): boolean {
    if (!cmd._coalesceKey) return false;
    const top = stack[stack.length - 1];
    if (!top || top._coalesceKey !== cmd._coalesceKey) return false;
    const now = Date.now();
    const win = getWindowMs();
    if (now - lastTime > win) return false;
    const applyMerge = () => {
      lastTime = now;
      redoStack.length = 0;
      updateDepths();
      return true;
    };
    if (typeof top._merge === "function" && top._merge(cmd)) return applyMerge();
    if (top._coalesceKey.startsWith("node-prop:")) { top.after = cmd.after; top.do = cmd.do; return applyMerge(); }
    if (top._coalesceKey.startsWith("default-prop:")) { top.after = cmd.after; top.do = cmd.do; return applyMerge(); }
    if (top._coalesceKey.startsWith("move-node:")) { top.after = cmd.after; top.do = cmd.do; return applyMerge(); }
    return false;
  }
  return {
    push(cmd: UndoCommand) {
      cmd.do();
      if (tryCoalesce(cmd)) return;
      stack.push(cmd);
      redoStack.length = 0;
      lastTime = Date.now();
      updateDepths();
    },
    undo() {
      const c = stack.pop();
      if (c) {
        c.undo();
        redoStack.push(c);
        updateDepths();
      }
    },
    redo() {
      const c = redoStack.pop();
      if (c) {
        c.do();
        stack.push(c);
        updateDepths();
      }
    },
    canUndo() { return undoDepth.value > 0; },
    canRedo() { return redoDepth.value > 0; },
    stackSize() { return stack.length; },
    peekUndo() { return stack[stack.length - 1]; },
    peekRedo() { return redoStack[redoStack.length - 1]; },
    clear() {
      stack.length = 0;
      redoStack.length = 0;
      lastTime = 0;
      updateDepths();
    },
    undoDepth,
    redoDepth
  };
}