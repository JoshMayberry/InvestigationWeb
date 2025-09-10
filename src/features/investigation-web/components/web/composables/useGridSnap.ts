import { projectPointToTrack } from "@features/investigation-web/stores/util/trackGeometry";

export function useGridSnap({ runtime, store, keys }:{ runtime:any; store:any; keys:{ state:{ altDown:boolean }}}){
  const drag = runtime?.controllers?.drag;
  function snapGrid(x:number,y:number){
    const s = store.settings;
    if (!s.enableGrid || keys.state.altDown) return { x, y };
    const step = s.gridSize || 16;
    return { x: Math.round(x/step)*step, y: Math.round(y/step)*step };
  }
  function slideAlongTracks(x:number,y:number){
    const s = store.settings;
    if (!s.slideAlongTracks) return { x, y };
    const ghost = drag?.ghost;
    if (!ghost || ghost.mode !== "drag-node") return { x, y };
    const node = store.nodes?.find((n:any)=> n.id === ghost.sourceId);
    if (!node || node.kind === "snap") return { x, y }; // only free nodes
    const threshold = s.slideTrackThreshold || 24;
    let best = null as null | { dist:number; px:number; py:number };
    const tracks = store.tracks || [];
    for (const t of tracks){
      const proj = projectPointToTrack(t, x, y);
      if (proj.dist <= threshold && (!best || proj.dist < best.dist)){
        best = { dist: proj.dist, px: proj.x, py: proj.y };
      }
    }
    if (best) return { x: best.px, y: best.py };
    return { x, y };
  }
  drag?.setSnapper?.((x:number,y:number)=>{
    // apply grid first, then track slide (so slide overrides minor grid jitter)
    const g = snapGrid(x,y);
    const t = slideAlongTracks(g.x, g.y);
    return t;
  });
  return {};
}

// helpers
function projectPointToSegment(p:{x:number;y:number}, a:{x:number;y:number}, b:{x:number;y:number}){
  const vx = b.x - a.x, vy = b.y - a.y;
  const len2 = vx*vx + vy*vy || 1;
  let t = ((p.x - a.x)*vx + (p.y - a.y)*vy)/len2;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const x = a.x + vx * t;
  const y = a.y + vy * t;
  const dx = p.x - x, dy = p.y - y;
  const dist = Math.hypot(dx, dy);
  return { x, y, dist, t };
}