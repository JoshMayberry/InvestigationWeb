import type { NavDoc, NodeDoc } from '../types';
import { makeVirtueTierAssigner } from '../patterns/assigners';

type Legacy = {
  version:number;
  appMode?: string;
  linkDefaults?: any;
  nodes: Array<any>;
};

const virtueColor: Record<string,string> = {
  Endurance:'#e74c3c',   // red
  Harmony:'#fdd835',     // yellow
  Remembrance:'#1e90ff', // blue
};

export function importLegacyV4(
  legacy: Legacy,
  opt: { ns?:string; order?:string[]; segments?:string[] } = {}
){
  const ns   = opt.ns ?? 'tv-';
  const order = opt.order ?? ['Endurance','Harmony','Remembrance'];
  const segs  = opt.segments ?? ['deep','mid','shallow'];

  const nodes: NodeDoc[] = legacy.nodes.map((n:any)=>({
    id: n.id,
    title: n.title,
    // keep virtue/tier/boundary so the assigner can see them (loose-typed)
    virtue: n.virtue,
    tier: n.tier,
    boundary: n.boundary,
    tags: Array.isArray(n.tags) ? n.tags : [],
    style: {
      ...(n.style||{}),
      fill: virtueColor[n.virtue] ?? (n.style?.fill),
    },
    // drop legacy x/y so static tracks can place them
    x: undefined, y: undefined,
    data: {
      source: n.source ?? null,
      bonus: n.bonus ?? null
    },
    links: (n.links||[]).map((v:any)=> typeof v==='string' ? v : ({ to:v.to, cfg:v.cfg }))
  }));

  const doc: NavDoc = {
    version: 1,
    layout: { kind:'static', strategyId:'three-spirals' },
    linkDefaults: legacy.linkDefaults ?? { style:'straight', outward:-12, curve:6, laneSpacing:14 },
    nodes
  };

  const assign = makeVirtueTierAssigner({
    order, segmentNames: segs, preferBoundary:true, ns
  });

  return { doc, assign };
}
