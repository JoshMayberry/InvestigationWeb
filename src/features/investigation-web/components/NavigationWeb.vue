<template>
  <svg
    ref="svgSel"
    :width="width"
    :height="height"
    :viewBox="`0 0 ${width} ${height}`"
    style="background:radial-gradient(1200px 800px at 60% -10%, #162155 0%, #0b1020 60%);
           border:1px solid #1b2460; border-radius:10px;"
  >
    <g data-root ref="rootSel" />
    <!-- Static tracks are provided by the parent using the #tracks slot -->
    <slot name="tracks" />
  </svg>
</template>

<script lang="ts">
import { defineComponent, PropType, provide, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import * as d3 from 'd3';
import type { NavDoc, NodeDoc, TrackDef } from '../types';
import { TracksKey } from '../utils/keys';
import { routePath } from '../patterns/paths';
import { useLayout, defaultAssign } from '../utils/useLayout';
import { computeLaneOffsets } from '../utils/lanes';

export default defineComponent({
  name: 'NavigationWeb',
  props: {
    doc: { type: Object as PropType<NavDoc>, required: true },
    width: { type: Number, default: 1200 },
    height: { type: Number, default: 700 },
    assign: {
      type: Function as PropType<(nodes: NodeDoc[], tracks: TrackDef[]) =>
        Array<{ node:NodeDoc; t:number; trackId:string }> | null>,
      default: undefined
    }
  },
  emits: ['node:click','node:hover'],
  setup(props, { emit }) {
    const tracks = ref<TrackDef[]>([]);
    const zoom = ref<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const positioned = ref<NodeDoc[]>([]);
    const rootSel = ref<SVGGElement|null>(null);
    const svgSel = ref<SVGSVGElement|null>(null);
    const { applyLayout, stop } = useLayout();

    // Provide register/unregister so <TrackDef/> children in the #tracks slot
    // can contribute their geometry before we layout.
    provide(TracksKey, {
      register: (t: TrackDef) => {
        tracks.value = [...tracks.value.filter(x => x.id !== t.id), t];
        redraw();
      },
      unregister: (id: string) => {
        tracks.value = tracks.value.filter(t => t.id !== id);
        redraw();
      }
    });

    function isFinitePoint(n: NodeDoc){
      return Number.isFinite(n?.x as number) && Number.isFinite(n?.y as number);
    }

    function layoutAndRender() {
      if (!props.doc || !rootSel.value) return;

      // compute layout (static uses tracks, dynamic uses force)
      positioned.value = applyLayout(
        props.doc,
        props.doc.layout.kind === 'static' ? tracks.value : null,
        props.doc.layout.kind === 'static' ? (props.assign ?? defaultAssign) : defaultAssign,
        { width: props.width, height: props.height },
        () => _render() // tick for dynamic
      );

      _render();
    }

    function _render(){
      const g = d3.select(rootSel.value!);
      g.selectAll('*').remove();

      const nodes = positioned.value;
      if (!nodes || nodes.length === 0) return;

      const nodesById = new Map(nodes.map(n=>[n.id,n]));
      const linkDefaults = props.doc.linkDefaults;

      // Build edge list; skip edges whose endpoints aren't positioned yet.
      const rawEdges: Array<{ id:string; s:NodeDoc; t:NodeDoc; cfg:any }> = [];
      nodes.forEach(s=>{
        (s.links||[]).forEach(v=>{
          const to = typeof v==='string' ? v : v.to;
          const t = nodesById.get(to);
          if (!t || !isFinitePoint(s) || !isFinitePoint(t)) return;
          const cfg = { ...linkDefaults, ...(typeof v==='string' ? {} : (v.cfg||{})) };
          rawEdges.push({ id: `${s.id}>${to}`, s, t, cfg });
        });
      });

      // Distribute parallel edges into "lanes" so they don't overlap.
      // The lane calculator expects angles around (0,0), so give it
      // center-relative coordinates.
      const cx = props.width / 2, cy = props.height / 2;
      const centeredEdges = rawEdges.map(e => ({
        id: e.id,
        source: { ...e.s, x: (e.s.x as number) - cx, y: (e.s.y as number) - cy },
        target: { ...e.t, x: (e.t.x as number) - cx, y: (e.t.y as number) - cy }
      }));

      const laneOffset = computeLaneOffsets(centeredEdges, linkDefaults.laneSpacing);

      // links (behind nodes)
      g.append('g').attr('class','links')
        .selectAll('path')
        .data(rawEdges, (d:any)=>d.id)
        .join('path')
        .attr('d', (d:any)=> {
          const lo = laneOffset.get(d.id) ?? 0;
          // routePath is defensive (returns '' if x/y invalid)
          return routePath(d.s, d.t, { ...d.cfg, laneOffset: lo } as any);
        })
        .attr('fill','none')
        .attr('stroke','#44507a')
        .attr('stroke-opacity', .6)
        .attr('stroke-width', 2);

      // nodes
      const nodeG = g.append('g').attr('class','nodes')
        .selectAll('g')
        .data(nodes, (d:any)=>d.id)
        .join('g')
        .attr('transform', (d:any)=>`translate(${d.x||0},${d.y||0})`)
        .style('cursor','pointer')
        .on('click', (_evt:MouseEvent, d:any)=> emit('node:click', d))
        .on('mouseenter', (_evt:MouseEvent, d:any)=> emit('node:hover', d))
        .on('mouseleave', ()=> emit('node:hover', null));

      nodeG.append('circle')
        .attr('r', (d:any)=> d.style?.r ?? 12)
        .attr('fill', (d:any)=> d.style?.fill ?? '#1e90ff')
        .attr('stroke', (d:any)=> d.style?.stroke ?? '#15204e')
        .attr('stroke-width', 2);

      nodeG.append('text')
        .text((d:any)=> d.title ?? d.id)
        .attr('y', -16)
        .attr('text-anchor','middle')
        .attr('fill','#c8d3ff')
        .attr('font-size', 11);

      // optional track labels (at t=0 if supplied)
      const labelLayer = d3.select(rootSel.value!).append('g').attr('class','track-labels');
      tracks.value.forEach(tr=>{
        if (!tr.labelAt) return;
        try {
          const p = tr.labelAt(0);
          if (!Number.isFinite(p?.x as number) || !Number.isFinite(p?.y as number)) return;
          labelLayer.append('text')
            .attr('x', p.x).attr('y', p.y)
            .attr('text-anchor', p.anchor || 'middle')
            .attr('fill', '#9aa6d1').attr('font-size', 11)
            .text(tr.id);
        } catch { /* no-op */ }
      });
    }

    function initZoom(){
      if (zoom.value || !svgSel.value || !rootSel.value) return;
      zoom.value = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.5,2.5])
        .on('zoom', (e)=> d3.select(rootSel.value!).attr('transform', e.transform as any));
      d3.select(svgSel.value).call(zoom.value as any);
    }

    function redraw(){ stop(); layoutAndRender(); }

    watch(()=>props.doc, redraw, { deep:true });
    watch(tracks, redraw, { deep:true });

    onMounted(()=>{ layoutAndRender(); initZoom(); });
    onBeforeUnmount(()=> stop());

    return { tracks, rootSel, svgSel };
  }
});
</script>
