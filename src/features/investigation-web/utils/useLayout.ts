import { ref, onBeforeUnmount } from 'vue';
import type { NavDoc, NodeDoc, NodeWithSlot, TrackDef } from '../types';
import { runForceLayout } from '../patterns/dynamicForce';

export function useLayout() {
  const disposer = ref<null | (()=>void)>(null);

  function stop(){ disposer.value?.(); disposer.value = null; }

  /** Layout nodes in place; returns positioned nodes (new array) */
  function applyLayout(
    doc: NavDoc,
    tracks: TrackDef[] | null,
    assign: (nodes: NodeDoc[], tracks: TrackDef[]) => Array<{ node: NodeDoc; t: number; trackId: string }> | null,
    viewport: { width:number; height:number },
    onTick?: ()=>void
  ): NodeDoc[] {
    stop();
    const nodes = doc.nodes.map(n => ({ ...n }));

    if (doc.layout.kind === 'static' && tracks) {
      const mapping = assign?.(nodes, tracks);
      if (mapping){
        const byTrack = new Map<string, Array<{node:NodeDoc; t:number}>>();
        mapping.forEach(m=>{
          const arr = byTrack.get(m.trackId) || [];
          arr.push({ node:m.node, t:m.t });
          byTrack.set(m.trackId, arr);
        });
        tracks.forEach(tr=>{
          const arr = (byTrack.get(tr.id) || []).sort((a,b)=> a.t - b.t);
          arr.forEach(m=>{
            const p = tr.eval(m.t);
            m.node.x = p.x; m.node.y = p.y;
          });
        });
      }
      return nodes;
    }

    if (doc.layout.kind === 'dynamic') {
      const links = buildLinks(doc.nodes);
      const opts = {
        width: viewport.width,
        height: viewport.height,
        charge: (doc.layout.options as any)?.charge,
        linkDistance: (doc.layout.options as any)?.linkDistance
      };
      disposer.value = runForceLayout(nodes, links, opts, onTick);
      return nodes;
    }

    return nodes;
  }

  onBeforeUnmount(stop);
  return { applyLayout, stop };
}

export function buildLinks(nodes: NodeDoc[]){
  const ids = new Set(nodes.map(n=>n.id));
  const out: {source:string; target:string}[] = [];
  nodes.forEach(n=>{
    (n.links||[]).forEach(v=>{
      const to = typeof v==='string' ? v : v.to;
      if (ids.has(to)) out.push({ source:n.id, target:to });
    });
  });
  return out;
}

/** Default assigner:
 *  - If a node has an explicit slot, honor it;
 *  - Otherwise distribute evenly per track by tag hash;
 *  - If no tracks exist yet, return null so caller can skip positioning.
 */
export function defaultAssign(nodes: NodeDoc[], tracks: TrackDef[]){
  if (!tracks.length) return null; // ⛑️ bail gracefully until tracks register

  const tCount = tracks.length;
  const group = new Map<string, Array<NodeDoc>>();
  nodes.forEach(n=>{
    const slot = (n as any as NodeWithSlot).slot;
    if (slot && tracks.some(t=>t.id===slot.trackId)) {
      const arr = group.get(slot.trackId) || [];
      (n as any).__t = slot.order ?? arr.length + 1;
      arr.push(n);
      group.set(slot.trackId, arr);
    } else {
      // naive hash by first tag, else id
      const key = (n.tags?.[0] ?? n.id);
      const idx = Math.abs(hashStr(key)) % tCount;
      const id = tracks[idx].id;
      const arr = group.get(id) || [];
      (n as any).__t = arr.length + 1;
      arr.push(n);
      group.set(id, arr);
    }
  });

  const mapping: Array<{node:NodeDoc; t:number; trackId:string}> = [];
  tracks.forEach(tr=>{
    const arr = (group.get(tr.id) || []);
    const N = arr.length;
    arr
      .sort((a,b)=>(a as any).__t - (b as any).__t)
      .forEach((n,i)=> mapping.push({ node:n, t:(i+1)/(N+1), trackId: tr.id }));
  });
  return mapping;
}

function hashStr(s:string){ let h=0; for(let i=0;i<s.length;i++){ h=((h<<5)-h)+s.charCodeAt(i); h|=0; } return h; }
