<template>
  <g class="tracks" v-if="policy.canEditStructure">
    <TrackGhost />
    <g v-if="snapPlacementActive && snapPlacementTrack">
      <path
        :d="pathD(snapPlacementTrack)"
        fill="none"
        :stroke="snapThresholdColor"
        :stroke-width="snapThresholdStroke"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-opacity="0.18"
        vector-effect="non-scaling-stroke"
        pointer-events="none"
      />
    </g>
    <g v-for="t in tracks" :key="t.id" class="track" :class="{ sel: isSel(t.id) }">
      <!-- Slide pad -->
      <template v-if="showSlidePads">
        <line
          v-if="t.type==='straight'"
          class="slide-pad"
          :x1="t.p1.x" :y1="t.p1.y" :x2="t.p2.x" :y2="t.p2.y"
          :stroke="slidePadColor"
          :stroke-width="slidePadWidth"
          stroke-linecap="round"
          stroke-opacity="0.22"
          pointer-events="none"
        />
        <path
          v-else
          class="slide-pad"
          :d="pathD(t)"
          fill="none"
          :stroke="slidePadColor"
          :stroke-width="slidePadWidth"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-opacity="0.22"
          vector-effect="non-scaling-stroke"
          pointer-events="none"
        />
      </template>
      <template v-if="t.type==='straight'">
        <g v-if="(t.segments || 1) > 1" class="segmented">
          <line
            v-for="sl in straightSegmentLines(t)"
            :key="sl.idx"
            class="seg segment-part"
            :x1="sl.x1" :y1="sl.y1" :x2="sl.x2" :y2="sl.y2"
            :stroke="segColor(t, sl.idx)"
            stroke-width="3"
            stroke-opacity="0.85"
            @pointerdown="onTrackPointerDown(t, $event)"
            @mouseenter="onEnter(t.id)" @mouseleave="onLeave(t.id)"
            @click.stop
          />
        </g>
        <line
          v-else
          class="seg"
          :x1="t.p1.x" :y1="t.p1.y" :x2="t.p2.x" :y2="t.p2.y"
          :stroke="t.color || '#93c5fd'"
          stroke-width="3"
          stroke-opacity="0.85"
          @pointerdown="onTrackPointerDown(t, $event)"
          @mouseenter="onEnter(t.id)" @mouseleave="onLeave(t.id)"
          @click.stop
        />
      </template>
      <template v-else>
        <g class="segmented">
          <path
            v-for="sp in segmentPaths(t)"
            :key="sp.idx"
            class="seg segment-part"
            :d="sp.d"
            fill="none"
            :stroke="segColor(t, sp.idx)"
            stroke-width="3"
            stroke-opacity="0.85"
            vector-effect="non-scaling-stroke"
            @pointerdown="onTrackPointerDown(t, $event)"
            @mouseenter="onEnter(t.id)" @mouseleave="onLeave(t.id)"
            @click.stop
          />
        </g>
      </template>
      <template v-if="isSel(t.id)">
        <circle
          v-for="(p,idx) in [t.p1,t.p2]"
          :key="idx"
          :cx="p.x" :cy="p.y" r="6"
          class="handle"
          :fill="(t.locked ? '#64748b' : '#93c5fd')"
          stroke="#0b1226" stroke-width="2"
          :cursor="t.locked ? 'not-allowed' : 'grab'"
          @pointerdown="onHandleDown(t, idx, $event)"
          @click.stop
        />
      </template>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY } from "../../context/runtime";
import { trackPathD, projectPointToTrack, segmentSamplePaths, fastProjectPointToTrack } from "../../stores/util/trackGeometry";
import TrackGhost from "./TrackGhost.vue";

