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