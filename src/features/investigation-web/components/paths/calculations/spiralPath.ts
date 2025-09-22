export function spiralPath(l:any, getNode:(id:string)=>any): string | null {
  const a = getNode(l.from); 
  const b = getNode(l.to);
  if (!a || !b) return null;

  const turns = Number.isFinite(l.turns) ? Math.max(0, l.turns) : 1;
  const dir: 1|-1 = (l.direction ?? 1) as any;
  const r1i = Math.max(1, Number(l.startRadius ?? 10));
  const r2i = Math.max(1, Number(l.endRadius ?? 60));
  const pad = l.pad || 0;

  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L, uy = dy / L;
  const A = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
  const B = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };

  let r1 = r1i, r2 = r2i;
  const D = Math.hypot(B.x - A.x, B.y - A.y) || 1e-6;
  const vx = (B.x - A.x) / D, vy = (B.y - A.y) / D;
  const px = -vy, py = vx;
  const aLen = (r1*r1 - r2*r2 + D*D) / (2*D);
  let h2 = r1*r1 - aLen*aLen;
  if (h2 < 0) h2 = 0;
  const P = { x: A.x + vx * aLen, y: A.y + vy * aLen };
  const h = Math.sqrt(h2);
  const C = dir === 1
    ? { x: P.x + px * h, y: P.y + py * h }
    : { x: P.x - px * h, y: P.y - py * h };

  const thA = Math.atan2(A.y - C.y, A.x - C.x);
  const thB0 = Math.atan2(B.y - C.y, B.x - C.x);
  const rA = Math.hypot(A.x - C.x, A.y - C.y);
  const rB = Math.hypot(B.x - C.x, B.y - C.y);

  let base = thB0 - thA;
  base = Math.atan2(Math.sin(base), Math.cos(base));
  const baseDir = dir === 1 ? (base < 0 ? base + 2*Math.PI : base)
                            : (base > 0 ? base - 2*Math.PI : base);
  const thB = thA + baseDir + dir * (2*Math.PI * turns);

  const denom = (thB - thA) || (dir*1e-6);
  const c = (rB - rA) / denom;
  const a0 = rA - c * thA;

  const steps = Math.max(80, Math.floor(Math.abs(thB - thA) * 24));
  const pts: {x:number;y:number}[] = [];
  for (let i=0;i<=steps;i++){
    const t = i/steps;
    const th = thA + (thB - thA) * t;
    const r = a0 + c * th;
    pts.push({ x: C.x + r*Math.cos(th), y: C.y + r*Math.sin(th) });
  }
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1;i<pts.length;i++){ d += ` L ${pts[i].x} ${pts[i].y}`; }
  return d;
}