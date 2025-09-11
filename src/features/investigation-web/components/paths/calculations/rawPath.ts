// Raw path helpers for track.type === 'path'
import { buildPathFromPoints } from "../../../stores/util/trackGeometry"; // reused util

export function trackRawPathD(track:any): string {
  if (Array.isArray(track.pathPoints) && track.pathPoints.length >= 2) {
    return buildPathFromPoints(track.pathPoints);
  }
  if (typeof track.pathD === "string") return track.pathD;
  return "";
}

export function rawPathPointAt(track:any, s:number){
  // Linear interpolation over polyline length
  const pts = Array.isArray(track.pathPoints) && track.pathPoints.length >= 2
    ? track.pathPoints
    : [];
  if (pts.length < 2) {
    if (track.p1 && track.p2){
      return {
        x: track.p1.x + (track.p2.x-track.p1.x)*s,
        y: track.p1.y + (track.p2.y-track.p1.y)*s
      };
    }
    return { x:0, y:0 };
  }
  // compute cumulative
  let total=0;
  const segs = [];
  for (let i=0;i<pts.length-1;i++){
    const dx=pts[i+1].x-pts[i].x;
    const dy=pts[i+1].y-pts[i].y;
    const L=Math.hypot(dx,dy);
    segs.push({i,L});
    total+=L;
  }
  const target = s * total;
  let acc=0;
  for (const seg of segs){
    if (acc + seg.L >= target){
      const local = (target - acc)/seg.L;
      const a=pts[seg.i], b=pts[seg.i+1];
      return { x: a.x + (b.x-a.x)*local, y: a.y + (b.y-a.y)*local };
    }
    acc += seg.L;
  }
  const last = pts[pts.length-1];
  return { x:last.x, y:last.y };
}