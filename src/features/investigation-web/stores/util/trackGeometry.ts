export interface SamplePoint { x:number; y:number; len:number; t:number; }

function clamp01(v:number){ return v<0?0:v>1?1:v; }

export function buildPathFromPoints(pts:{x:number;y:number}[]): string {
  if (!pts.length) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i=1;i<pts.length;i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  return d;
}

export function parseSimplePath(pathD:string): { x:number; y:number }[] {
  const pts: {x:number;y:number}[] = [];
  if (!pathD) return pts;
  const tokens = pathD.replace(/,/g," ").trim().split(/\s+/);
  let i=0;
  while (i < tokens.length){
    const cmd = tokens[i++];
    if (cmd !== 'M' && cmd !== 'L') break;
    const x = Number(tokens[i++]); const y = Number(tokens[i++]);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x,y }); else break;
  }
  return pts;
}

import { trackBezierPath, trackBezierPointAt } from "@features/investigation-web/components/paths/calculations/bezierPath";
import { trackCurvedPath, trackCurvedPointAt } from "@features/investigation-web/components/paths/calculations/curvedPath";
import { trackSplinePath, trackSplinePointAt } from "@features/investigation-web/components/paths/calculations/splinePath";
import { trackRawPathD, rawPathPointAt } from "@features/investigation-web/components/paths/calculations/rawPath";

export function trackPathD(track:any): string {
  if (!track) return "";
  switch(track.type){
    case "straight": return `M ${track.p1.x} ${track.p1.y} L ${track.p2.x} ${track.p2.y}`;
    case "curved": return trackCurvedPath(track);
    case "bezier": return trackBezierPath(track);
    case "spline": return trackSplinePath(track);
    case "path": return trackRawPathD(track);
    case "corkscrew":
    case "spiral":
      return `M ${track.p1.x} ${track.p1.y} L ${track.p2.x} ${track.p2.y}`;
    default:
      return `M ${track.p1?.x||0} ${track.p1?.y||0} L ${track.p2?.x||0} ${track.p2?.y||0}`;
  }
}

