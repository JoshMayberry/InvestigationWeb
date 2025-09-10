// Replaces previous content, keeps existing exports used elsewhere.

export interface SamplePoint { x:number; y:number; len:number; t:number; }

function clamp01(v:number){ return v<0?0:v>1?1:v; }

export function trackPathD(track:any): string {
  if (!track) return "";
  switch(track.type){
    case "straight": return `M ${track.p1.x} ${track.p1.y} L ${track.p2.x} ${track.p2.y}`;
    case "curved": return curvedPath(track);
    case "bezier": return bezierPath(track);
    case "spline": return splinePath(track);
    case "corkscrew":
    case "spiral":
      return `M ${track.p1.x} ${track.p1.y} L ${track.p2.x} ${track.p2.y}`; // placeholder
    default: return `M ${track.p1.x} ${track.p1.y} L ${track.p2.x} ${track.p2.y}`;
  }
}

// ----- Path builders (same logic as before) -----
function buildAxis(track:any){
  const p1 = track.p1, p2 = track.p2;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const dist = Math.hypot(dx,dy) || 1;
  const ux = dx/dist, uy = dy/dist;
  const nx = -uy, ny = ux;
  return { p1, p2, dx, dy, ux, uy, nx, ny, dist };
}

function curvedPath(t:any): string {
  const A = buildAxis(t);
  const ctrls = (t.midControls??[]).map((c:any)=>{
    const tt = clamp01((c.t??50)/100);
    const off = ((c.off??0)/100);
    return {
      x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
      y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
    };
  });
  const pts = [A.p1, ...ctrls, A.p2];
  if (pts.length === 2) return `M ${A.p1.x} ${A.p1.y} L ${A.p2.x} ${A.p2.y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1;i<pts.length-1;i++){
    const c = pts[i];
    const nxt = pts[i+1];
    const end = i < pts.length - 2 ? { x:(c.x+nxt.x)/2, y:(c.y+nxt.y)/2 } : nxt;
    d += ` Q ${c.x} ${c.y} ${end.x} ${end.y}`;
  }
  return d;
}

function bezierPath(t:any): string {
  const A = buildAxis(t);
  let c1 = t.c1 || { t:25, off:30 };
  let c2 = t.c2 || { t:75, off:-30 };
  if (t.symmetric){
    c2 = { t: 100 - c1.t, off: -c1.off };
  }
  const cc = (c:any) => {
    const tt = clamp01((c.t??50)/100);
    const off = (c.off??0)/100;
    return {
      x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
      y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
    };
  };
  const P1 = cc(c1), P2 = cc(c2);
  return `M ${A.p1.x} ${A.p1.y} C ${P1.x} ${P1.y} ${P2.x} ${P2.y} ${A.p2.x} ${A.p2.y}`;
}

function splinePath(t:any): string {
  const A = buildAxis(t);
  const controls = (t.controls && t.controls.length ? t.controls : [{ t:50, off:0 }]).map((c:any)=>{
    const tt = clamp01((c.t??50)/100);
    const off = ((c.off??0)/100);
    return {
      x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
      y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
    };
  });
  const pts = [A.p1, ...controls, A.p2];
  if (pts.length === 2) return `M ${A.p1.x} ${A.p1.y} L ${A.p2.x} ${A.p2.y}`;
  const tension = clamp01(t.tension ?? 0.25);
  const k = (1 - tension) / 6;
  const P = (i:number)=> pts[Math.max(0, Math.min(pts.length-1, i))];
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=0;i<pts.length-1;i++){
    const p0=P(i-1), pA=P(i), pB=P(i+1), p3=P(i+2);
    const c1 = { x: pA.x + (pB.x - p0.x) * k, y: pA.y + (pB.y - p0.y) * k };
    const c2 = { x: pB.x - (p3.x - pA.x) * k, y: pB.y - (p3.y - pA.y) * k };
    d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${pB.x} ${pB.y}`;
  }
  return d;
}

