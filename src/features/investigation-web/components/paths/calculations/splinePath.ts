export function splinePath(l:any, getNode:(id:string)=>any): string | null {
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

  const controls = (l.controls && l.controls.length ? l.controls : [{ t: 50, off: 0 }]).map((c:any)=>{
    const t = Math.max(0, Math.min(100, Number(c.t))) / 100;
    const off = Math.max(-100, Math.min(100, Number(c.off))) / 100;
    return {
      x: s.x + ux * (t * segLen) + nx * (off * segLen),
      y: s.y + uy * (t * segLen) + ny * (off * segLen)
    };
  });

  const pts = [s, ...controls, e];
  if (pts.length === 2) return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;

  const tParam = Math.max(0, Math.min(1, Number(l.tension ?? 0.25)));
  const k = (1 - tParam) / 6;
  const P = (i:number) => pts[Math.max(0, Math.min(pts.length-1, i))];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=0;i<pts.length-1;i++){
    const p0 = P(i-1), p1 = P(i), p2 = P(i+1), p3 = P(i+2);
    const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k };
    const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
  }
  return d;
}