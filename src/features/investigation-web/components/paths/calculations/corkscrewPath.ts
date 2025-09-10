export function corkscrewPath(l:any, getNode:(id:string)=>any): string | null {
  const a = getNode(l.from); const b = getNode(l.to);
  if (!a || !b) return null;
  const turns = l.turns ?? 1;
  const startR = l.startRadius ?? 10;
  const endR = l.endRadius ?? 60;
  const dir = l.direction ?? 1;
  const pad = l.pad || 0;

  const vx = b.x - a.x, vy = b.y - a.y;
  const L = Math.hypot(vx, vy) || 1;
  const ux = vx / L, uy = vy / L;
  const nx = -uy, ny = ux;

  const sOff = (a.r||12) + pad;
  const eOff = (b.r||12) + pad;
  const A = { x: a.x + ux * sOff, y: a.y + uy * sOff };
  const B = { x: b.x - ux * eOff, y: b.y - uy * eOff };
  const seg = { x: B.x - A.x, y: B.y - A.y };
  const len = Math.hypot(seg.x, seg.y) || 1;

  const steps = Math.max(40, Math.floor(Math.abs(turns) * 60));
  const pts: {x:number;y:number}[] = [];
  for (let i=0;i<=steps;i++){
    const t = i / steps;
    const theta = dir * (2*Math.PI*turns) * t;
    const r = startR + (endR - startR) * t;
    const sx = r * Math.cos(theta);
    const sy = r * Math.sin(theta);
    const px = (len) * t;
    const lx = px + sx * 0.2;
    const ly = sy * 0.2;
    pts.push({ x: A.x + lx*ux + ly*nx, y: A.y + lx*uy + ly*ny });
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1;i<pts.length;i++){ d += ` L ${pts[i].x} ${pts[i].y}`; }
  return d;
}