// ----- Sampling & Projection -----
export function sampleTrack(track:any, steps=64): SamplePoint[] {
  const pts: {x:number;y:number}[] = [];
  if (track.type === "straight"){
    pts.push(track.p1, track.p2);
  } else {
    // Approximate by evaluating path at parameter s in [0,1]
    for (let i=0;i<=steps;i++){
      const s = i/steps;
      pts.push(pointAtApprox(track, s));
    }
  }
  let len = 0;
  const out: SamplePoint[] = [];
  for (let i=0;i<pts.length;i++){
    if (i>0){
      const dx = pts[i].x - pts[i-1].x;
      const dy = pts[i].y - pts[i-1].y;
      len += Math.hypot(dx,dy);
    }
    out.push({ x: pts[i].x, y: pts[i].y, len, t:0 });
  }
  const total = len || 1;
  out.forEach(p => p.t = p.len / total);
  return out;
}

// Approx param evaluation (straight maps to chord; others use shape math)
function pointAtApprox(track:any, s:number){
  if (track.type === "straight"){
    return {
      x: track.p1.x + (track.p2.x - track.p1.x)*s,
      y: track.p1.y + (track.p2.y - track.p1.y)*s
    };
  }
  // For now re-use axis offsets pattern (not exact arc-length)
  if (track.type === "bezier"){
    // Decompose to cubic
    const A = buildAxis(track);
    let c1 = track.c1 || { t:25, off:30 };
    let c2 = track.c2 || { t:75, off:-30 };
    if (track.symmetric){
      c2 = { t: 100 - c1.t, off: -c1.off };
    }
    const cc = (c:any) => {
      const tt = clamp01((c.t??50)/100);
      const off = (c.off??0)/100;
      return {
        x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
        y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
      };
    };
    const P0=A.p1, P3=A.p2, P1=cc(c1), P2=cc(c2);
    const u=1-s;
    const x = u*u*u*P0.x + 3*u*u*s*P1.x + 3*u*s*s*P2.x + s*s*s*P3.x;
    const y = u*u*u*P0.y + 3*u*u*s*P1.y + 3*u*s*s*P2.y + s*s*s*P3.y;
    return { x, y };
  }
  if (track.type === "curved"){
    // piecewise quadratics — map s to chain
    const A = buildAxis(track);
    const ctrls = (track.midControls??[]).map((c:any)=>{
      const tt = clamp01((c.t??50)/100);
      const off = ((c.off??0)/100);
      return {
        x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
        y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
      };
    });
    const pts = [A.p1, ...ctrls, A.p2];
    if (pts.length === 2) return {
      x: A.p1.x + (A.p2.x - A.p1.x)*s,
      y: A.p1.y + (A.p2.y - A.p1.y)*s
    };
    const segs = pts.length - 1;
    const segF = s * segs;
    const i = Math.min(segs-1, Math.floor(segF));
    const local = segF - i;
    const p0 = pts[i];
    const p1 = pts[i+1];
    // Quadratic via midpoint (approx) – simple linear for preview
    return { x: p0.x + (p1.x - p0.x)*local, y: p0.y + (p1.y - p0.y)*local };
  }
  if (track.type === "spline"){
    // Basic interpolate along catmull-like sequence (simplified)
    const A = buildAxis(track);
    const controls = (track.controls && track.controls.length ? track.controls : [{ t:50, off:0 }]).map((c:any)=>{
      const tt = clamp01((c.t??50)/100);
      const off = ((c.off??0)/100);
      return {
        x: A.p1.x + A.ux * (tt * A.dist) + A.nx * (off * A.dist),
        y: A.p1.y + A.uy * (tt * A.dist) + A.ny * (off * A.dist)
      };
    });
    const pts = [A.p1, ...controls, A.p2];
    const segs = pts.length - 1;
    const segF = s * segs;
    const i = Math.min(segs-1, Math.floor(segF));
    const local = segF - i;
    const P = (k:number)=> pts[Math.max(0, Math.min(pts.length-1, k))];
    const p0=P(i-1), p1=P(i), p2=P(i+1), p3=P(i+2);
    // Catmull-Rom
    const l2 = local*local;
    const l3 = l2*local;
    const tension = clamp01(track.tension ?? 0.25);
    const alpha = (1 - tension)*0.5;
    const x = (
      (-alpha*p0.x + (2-alpha)*p1.x + (alpha-2)*p2.x + alpha*p3.x) * l3 +
      (2*alpha*p0.x + (alpha-3)*p1.x + (3-2*alpha)*p2.x - alpha*p3.x) * l2 +
      (-alpha*p0.x + alpha*p2.x) * local +
      p1.x
    );
    const y = (
      (-alpha*p0.y + (2-alpha)*p1.y + (alpha-2)*p2.y + alpha*p3.y) * l3 +
      (2*alpha*p0.y + (alpha-3)*p1.y + (3-2*alpha)*p2.y - alpha*p3.y) * l2 +
      (-alpha*p0.y + alpha*p2.y) * local +
      p1.y
    );
    return { x, y };
  }
  // Spiral / corkscrew placeholder linear
  return {
    x: track.p1.x + (track.p2.x - track.p1.x)*s,
    y: track.p1.y + (track.p2.y - track.p1.y)*s
  };
}

