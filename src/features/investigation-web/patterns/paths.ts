// patterns/paths.ts
import type { LinkDefaults, NodeDoc } from '../types';

type Cfg = LinkDefaults & {
  laneOffset?: number;
  center?: { x:number; y:number };
};

export function pathRadial(s:NodeDoc, t:NodeDoc, cfg:Cfg){
  const p0={x:s.x!,y:s.y!}, p3={x:t.x!,y:t.y!};
  const dx=p3.x-p0.x, dy=p3.y-p0.y, L=Math.hypot(dx,dy)||1;
  const u={x:dx/L,y:dy/L}, n={x:-u.y,y:u.x};

  const mid={x:(p0.x+p3.x)/2,y:(p0.y+p3.y)/2};
  const peak={
    x: mid.x + n.x*(cfg.outward + (cfg.laneOffset ?? 0)) + u.x*cfg.curve,
    y: mid.y + n.y*(cfg.outward + (cfg.laneOffset ?? 0)) + u.y*cfg.curve
  };
  const c1={x:p0.x+(2/3)*(peak.x-p0.x), y:p0.y+(2/3)*(peak.y-p0.y)};
  const c2={x:p3.x+(2/3)*(peak.x-p3.x), y:p3.y+(2/3)*(peak.y-p3.y)};
  return `M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`;
}

export const pathStraight = pathRadial;
export const pathSpiral  = pathRadial;

function valid(n: NodeDoc){ return Number.isFinite(n.x as number) && Number.isFinite(n.y as number); }

export function routePath(s:NodeDoc, t:NodeDoc, cfg:Cfg){
  if (!valid(s) || !valid(t)) return ''; // ⛑️

  const p0={x:s.x!,y:s.y!}, p3={x:t.x!,y:t.y!};
  const dx=p3.x-p0.x, dy=p3.y-p0.y, L=Math.hypot(dx,dy)||1;

  const u={x:dx/L,y:dy/L};                // chord direction
  const nChord={x:-u.y,y:u.x};            // chord normal (for lane separation)

  const mid={x:(p0.x+p3.x)/2,y:(p0.y+p3.y)/2};

  // center-aware radial/tangential axes
  const C = cfg.center ?? { x: 0, y: 0 };
  const rvec = { x: mid.x - C.x, y: mid.y - C.y };
  const rlen = Math.hypot(rvec.x, rvec.y) || 1;
  const rdir = { x: rvec.x / rlen, y: rvec.y / rlen };   // “radial” (away from center)
  const tau  = { x: -rdir.y, y: rdir.x };                // spiral tangent

  const lane = (cfg.laneOffset ?? 0);
  const laneShift = { x: nChord.x * lane, y: nChord.y * lane };

  // choose axis
  let axis = rdir;
  if (cfg.style === 'spiral') axis = tau;
  if (cfg.style === 'straight') axis = nChord; // S-bend using chord normal

  const peak = {
    x: mid.x + axis.x * cfg.outward + u.x * cfg.curve + laneShift.x,
    y: mid.y + axis.y * cfg.outward + u.y * cfg.curve + laneShift.y
  };
  const c1={x:p0.x+(2/3)*(peak.x-p0.x), y:p0.y+(2/3)*(peak.y-p0.y)};
  const c2={x:p3.x+(2/3)*(peak.x-p3.x), y:p3.y+(2/3)*(peak.y-p3.y)};
  return `M${p0.x},${p0.y} C${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`;
}
