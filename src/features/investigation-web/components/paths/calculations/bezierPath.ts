export function bezierPath(l:any, getNode:(id:string)=>any): string | null {
  const a = getNode(l.from), b = getNode(l.to);
  if (!a || !b) return null;
  const pad = l.pad || 0;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const nx = -uy, ny = ux;
  const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
  const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
  const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;
  let c1 = l.c1 || { t:25, off:30 }, c2 = l.c2 || { t:75, off:-30 };
  if (l.symmetric) { c2 = { t: 100 - c1.t, off: -c1.off }; }
  const clamp = (v:number, lo:number, hi:number)=> Math.min(hi, Math.max(lo, v));
  const t1 = clamp(c1.t, 0, 100)/100, o1 = clamp(c1.off, -100, 100)/100;
  const t2 = clamp(c2.t, 0, 100)/100, o2 = clamp(c2.off, -100, 100)/100;
  const p1 = { x: s.x + ux * (t1*segLen) + nx * (o1*segLen), y: s.y + uy * (t1*segLen) + ny * (o1*segLen) };
  const p2 = { x: s.x + ux * (t2*segLen) + nx * (o2*segLen), y: s.y + uy * (t2*segLen) + ny * (o2*segLen) };
  return `M ${s.x} ${s.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${e.x} ${e.y}`;
}

export function trackBezierPath(track:any): string {
  const { p1, p2 } = track;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx,dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  let c1 = track.c1 || { t:25, off:30 };
  let c2 = track.c2 || { t:75, off:-30 };
  if (track.symmetric){
    c2 = { t:100 - c1.t, off: -c1.off };
  }
  const cc = (c:any)=>{
    const tt = Math.min(1, Math.max(0, (c.t??50)/100));
    const off = ((c.off??0)/100);
    return {
      x: p1.x + ux*(tt*dist) + nx*(off*dist),
      y: p1.y + uy*(tt*dist) + ny*(off*dist)
    };
  };
  const B1 = cc(c1), B2 = cc(c2);
  return `M ${p1.x} ${p1.y} C ${B1.x} ${B1.y} ${B2.x} ${B2.y} ${p2.x} ${p2.y}`;
}

export function trackBezierPointAt(track:any, s:number){
  s = Math.min(1, Math.max(0,s));
  const { p1, p2 } = track;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx,dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  let c1 = track.c1 || { t:25, off:30 };
  let c2 = track.c2 || { t:75, off:-30 };
  if (track.symmetric){
    c2 = { t:100 - c1.t, off: -c1.off };
  }
  const cc = (c:any)=>{
    const tt = Math.min(1, Math.max(0, (c.t??50)/100));
    const off = ((c.off??0)/100);
    return {
      x: p1.x + ux*(tt*dist) + nx*(off*dist),
      y: p1.y + uy*(tt*dist) + ny*(off*dist)
    };
  };
  const P0 = p1;
  const P3 = p2;
  const P1 = cc(c1);
  const P2 = cc(c2);
  const u = 1-s;
  return {
    x: u*u*u*P0.x + 3*u*u*s*P1.x + 3*u*s*s*P2.x + s*s*s*P3.x,
    y: u*u*u*P0.y + 3*u*u*s*P1.y + 3*u*s*s*P2.y + s*s*s*P3.y
  };
}