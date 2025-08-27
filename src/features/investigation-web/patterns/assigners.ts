import type { NodeDoc, TrackDef } from '../types';

type Opts = {
  /** order maps virtue -> spiral index */
  order?: string[];                     // default ['Endurance','Harmony','Remembrance']
  /** deep→mid→shallow names used by SpiralTracks */
  segmentNames?: string[];              // default ['deep','mid','shallow']
  /** if a node has boundary, prefer boundary tracks over spiral tracks */
  preferBoundary?: boolean;             // default true
  /** id prefix used by <SpiralTracks ns="..."> */
  ns?: string;                          // default 'tv-'
};

const get = (n: any, k: string) => n?.[k] ?? n?.data?.[k] ?? null;

export function makeVirtueTierAssigner(opts: Opts = {}){
  const order        = opts.order ?? ['Endurance','Harmony','Remembrance'];
  const segmentNames = opts.segmentNames ?? ['deep','mid','shallow'];
  const preferBoundary = opts.preferBoundary ?? true;
  const ns = (opts.ns ?? 'tv-');

  return (nodes: NodeDoc[], tracks: TrackDef[]) => {
    const trackIds = new Set(tracks.map(t=>t.id));

    function idFor(n:any){
      const virtue   = get(n,'virtue');
      const tier     = get(n,'tier');
      const boundary = get(n,'boundary');
      const seg = segmentNames.includes(tier) ? tier : segmentNames[0];
      if (preferBoundary && Number.isFinite(boundary)){
        return `${ns}boundary-${boundary}-${seg}`;
      }
      const vi = Math.max(0, order.indexOf(virtue));
      return `${ns}spiral-${vi}-${seg}`;
    }

    // bucket by target track, then spread along 0..1
    const buckets = new Map<string, NodeDoc[]>();
    nodes.forEach(n=>{
      const id = idFor(n);
      if (!trackIds.has(id)) return;              // unknown track: skip
      (buckets.get(id) || buckets.set(id, []).get(id)!).push(n);
    });

    const mapping: Array<{ node:NodeDoc; t:number; trackId:string }> = [];
    tracks.forEach(tr=>{
      const arr = (buckets.get(tr.id) || []);
      const N = arr.length;
      arr.forEach((n,i)=> mapping.push({ node:n, t:(i+1)/(N+1), trackId: tr.id }));
    });
    return mapping;
  };
}
