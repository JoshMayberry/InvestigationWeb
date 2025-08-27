import * as d3 from 'd3';
import type { NodeDoc } from '../types';

export interface ForceOptions {
  width: number;
  height: number;
  charge?: number;
  linkDistance?: number;
}

export function runForceLayout(
  nodes: NodeDoc[],
  // keep links as ids; D3 resolves them using .id()
  links: Array<{ source: string; target: string }>,
  options: ForceOptions,
  onTick?: () => void
){
  type SimNode = NodeDoc & d3.SimulationNodeDatum;
  type SimLink = d3.SimulationLinkDatum<SimNode>;

  // Optional: filter out links that reference missing ids
  const validIds = new Set(nodes.map(n => n.id));
  const safeLinks = links.filter(l => validIds.has(l.source) && validIds.has(l.target));

  const sim = d3.forceSimulation<SimNode>(nodes as SimNode[])
    .force('charge', d3.forceManyBody<SimNode>().strength(options.charge ?? -100))
    .force('center', d3.forceCenter(options.width/2, options.height/2))
    .force('link',
      d3.forceLink<SimNode, SimLink>(safeLinks)
        .id((d: any) => d.id)                    // resolve by node.id
        .distance(options.linkDistance ?? 80)
    )
    .on('tick', () => onTick?.());

  return () => sim.stop();
}
