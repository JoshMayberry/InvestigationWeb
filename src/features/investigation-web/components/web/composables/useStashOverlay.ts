export function useStashOverlay({ runtime, store }: { runtime:any; store:any }) {
  const state = { rect: { x:0, y:0, w:120, h:0 }, canvas:{ w:0, h:0 } };
  function update() {
    state.rect = { x: Math.max(0, state.canvas.w - state.rect.w), y: 0, w: state.rect.w, h: state.canvas.h };
    runtime?.controllers?.stash?.setRect(state.rect);
    return state.rect;
  }
  function onResize(sz:{w:number;h:number}){ state.canvas = { w:sz.w, h:sz.h }; return update(); }
  return { onResize, get rect(){ return state.rect; } };
}