// Projection using sampled polyline
export function projectPointToTrack(track:any, x:number, y:number, samples=80){
  const pts = sampleTrack(track, samples);
  let bestDist = Infinity;
  let best = { x:track.p1.x, y:track.p1.y, t:0, dist:Infinity };
  for (let i=0;i<pts.length-1;i++){
    const a = pts[i], b = pts[i+1];
    const vx = b.x - a.x, vy = b.y - a.y;
    const len2 = vx*vx + vy*vy || 1;
    let tt = ((x - a.x)*vx + (y - a.y)*vy)/len2;
    if (tt < 0) tt = 0; else if (tt > 1) tt = 1;
    const px = a.x + vx*tt, py = a.y + vy*tt;
    const d = (px-x)*(px-x) + (py-y)*(py-y);
    if (d < bestDist){
      // compute global normalized t via linear interpolation of segment cumulative length
      const segLen = Math.hypot(vx,vy) || 1;
      const segStartT = a.t;
      const segEndT = b.t;
      const globalT = segStartT + (segEndT - segStartT)*tt;
      bestDist = d;
      best = { x: px, y: py, t: globalT, dist: Math.sqrt(d) };
    }
  }
  return best;
}

export function pointAtTrackPosition(track:any, pos:number){
  const pts = sampleTrack(track, 120);
  if (pos <= 0) return { x: pts[0].x, y: pts[0].y };
  if (pos >= 1) return { x: pts[pts.length-1].x, y: pts[pts.length-1].y };
  for (let i=0;i<pts.length-1;i++){
    if (pts[i+1].t >= pos){
      const a = pts[i], b = pts[i+1];
      const span = (pos - a.t) / (b.t - a.t || 1);
      return { x: a.x + (b.x - a.x)*span, y: a.y + (b.y - a.y)*span };
    }
  }
  return { x: pts[pts.length-1].x, y: pts[pts.length-1].y };
}

export function segmentSamplePaths(track:any, segments:number){
  segments = Math.max(1, Math.floor(segments||1));
  if (segments === 1) return [trackPathD(track)];
  const samples = sampleTrack(track, 160); // richer sampling
  const out:string[] = [];
  for (let s=0; s<segments; s++){
    const t0 = s / segments;
    const t1 = (s+1) / segments;
    const pts = samples.filter(p => p.t >= t0 - 1e-6 && p.t <= t1 + 1e-6);
    if (!pts.length) continue;
    // ensure boundary points
    if (pts[0].t > t0){
      const a = pts[0];
      pts.unshift({ x:a.x, y:a.y, len:0, t:t0 });
    }
    if (pts[pts.length-1].t < t1){
      const a = pts[pts.length-1];
      pts.push({ x:a.x, y:a.y, len:0, t:t1 });
    }
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i=1;i<pts.length;i++){
      d += ` L ${pts[i].x} ${pts[i].y}`;
    }
    out.push(d);
  }
  return out;
}

export function trackSegmentIndex(track:any, trackPosition:number){
  const segs = Math.max(1, track.segments || 1);
  return Math.min(segs-1, Math.floor(trackPosition * segs));
}