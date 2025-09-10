<template>
  <g v-if="layoutPreview.length" class="snap-layout-preview" pointer-events="none">
    <circle
      v-for="p in layoutPreview"
      :key="p.id"
      :cx="p.x" :cy="p.y"
      :r="defaultR"
      :fill="p.isGhost ? segmentFill(p.posT, true, p.segments) : segmentFill(p.posT, false, p.segments)"
      :stroke="p.isGhost ? segmentStroke(p.posT, true, p.segments) : segmentStroke(p.posT, false, p.segments)"
      stroke-width="2"
      :stroke-dasharray="p.isGhost ? '6 4':'4 6'"
    />
  </g>

  <g v-else-if="snapGhost.active" class="snap-placement-ghost" :transform="`translate(${snapGhost.x},${snapGhost.y})`" pointer-events="none">
    <circle
      :r="defaultR"
      :fill="snapGhost.valid ? 'rgba(34,211,238,0.45)' : 'rgba(239,68,68,0.30)'"
      :stroke="snapGhost.valid ? '#22d3ee' : '#ef4444'"
      stroke-width="2"
      :stroke-dasharray="snapGhost.valid ? '6 4' : '4 4'"
    />
  </g>

  <g v-if="dragGhost?.active" class="ghost-layer" :transform="`translate(${dragGhost.x},${dragGhost.y})`" pointer-events="none">
    <circle
      :r="dragGhost.r"
      :fill="dragGhost.invalid ? 'rgba(239,68,68,0.30)' : dragGhost.color"
      :stroke="dragGhost.invalid ? '#ef4444' : dragGhost.color"
      stroke-width="2"
      :stroke-dasharray="dragGhost.invalid ? '4 4' : undefined"
    />
    <text
      v-if="dragGhost.label"
      class="ghost-label"
      y="-18"
      text-anchor="middle"
      font-size="11"
      :fill="dragGhost.invalid ? '#ffc9c9' : '#c8d3ff'"
      fill-opacity="0.75"
    >{{ dragGhost.label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";
import { projectPointToTrack, pointAtTrackPosition } from "../../stores/util/trackGeometry"; // NEW

export default defineComponent({
  name: "NodeGhost",
  data(){
    return {
      runtime: inject(RUNTIME_KEY, null) as any,
      store: useInvestigationWebStore()
    };
  },
  computed:{
    dragGhost(): any { return this.runtime?.controllers?.drag?.ghost; },
    snapGhost(): any { return this.store.snapPlacement || { active:false }; },
    defaultR(): number { return this.store.settings?.defaultNode?.r || 14; },
    layoutPreview(): any[] {
      if (!this.store.settings.snapPreviewLayout) return [];
      const ghostAdd = this.snapGhost.active && this.snapGhost.valid && this.snapGhost.trackId;
      const ghostDrag = this.dragGhost?.active && this.dragGhost.mode === "drag-node";

      let track:any = null;
      let tHint:number|undefined;
      let sourceNode:any = null;
      let mode:"add"|"drag"|null = null;

      if (ghostAdd){
        track = this.store.tracks.find((t:any)=> t.id===this.snapGhost.trackId);
        tHint = this.snapGhost.t;
        mode = "add";
      } else if (ghostDrag){
        sourceNode = this.store.nodes.find((n:any)=> n.id===this.dragGhost.sourceId && n.kind==="snap");
        if (!sourceNode) return [];
        // nearest track
        let nearest:any = null;
        for (const t of this.store.tracks){
          const proj = projectPointToTrack(t, this.dragGhost.x, this.dragGhost.y);
          if (!nearest || proj.dist < nearest.dist) nearest = { tObj:t, t:proj.t, dist:proj.dist };
        }
        if (!nearest) return [];
        track = nearest.tObj;
        tHint = nearest.t;
        mode = "drag";
      }
      if (!track) return [];
      const segCount = Math.max(1, track.segments || 1);

      // Gather existing snaps (excluding dragged one)
      const snaps = this.store.nodes.filter((n:any)=> n.kind==="snap" && n.trackId===track.id && (!sourceNode || n.id !== sourceNode.id));

      // Build projection list for ordering inside segments
      const projList = snaps.map(n=>{
        const proj = projectPointToTrack(track, n.x, n.y);
        let segIdx = typeof n.trackSegment === "number" ? n.trackSegment : Math.min(segCount-1, Math.floor(proj.t * segCount));
        return { id:n.id, t: proj.t, seg: segIdx };
      });

      // Determine target segment for ghost
      let ghostSeg = 0;
      if (tHint != null){
        ghostSeg = Math.min(segCount-1, Math.floor(tHint * segCount));
      }
      if (mode === "drag" && sourceNode && typeof sourceNode.trackSegment === "number"){
        ghostSeg = Math.min(segCount-1, sourceNode.trackSegment);
      }

      // Insert ghost into its segment list for ordering
      if (tHint != null){
        projList.push({ id:"__ghost__", t:tHint, seg: ghostSeg });
      }

      // Group by segment
      const groups: Record<number, { id:string; t:number; seg:number }[]> = {};
      for (let s=0;s<segCount;s++) groups[s] = [];
      for (const p of projList) {
        if (p.seg < 0 || p.seg >= segCount) p.seg = Math.min(segCount-1, Math.max(0,p.seg));
        groups[p.seg].push(p);
      }

      const out:any[] = [];
      let globalIdx = 0;
      for (let seg=0; seg<segCount; seg++){
        const list = groups[seg];
        if (!list.length) continue;
        list.sort((a,b)=> a.t - b.t);
        const t0 = seg / segCount;
        const t1 = (seg+1)/segCount;
        const count = list.length;
        for (let i=0;i<count;i++){
          const localPos = (i+1)/(count+1);
            const posT = t0 + (t1 - t0)*localPos;
          const pt = pointAtTrackPosition(track, posT);
          out.push({
            id: list[i].id==="__ghost__" ? (mode==="drag" ? `ghost-${sourceNode?.id}` : "__ghost__") : list[i].id,
            x: pt.x, y: pt.y,
            isGhost: list[i].id==="__ghost__",
            posT,
            segments: segCount
          });
          globalIdx++;
        }
      }
      return out;
    }
  },
  methods:{
    segmentIndex(posT:number, segments?:number){
      const segs = Math.max(1, segments || 1);
      return Math.min(segs-1, Math.floor(posT * segs));
    },
    segmentFill(posT:number, ghost:boolean, segments?:number){
      const idx = this.segmentIndex(posT, segments);
      return ghost
        ? (idx % 2 === 0 ? 'rgba(34,211,238,0.55)' : 'rgba(56,189,248,0.55)')
        : (idx % 2 === 0 ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.28)');
    },
    segmentStroke(posT:number, ghost:boolean, segments?:number){
      const idx = this.segmentIndex(posT, segments);
      return ghost
        ? (idx % 2 === 0 ? '#22d3ee' : '#38bdf8')
        : (idx % 2 === 0 ? '#64748b' : '#475569');
    }
  }
});
</script>

<style scoped>
.snap-layout-preview { pointer-events:none; }
.ghost-layer,
.snap-placement-ghost { pointer-events:none; opacity:0.9; }
</style>