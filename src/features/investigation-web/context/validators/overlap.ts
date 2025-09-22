import type { GhostState } from "../controllers/dragController";

/**
 * Node overlap validator
 *
 * Purpose:
 *  - Prevents placing or dragging a node so its circle intersects another node's circle
 *    with an additional padding margin.
 *
 * Geometry:
 *  Overlap when distance(centerA, centerB)^2 < (rA + rB + padding*2)^2
 *
 * Notes:
 *  - Skips the source node when dragging an existing node (g.sourceId).
 *  - 'padding' is applied to BOTH sides (effectively doubled inside the check).
 *  - Returns { valid:true } when no violation, else { valid:false, reason:"overlap" }.
 *
 * Extend:
 *  - Add other reasons (e.g. bounds) by composing multiple validators before setValidator().
 */
export function makeOverlapValidator(
  nodesGetter: () => { id:string; x:number; y:number; r?:number }[],
  padding:number
){
  const pad = padding || 0;
  return (g:GhostState) => {
    if (!g.active) return { valid:true };
    const nodes = nodesGetter();
    const gr = g.r;
    const gx = g.x;
    const gy = g.y;
    const pad2 = pad * 2;
    for (let i=0;i<nodes.length;i++){
      const n = nodes[i];
      if (g.sourceId && n.id === g.sourceId) continue;
      const nr = n.r || 14;
      const need = nr + gr + pad2;
      const dx = gx - n.x;
      const dy = gy - n.y;
      if (dx*dx + dy*dy < need*need){
        return { valid:false, reason:"overlap" };
      }
    }
    return { valid:true };
  };
}