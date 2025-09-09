export function useStashOverlay({ runtime, store }:{ runtime:any; store:any }){
  const state = { rect: { x:0, y:0, w: store.settings?.stashZoneWidth ?? 120, h:0 } };

  function onResize(sz:{ w:number; h:number }){
    const w = Math.max(0, Number(store.settings?.stashZoneWidth ?? 120));
    state.rect = { x: Math.max(0, sz.w - w), y: 0, w, h: sz.h };
    runtime?.controllers?.stash?.setRect?.(state.rect);
    return state.rect;
  }

  function setWidth(next:number){
    const w = Math.max(0, Number(next || 0));
    state.rect.w = w;
    state.rect.x = Math.max(0, (runtime?.controllers?.view?.getSvgEl?.()?.clientWidth || 0) - w);
    runtime?.controllers?.stash?.setRect?.(state.rect);
  }

  return { onResize, setWidth, getRect: () => state.rect };
}