// ----- Sampling & Projection -----
export function sampleTrack(track:any, steps=64): SamplePoint[] {
  const pts: {x:number;y:number}[] = [];
    if (typeof track.pathD === "string") {
    const p = parseSimplePath(track.pathD);
    if (p.length >= 2) {
      // use raw points
      let len = 0;
      const out: SamplePoint[] = [];
      for (let i=0;i<p.length;i++){
        if (i>0){
          const dx = p[i].x - p[i-1].x;
          const dy = p[i].y - p[i-1].y;
          len += Math.hypot(dx,dy);
        }
        out.push({ x:p[i].x, y:p[i].y, len, t:0 });
      }
      const total = len || 1;
      out.forEach(pt => pt.t = pt.len / total);
      return out;
    }
    // fallback to generic handling if parse fails
  }
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

function buildArcTableFromPoints(pts:{x:number;y:number}[]){
  const table:number[] = [0];
  let acc=0;
  for (let i=1;i<pts.length;i++){
    const dx=pts[i].x-pts[i-1].x, dy=pts[i].y-pts[i-1].y;
    acc += Math.hypot(dx,dy);
    table.push(acc);
  }
  return { table, total: acc || 1 };
}

function pointAtApprox(track:any, s:number){
  switch(track.type){
    case "straight":
      return {
        x: track.p1.x + (track.p2.x-track.p1.x)*s,
        y: track.p1.y + (track.p2.y-track.p1.y)*s
      };
    case "bezier": return trackBezierPointAt(track, s);
    case "curved": return trackCurvedPointAt(track, s);
    case "spline": return trackSplinePointAt(track, s);
    case "path":
      ensurePathArcCache(track);
      if (track._arcCache){
        const { table, total } = track._arcCache;
        const target = s * total;
        // binary search
        let lo=0, hi=table.length-1;
        while (lo < hi){
          const mid = (lo+hi)>>1;
          if (table[mid] < target) lo=mid+1; else hi=mid;
        }
        const idx = Math.max(1, lo);
        const t0 = table[idx-1], t1 = table[idx];
        const span = (t1 - t0) || 1;
        const f = Math.max(0, Math.min(1, (target - t0)/span));
        const a = track.pathPoints[idx-1], b = track.pathPoints[idx];
        return { x: a.x + (b.x-a.x)*f, y: a.y + (b.y-a.y)*f };
      }
      return rawPathPointAt(track, s);
    case "spiral":
    case "corkscrew":
      // Placeholder linear; can replace with real param later
      return {
        x: track.p1.x + (track.p2.x-track.p1.x)*s,
        y: track.p1.y + (track.p2.y-track.p1.y)*s
      };
    default:
      return { x:0, y:0 };
  }
}

// Add helper exposed (optional use elsewhere)
export function ensurePathArcCache(track:any){
  if (track.type!=='path' || !Array.isArray(track.pathPoints) || track.pathPoints.length<2) return;
  const v = track._v || 0;
  if (!track._arcCache || track._arcCache._v !== v){
    const { table, total } = buildArcTableFromPoints(track.pathPoints);
    track._arcCache = { _v: v, table, total };
  }
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

// Lightweight cached polyline sampling (lower detail) for interactive hit tests / projections.
export function getFastSamples(track:any, detail=40){
  if (!track) return [];
  // internal versioning: bump track._v whenever geometry fields change
  const cacheKey = detail;
  track._geomCache = track._geomCache || { v: track._v||0, samples:{}, bbox:null };
  if (track._geomCache.v !== (track._v||0)){
    track._geomCache = { v: track._v||0, samples:{}, bbox:null };
  }
  if (track._geomCache.samples[cacheKey]) return track._geomCache.samples[cacheKey];
  // Build samples (reuse existing logic but with reduced steps)
  let samples;
  if (track.type === 'straight'){
    samples = [
      { x: track.p1.x, y: track.p1.y, len:0, t:0 },
      { x: track.p2.x, y: track.p2.y, len: Math.hypot(track.p2.x-track.p1.x, track.p2.y-track.p1.y), t:1 }
    ];
  } else if (track.type === 'path' && Array.isArray(track.pathPoints) && track.pathPoints.length >= 2){
    let len=0;
    samples = track.pathPoints.map((p:any,i:number)=>{
      if (i>0){
        const dx=p.x-track.pathPoints[i-1].x, dy=p.y-track.pathPoints[i-1].y;
        len += Math.hypot(dx,dy);
      }
      return { x:p.x, y:p.y, len, t:0 };
    });
    const total = len||1;
    for (const s of samples) s.t = s.len/total;
  } else {
    // fallback to regular sampleTrack but lower resolution
    samples = sampleTrack(track, detail);
  }
  track._geomCache.samples[cacheKey] = samples;
  return samples;
}

export function fastProjectPointToTrack(track:any, x:number, y:number){
  const pts = getFastSamples(track, 48);
  if (pts.length < 2) return { x, y, t:0, dist: Infinity };
  let bestDist = Infinity;
  let best = { x:pts[0].x, y:pts[0].y, t:0, dist:Infinity };
  for (let i=0;i<pts.length-1;i++){
    const a=pts[i], b=pts[i+1];
    const vx=b.x-a.x, vy=b.y-a.y;
    const len2 = vx*vx + vy*vy || 1;
    let tt = ((x-a.x)*vx + (y-a.y)*vy)/len2;
    if (tt<0) tt=0; else if (tt>1) tt=1;
    const px = a.x + vx*tt, py = a.y + vy*tt;
    const d2 = (px-x)*(px-x)+(py-y)*(py-y);
    if (d2 < bestDist){
      const segT = a.t + (b.t - a.t)*tt;
      bestDist = d2;
      best = { x:px, y:py, t:segT, dist: Math.sqrt(d2) };
    }
  }
  return best;
}

export function getTrackBBox(track:any){
  track._geomCache = track._geomCache || { v: track._v||0, samples:{}, bbox:null };
  if (track._geomCache.v !== (track._v||0)){
    track._geomCache = { v: track._v||0, samples:{}, bbox:null };
  }
  if (track._geomCache.bbox) return track._geomCache.bbox;
  const pts = getFastSamples(track, 32);
  let minX= Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
  for (const p of pts){
    if (p.x < minX) minX=p.x;
    if (p.x > maxX) maxX=p.x;
    if (p.y < minY) minY=p.y;
    if (p.y > maxY) maxY=p.y;
  }
  if (!pts.length){
    minX = maxX = track.p1?.x||0;
    minY = maxY = track.p1?.y||0;
  }
  const bbox = { x:minX, y:minY, w:maxX-minX, h:maxY-minY };
  track._geomCache.bbox = bbox;
  return bbox;
}