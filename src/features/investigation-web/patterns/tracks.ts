import type { TrackDef } from '../types';

export function ringTrack(id: string, cx: number, cy: number, r: number): TrackDef {
  return {
    id,
    eval: (t) => {
      const th = t * 2 * Math.PI;
      return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) };
    },
    labelAt: (t) => {
      const th = t * 2 * Math.PI;
      const x = cx + (r + 18) * Math.cos(th);
      const y = cy + (r + 18) * Math.sin(th);
      return { x, y, anchor: Math.cos(th) >= 0 ? 'start' : 'end' };
    }
  };
}

export function spiralTrack(id: string, cx: number, cy: number, r0: number, k: number, turns = 1): TrackDef {
  return {
    id,
    eval: (t) => {
      const theta = t * turns * 2 * Math.PI;
      const r = r0 + k * theta;
      return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
    }
  };
}

export function hLineTrack(id: string, x1:number, x2:number, y:number): TrackDef {
  return { id, eval: (t) => ({ x: x1 + (x2-x1)*t, y }) };
}
export function vLineTrack(id: string, y1:number, y2:number, x:number): TrackDef {
  return { id, eval: (t) => ({ x, y: y1 + (y2-y1)*t }) };
}
export function spiralTrackAt(
  id: string,
  cx: number, cy: number,
  r0: number, k: number,
  turns: number,
  startAngle = 0,
  dir: 1|-1 = +1
): TrackDef {
  // eval maps t∈[0,1] → θ∈[0, 2π·turns] (reversed when dir=-1)
  const thOf = (t:number) => startAngle + (dir === +1 ? t : (1 - t)) * turns * 2 * Math.PI;
  return {
    id,
    eval: (t:number) => {
      const th = thOf(t);
      const r  = r0 + k * (th - startAngle) * (dir === +1 ? 1 : -1);
      return { x: cx + r*Math.cos(th), y: cy + r*Math.sin(th) };
    },
    labelAt: (t:number) => {
      const th = thOf(t);
      const r  = r0 + k * (th - startAngle) * (dir === +1 ? 1 : -1);
      // nudge outward for readability
      const pad = 18;
      const x = cx + (r + pad) * Math.cos(th);
      const y = cy + (r + pad) * Math.sin(th);
      return { x, y, anchor: Math.cos(th) >= 0 ? 'start' : 'end' };
    }
  };
}

/** Slice a parent track into the fractional range [f0,f1]. */
export function segmentTrack(id: string, base: TrackDef, f0: number, f1: number): TrackDef {
  const lerp = (a:number,b:number,t:number)=> a + (b-a)*t;
  return {
    id,
    eval: (t:number) => base.eval(lerp(f0, f1, t)),
    labelAt: base.labelAt
      ? (t:number)=> base.labelAt!(lerp(f0, f1, t))
      : undefined
  };
}