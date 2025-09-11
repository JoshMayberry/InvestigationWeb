export function curvedPath(l:any, getNode:(id:string)=>any): string | null {
  const a = getNode(l.from); const b = getNode(l.to);
  if (!a || !b) return null;
  const pad = l.pad || 0;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
  const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
  const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;
  let ctrls: {x:number;y:number}[] = [];
  if (Array.isArray(l.midControls) && l.midControls.length) {
    ctrls = l.midControls.map((c:any) => {
      const t = Math.max(0, Math.min(100, Number(c.t))) / 100;
      const off = Math.max(-100, Math.min(100, Number(c.off))) / 100;
      return {
        x: s.x + ux * (t * segLen) + nx * (off * segLen),
        y: s.y + uy * (t * segLen) + ny * (off * segLen)
      };
    });
  } else if (Array.isArray(l.midpoints) && l.midpoints.length) {
    ctrls = l.midpoints.slice();
  }
  const pts = [s, ...ctrls, e];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  if (pts.length === 2) { d += ` L ${pts[1].x} ${pts[1].y}`; return d; }
  for (let i = 1; i < pts.length - 1; i++) {
    const ctrl = pts[i];
    const next = pts[i+1];
    const end = i < pts.length - 2 ? { x:(ctrl.x+next.x)/2, y:(ctrl.y+next.y)/2 } : next;
    d += ` Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
  }
  return d;
}

export function trackCurvedPath(track:any): string {
  const { p1, p2 } = track;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx,dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  const ctrls = (track.midControls??[]).map((c:any)=>{
    const tt = Math.min(1, Math.max(0,(c.t??50)/100));
    const off = ((c.off??0)/100);
    return {
      x: p1.x + ux*(tt*dist) + nx*(off*dist),
      y: p1.y + uy*(tt*dist) + ny*(off*dist)
    };
  });
  const pts = [p1, ...ctrls, p2];
  if (pts.length === 2) return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1;i<pts.length-1;i++){
    const c = pts[i], n = pts[i+1];
    const end = i < pts.length - 2 ? { x:(c.x+n.x)/2, y:(c.y+n.y)/2 } : n;
    d += ` Q ${c.x} ${c.y} ${end.x} ${end.y}`;
  }
  return d;
}

export function trackCurvedPointAt(track:any, s:number){
  s = Math.min(1, Math.max(0,s));
  const { p1, p2 } = track;
  const ctrls = (track.midControls??[]);
  if (!ctrls.length){
    return {
      x: p1.x + (p2.x-p1.x)*s,
      y: p1.y + (p2.y-p1.y)*s
    };
  }
  // Simple piecewise linear between generated points (approx)
  const path = trackCurvedPath(track);
  // Reuse quick poly approx via splitting on commands
  const pts: {x:number;y:number}[] = [];
  const tokens = path.split(/[MLQ]/).map(t=>t.trim()).filter(Boolean);
  for (const tok of tokens){
    const nums = tok.split(/[\s,]+/).map(Number).filter(n=>Number.isFinite(n));
    for (let i=0;i<nums.length; i+=2){
      if (nums[i+1]!=null) pts.push({ x:nums[i], y:nums[i+1] });
    }
  }
  if (pts.length < 2) return { x:p1.x, y:p1.y };
  // cumulative
  let total = 0;
  const lens:number[] = [];
  for (let i=0;i<pts.length-1;i++){
    const L = Math.hypot(pts[i+1].x-pts[i].x, pts[i+1].y-pts[i].y);
    lens.push(L);
    total += L;
  }
  const target = s * total;
  let acc = 0;
  for (let i=0;i<lens.length;i++){
    if (acc + lens[i] >= target){
      const local = (target - acc)/lens[i];
      return {
        x: pts[i].x + (pts[i+1].x - pts[i].x)*local,
        y: pts[i].y + (pts[i+1].y - pts[i].y)*local
      };
    }
    acc += lens[i];
  }
  return pts[pts.length-1];
}