export default defineComponent({
  name: "WebTracks",
  components:{ TrackGhost },
  data(){
    return {
      runtime: inject(RUNTIME_KEY, null) as any,
      store: useInvestigationWebStore()
    };
  },
  computed:{
    tracks(): any[] { return this.store.tracks || []; },
    policy(): any { return this.store.policy || {}; },
    selCtrl(): any { return this.runtime?.controllers?.selection; },
    isSelId(): string | null { return this.selCtrl?.get?.() || null; },
    showSlidePads(): boolean {
      return this.store.settings.slideAlongTracks &&
             this.store.settings.showPadPreview &&
             this.store.currentEditState === "drag-free-node";
    },
    slidePadWidth(): number {
      return (this.store.settings.slideTrackThreshold || 28) * 2;
    },
    slidePadColor(): string { return "#3b82f6"; },
    snapPlacement(): any { return this.store.snapPlacement || { active:false }; },
    snapPlacementActive(): boolean { return !!this.snapPlacement.active && !!this.snapPlacement.trackId; },
    snapPlacementTrack(): any {
      if (!this.snapPlacementActive) return null;
      return this.tracks.find(t => t.id === this.snapPlacement.trackId) || null;
    },
    snapThreshold(): number {
      return this.store.settings.snapPlacementThreshold || this.store.settings.slideTrackThreshold || 32;
    },
    snapThresholdStroke(): number { return this.snapThreshold * 2; },
    snapThresholdColor(): string { return "#22d3ee"; }
  },
  methods:{
    pathD(t:any){ return trackPathD(t); },
    projectT(track:any, x:number, y:number){ return projectPointToTrack(track, x, y).t; },
    isSel(id:string){ return this.isSelId === id; },
    onEnter(id:string){ this.runtime?.controllers?.hover?.set(id); },
    onLeave(){ this.runtime?.controllers?.hover?.clear(); },
    onTrackPointerDown(t:any, e:PointerEvent){
      const view = this.runtime?.controllers?.view;
      if (this.store.tools.addSnapNode || this.store.tools.placeStagedSnapId){
        if (!view) return;
        const w0 = view.worldFromClient(e.clientX, e.clientY);
        const projT = fastProjectPointToTrack(t, w0.x, w0.y).t;
        if (this.store.tools.addSnapNode){
          const snap = this.store.addSnapNode({ trackId: t.id, tHint: projT });
          this.runtime?.controllers?.selection?.set(snap.id);
          if (!e.shiftKey) this.store.setAddSnapNode(false);
        } else if (this.store.tools.placeStagedSnapId){
          const snap = this.store.placeSnapFromStaging(this.store.tools.placeStagedSnapId, t.id, projT);
          this.runtime?.controllers?.selection?.set(snap?.id || null);
          if (!e.shiftKey) this.store.setPlaceStagedSnap(null);
        }
        e.stopPropagation(); e.preventDefault(); return;
      }
      if (this.store?.tools?.addTrack) return;
      if (this.isSel(t.id) && !t.locked){
        e.stopPropagation(); e.preventDefault();
        this.dragWholeTrack(t, e);
        return;
      }
      e.stopPropagation();
      this.selCtrl?.set(t.id);
      // no auto-switch to group; calc tracks are selectable (but locked for drag)
    },
    dragWholeTrack(t:any, e:PointerEvent){
      const view = this.runtime?.controllers?.view;
      if (!view) return;
      const wasSelected = this.isSel(t.id); // keep selection
      this.store.startTrackDragGhost(t, "translate");
      const start = { x: e.clientX, y: e.clientY };
      const baseP1 = { ...t.p1 }, baseP2 = { ...t.p2 };
      this.store?.setCurrentEditState?.("drag-track");
      const move = (ev:PointerEvent)=>{
        const w0 = view.worldFromClient(start.x, start.y);
        const w1 = view.worldFromClient(ev.clientX, ev.clientY);
        let dx = w1.x - w0.x, dy = w1.y - w0.y;
        if (this.store.settings.enableGrid && !ev.altKey){
          const gs = this.store.settings.gridSize || 16;
          const snap = (v:number,s:number)=> Math.round(v/s)*s;
          const gp1 = { x: snap(baseP1.x+dx, gs), y: snap(baseP1.y+dy, gs) };
          dx = gp1.x - baseP1.x; dy = gp1.y - baseP1.y;
        }
        this.store.updateTrackDragGhost(
          { x: baseP1.x + dx, y: baseP1.y + dy },
          { x: baseP2.x + dx, y: baseP2.y + dy }
        );
      };
      const up = ()=>{
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        this.store.endTrackDragGhost(true);
        if (wasSelected) {
          this.selCtrl?.set(t.id);
          this.store.suppressClearSelectionUntil = Date.now() + 150;
        }
        this.store?.setCurrentEditState?.("edit-selected-node");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once:true });
    },
    onHandleDown(t:any, idx:number, e:PointerEvent){
      if (t.locked) return;
      const view = this.runtime?.controllers?.view;
      if (!view) return;
      const wasSelected = this.isSel(t.id);
      e.stopPropagation(); e.preventDefault();
      this.store.startTrackDragGhost(t, "end");
      this.store?.setCurrentEditState?.("drag-track-end");
      const fixed = idx===0 ? { ...t.p2 } : { ...t.p1 };
      const movingKey = idx===0 ? "p1" : "p2";
      const move = (ev:PointerEvent)=>{
        const w = view.worldFromClient(ev.clientX, ev.clientY);
        let next = { x:w.x, y:w.y };
        if (this.store.settings.enableGrid && !ev.altKey){
          const gs = this.store.settings.gridSize || 16;
          next = { x: Math.round(next.x/gs)*gs, y: Math.round(next.y/gs)*gs };
        }
        const p1 = movingKey==="p1" ? next : fixed;
        const p2 = movingKey==="p2" ? next : fixed;
        this.store.updateTrackDragGhost(p1, p2);
      };
      const up = ()=>{
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        this.store.endTrackDragGhost(true);
        if (wasSelected) {
          this.selCtrl?.set(t.id);
          this.store.suppressClearSelectionUntil = Date.now() + 150;
        }
        this.store?.setCurrentEditState?.("edit-selected-node");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once:true });
    },
    segmentPaths(t:any){
      const segs = Math.max(1, t.segments || 1);
      if (segs === 1) return [ { d: this.pathD(t), idx:0 } ];
      return segmentSamplePaths(t, segs).map((d,idx)=> ({ d, idx }));
    },
    straightSegmentLines(t:any){
      const segs = Math.max(1, t.segments || 1);
      if (segs === 1) return [{
        idx:0,
        x1:t.p1.x, y1:t.p1.y,
        x2:t.p2.x, y2:t.p2.y
      }];
      const lines = [];
      for (let i=0;i<segs;i++){
        const f0 = i / segs;
        const f1 = (i+1) / segs;
        lines.push({
          idx:i,
          x1: t.p1.x + (t.p2.x - t.p1.x)*f0,
          y1: t.p1.y + (t.p2.y - t.p1.y)*f0,
          x2: t.p1.x + (t.p2.x - t.p1.x)*f1,
          y2: t.p1.y + (t.p2.y - t.p1.y)*f1
        });
      }
      return lines;
    },
    segColor(t:any, idx:number){
      const base = t.color || "#3b82f6";
      if ((t.segments||1) === 1) return base;
      // Alternate between base and a desaturated / light hue shift
      if (idx % 2 === 0) return base;
      // Simple HSL lighten approximation
      try {
        const c = base.startsWith("#") ? base.slice(1) : base;
        const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
        const lighten = (v:number)=> Math.min(255, Math.round(v*0.55 + 255*0.45));
        return `#${[lighten(r),lighten(g),lighten(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}`;
      } catch { return "#a5d8ff"; }
    },
  }
});
</script>

<style scoped>
.tracks .seg { cursor: pointer; }
.handle { pointer-events: all; }
.track.sel .seg { stroke-width: 4; }
.slide-pad { mix-blend-mode: screen; }
</style>