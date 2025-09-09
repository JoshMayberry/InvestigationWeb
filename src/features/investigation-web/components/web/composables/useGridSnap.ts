export function useGridSnap({ runtime, store, keys }:{ runtime:any; store:any; keys:{ state:{ altDown:boolean }}}){
  const drag = runtime?.controllers?.drag;
  function snap(x:number,y:number){
    const s = store.settings;
    if (!s.enableGrid || keys.state.altDown) return { x, y };
    const step = s.gridSize || 16;
    return { x: Math.round(x/step)*step, y: Math.round(y/step)*step };
  }
  drag?.setSnapper?.((x:number,y:number)=> snap(x,y));
  return {};
}