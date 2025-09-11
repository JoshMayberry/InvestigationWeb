import { newId } from "./newId";

export interface CalculatedTrackGroup {
  id: string;
  kind: 'calc-group';
  type: 'horizontal-lines' | 'spiral-set';
  params: any;          // type-specific
  colorPalette: string[];
  locked?: boolean;
  // cached bbox (axis-aligned for now)
  bbox?: { x:number; y:number; w:number; h:number };
}

function rotate(x:number,y:number, ang:number){
  const c = Math.cos(ang), s=Math.sin(ang);
  return { x: x*c - y*s, y: x*s + y*c };
}

export function generateGroupTracks(group:CalculatedTrackGroup){
  if (group.type === 'horizontal-lines') return genHorizontal(group);
  if (group.type === 'spiral-set') return genSpiral(group);
  return [];
}

function genHorizontal(group:CalculatedTrackGroup){
  const { cx, cy, width, lines, gap, rotation=0 } = group.params;
  const n = Math.max(1, lines||1);
  const g = gap ?? 60;
  const w = width ?? 600;
  const firstY = -((n-1)/2)*g;
  const tracks:any[] = [];
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for (let i=0;i<n;i++){
    const localY = firstY + i*g;
    const p1r = rotate(-w/2, localY, rotation);
    const p2r = rotate(w/2, localY, rotation);
    const x1 = cx + p1r.x, y1 = cy + p1r.y;
    const x2 = cx + p2r.x, y2 = cy + p2r.y;
    minX=Math.min(minX,x1,x2); maxX=Math.max(maxX,x1,x2);
    minY=Math.min(minY,y1,y2); maxY=Math.max(maxY,y1,y2);
    tracks.push({
      id: newId(),
      kind:'calc',
      groupId: group.id,
      type:'straight',
      p1:{ x:x1, y:y1 },
      p2:{ x:x2, y:y2 },
      color: group.colorPalette[i % group.colorPalette.length],
      locked:true,
      segments:1
    });
  }
  group.bbox = { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
  return tracks;
}

function genSpiral(group:CalculatedTrackGroup){
  // params: cx, cy, turns, spirals, r0, k, samples
  const { cx, cy, turns=1, spirals=3, r0=30, k=55, samples=260, rotation=0 } = group.params;
  const startAngles = [];
  for (let i=0;i<spirals;i++){
    startAngles.push(rotation + (-Math.PI/6 + i*(2*Math.PI/spirals))); // seed angles
  }
  const ONE_TURN = 2*Math.PI;
  const TMAX = turns * ONE_TURN;
  const tracks:any[] = [];
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  function spiralPath(start:number){
    const pts:{x:number;y:number}[] = [];
    for (let i=0;i<samples;i++){
      const f = i/(samples-1);
      const t = f * TMAX;
      const theta = start + t;
      const r = r0 + k*t;
      const x = cx + r*Math.cos(theta);
      const y = cy + r*Math.sin(theta);
      pts.push({ x,y });
      minX=Math.min(minX,x); maxX=Math.max(maxX,x);
      minY=Math.min(minY,y); maxY=Math.max(maxY,y);
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i=1;i<pts.length;i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    return { d, first: pts[0], last: pts[pts.length-1] };
  }
  for (let i=0;i<spirals;i++){
    const { d, first, last } = spiralPath(startAngles[i]);
    tracks.push({
      id: newId(),
      kind:'calc',
      groupId: group.id,
      type:'path',
      pathD: d,
      p1:{ x:first.x, y:first.y },
      p2:{ x:last.x, y:last.y },
      color: group.colorPalette[i % group.colorPalette.length],
      locked:true,
      segments:1
    });
  }
  group.bbox = { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
  return tracks;
}

export function defaultHorizontalGroup():CalculatedTrackGroup{
  return {
    id: newId(),
    kind:'calc-group',
    type:'horizontal-lines',
    colorPalette:['#38bdf8','#22d3ee','#818cf8','#f472b6'],
    params:{
      cx:0, cy:0, width:800, lines:4, gap:120, rotation:0
    }
  };
}

export function defaultSpiralGroup():CalculatedTrackGroup{
  return {
    id: newId(),
    kind:'calc-group',
    type:'spiral-set',
    colorPalette:['#ef4444','#f59e0b','#10b981'],
    params:{
      cx:0, cy:0, turns:1.0, spirals:3, r0:30, k:55, samples:260, rotation:0
    }
  };
}