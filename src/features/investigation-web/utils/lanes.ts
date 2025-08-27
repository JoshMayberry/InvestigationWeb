import type { NodeDoc } from '../types';

interface EdgeRef { id:string; source:NodeDoc; target:NodeDoc; }

/**
 * Bin links by quantized source/target angles (relative to a center) and
 * assign symmetric lane offsets to reduce overdraw in bundles.
 */
export function computeLaneOffsets(
  edges: EdgeRef[],
  laneSpacing = 12,
  center = { x: 0, y: 0 }
){
  const bins = new Map<string, EdgeRef[]>();
  const q = (th:number, bins=36) => {
    const step = (2*Math.PI)/bins;
    return Math.round(th/step)*step;
  };
  const angleOf = (x:number,y:number) => Math.atan2(y - center.y, x - center.x);

  edges.forEach(e=>{
    const thS = q(angleOf(e.source.x!, e.source.y!));
    const thT = q(angleOf(e.target.x!, e.target.y!));
    const key = `${thS.toFixed(3)}|${thT.toFixed(3)}`;
    (bins.get(key) || bins.set(key, []).get(key)!).push(e);
  });

  const map = new Map<string, number>();
  bins.forEach((arr)=>{
    arr.sort((a,b)=> a.id.localeCompare(b.id));
    const n = arr.length, base = -(n-1)/2;
    arr.forEach((e,i)=> map.set(e.id, (base+i) * laneSpacing));
  });
  return map;
}
