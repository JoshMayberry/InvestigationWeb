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

export function trackSplinePath(track:any): string {
  const { p1, p2 } = track;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx,dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  const controls = (track.controls && track.controls.length ? track.controls : [{ t:50, off:0 }]).map((c:any)=>{
    const tt = Math.min(1, Math.max(0,(c.t??50)/100));
    const off = ((c.off??0)/100);
    return {
      x: p1.x + ux*(tt*dist) + nx*(off*dist),
      y: p1.y + uy*(tt*dist) + ny*(off*dist)
    };
  });
  const pts = [p1, ...controls, p2];
  if (pts.length === 2) return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
  const tension = Math.min(1, Math.max(0, track.tension ?? 0.25));
  const k = (1 - tension) / 6;
  const P = (i:number)=> pts[Math.max(0, Math.min(pts.length-1,i))];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=0;i<pts.length-1;i++){
    const p0=P(i-1), pA=P(i), pB=P(i+1), p3=P(i+2);
    const c1 = { x: pA.x + (pB.x - p0.x)*k, y: pA.y + (pB.y - p0.y)*k };
    const c2 = { x: pB.x - (p3.x - pA.x)*k, y: pB.y - (p3.y - pA.y)*k };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pB.x} ${pB.y}`;
  }
  return d;
}

export function trackSplinePointAt(track:any, s:number){
  s = Math.min(1, Math.max(0,s));
  const { p1, p2 } = track;
  const controls = (track.controls && track.controls.length ? track.controls : [{ t:50, off:0 }]);
  if (!controls.length){
    return {
      x: p1.x + (p2.x-p1.x)*s,
      y: p1.y + (p2.y-p1.y)*s
    };
  }
  // Approx via param splitting (reuse trackSplinePath geometry)
  const path = trackSplinePath(track);
  const pts: {x:number;y:number}[] = [];
  const tokens = path.split(/[MC]/).map(t=>t.trim()).filter(Boolean);
  for (const tok of tokens){
    const nums = tok.split(/[\s,]+/).map(Number).filter(n=>Number.isFinite(n));
    for (let i=0;i<nums.length; i+=2){
      if (nums[i+1]!=null) pts.push({ x:nums[i], y:nums[i+1] });
    }
  }
  if (pts.length < 2) return { x:p1.x, y:p1.y };
  let total=0;
  const segs=[];
  for (let i=0;i<pts.length-1;i++){
    const L=Math.hypot(pts[i+1].x-pts[i].x, pts[i+1].y-pts[i].y);
    segs.push(L); total+=L;
  }
  const target = s*total;
  let acc=0;
  for (let i=0;i<segs.length;i++){
    if (acc + segs[i] >= target){
      const local=(target-acc)/segs[i];
      return {
        x: pts[i].x + (pts[i+1].x-pts[i].x)*local,
        y: pts[i].y + (pts[i+1].y-pts[i].y)*local
      };
    }
    acc+=segs[i];
  }
  return pts[pts.length-1];
}