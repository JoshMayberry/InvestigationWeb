<template>
  <g class="tracks" v-if="policy.canEditStructure">
    <g v-for="t in tracks" :key="t.id" class="track" :class="{ sel: isSel(t.id) }">
      <line
        class="seg"
        :x1="t.p1.x" :y1="t.p1.y" :x2="t.p2.x" :y2="t.p2.y"
        :stroke="t.color || '#93c5fd'"
        stroke-width="3"
        stroke-opacity="0.85"
        @pointerdown="onTrackPointerDown(t, $event)"
        @mouseenter="onEnter(t.id)" @mouseleave="onLeave(t.id)"
      />
      <template v-if="isSel(t.id)">
        <circle v-for="(p,idx) in [t.p1,t.p2]" :key="idx"
          :cx="p.x" :cy="p.y" r="6"
          class="handle"
          :fill="(t.locked ? '#64748b' : '#93c5fd')"
          stroke="#0b1226" stroke-width="2"
          :cursor="t.locked ? 'not-allowed' : 'grab'"
          @pointerdown="onHandleDown(t, idx, $event)"
        />
      </template>
    </g>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "WebTracks",
  data(){ return { runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    store(): any { return this.runtime?.store; },
    tracks(): any[] { return this.store?.tracks || []; },
    policy(): any { return this.runtime?.policy || this.store?.policy || {}; },
    selCtrl(): any { return this.runtime?.controllers?.selection; },
    isSelId(): string | null { return this.selCtrl?.get?.() || null; },
  },
  methods:{
    isSel(id:string){ return this.isSelId === id; },
    onEnter(id:string){ this.runtime?.controllers?.hover?.set(id); },
    onLeave(){ this.runtime?.controllers?.hover?.clear(); },
    onTrackPointerDown(t:any, e:PointerEvent){
      if (this.store?.tools?.addTrack) {
        // Let placement handle clicks; do not stop/bubble
        return;
      }
      // If selected and not locked, dragging the segment moves whole track
      if (this.isSel(t.id) && !t.locked) {
        e.stopPropagation();
        e.preventDefault();
        this.dragWholeTrack(t, e);
        return;
      }
      // Otherwise select
      e.stopPropagation();
      this.selCtrl?.set(t.id);
    },
    dragWholeTrack(t:any, e:PointerEvent){
      const view = this.runtime?.controllers?.view;
      if (!view) return;
      const start = { x: e.clientX, y: e.clientY };
      const startP1 = { ...t.p1 }, startP2 = { ...t.p2 };
      const preventCross = !!this.store?.settings?.preventTrackCrossing;
      this.store?.setCurrentEditState?.("drag-track");

      const move = (ev:PointerEvent) => {
        const w0 = view.worldFromClient(start.x, start.y);
        const w1 = view.worldFromClient(ev.clientX, ev.clientY);
        let dx = w1.x - w0.x, dy = w1.y - w0.y;

        // Grid snap (unless Alt)
        const gs = this.store?.settings?.enableGrid ? (this.store?.settings?.gridSize || 16) : 0;
        const useGrid = !!this.store?.settings?.enableGrid && !ev.altKey && gs > 0;
        if (useGrid) {
          // snap translation by snapping each endpoint to nearest grid while preserving delta
          const np1 = snapToGrid({ x: startP1.x + dx, y: startP1.y + dy }, gs);
          dx = np1.x - startP1.x;
          dy = np1.y - startP1.y;
        }

        const nextP1 = { x: startP1.x + dx, y: startP1.y + dy };
        const nextP2 = { x: startP2.x + dx, y: startP2.y + dy };

        if (preventCross){
          let blocked = false;
          for (const tt of this.tracks){
            if (tt.id === t.id) continue;
            if (segmentsIntersect(nextP1, nextP2, tt.p1, tt.p2)) { blocked = true; break; }
          }
          if (blocked) return;
        }
        this.store?.patchTrack?.(t.id, { p1: nextP1, p2: nextP2 });
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        this.store?.setCurrentEditState?.("edit-selected-node");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once:true });
    },
    onHandleDown(t:any, idx:number, e:PointerEvent){
      if (t.locked) return;
      const view = this.runtime?.controllers?.view;
      if (!view) return;

      e.stopPropagation();
      e.preventDefault();
      const target = e.currentTarget as Element | null;
      try { (target as any)?.setPointerCapture?.(e.pointerId); } catch {}

      const otherP = idx === 0 ? { ...t.p2 } : { ...t.p1 };
      const preventCross = !!this.store?.settings?.preventTrackCrossing;

      const move = (ev:PointerEvent) => {
        const w = view.worldFromClient(ev.clientX, ev.clientY);
        let nextP = { x: w.x, y: w.y };

        // Grid snap (unless Alt)
        if (this.store?.settings?.enableGrid && !ev.altKey) {
          const gs = this.store?.settings?.gridSize || 16;
          if (gs > 0) nextP = snapToGrid(nextP, gs);
        }

        if (preventCross){
          let blocked = false;
          for (const tt of this.tracks){
            if (tt.id === t.id) continue;
            if (segmentsIntersect(otherP, nextP, tt.p1, tt.p2)) { blocked = true; break; }
          }
          if (blocked) return;
        }
        const patch:any = idx === 0 ? { p1: nextP } : { p2: nextP };
        this.store?.patchTrack?.(t.id, patch);
        this.store?.setCurrentEditState?.("drag-track-end");
      };
      const up = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        try { (target as any)?.releasePointerCapture?.(e.pointerId); } catch {}
        this.store?.setCurrentEditState?.("edit-selected-node");
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up, { once:true });
    }
  }
});

// helpers
function snapToGrid(p:{x:number;y:number}, step:number){
  const gx = Math.round(p.x / step) * step;
  const gy = Math.round(p.y / step) * step;
  return { x: gx, y: gy };
}
function segmentsIntersect(a1:any,a2:any,b1:any,b2:any){
  function orient(p:any,q:any,r:any){ const v=(q.y-p.y)*(r.x-q.x)-(q.x-p.x)*(r.y-q.y); return Math.sign(v); }
  function onSeg(p:any,q:any,r:any){ return Math.min(p.x,r.x)-1e-6<=q.x&&q.x<=Math.max(p.x,r.x)+1e-6 && Math.min(p.y,r.y)-1e-6<=q.y&&q.y<=Math.max(p.y,r.y)+1e-6; }
  const o1=orient(a1,a2,b1),o2=orient(a1,a2,b2),o3=orient(b1,b2,a1),o4=orient(b1,b2,a2);
  if (o1!==o2 && o3!==o4) return true;
  if (o1===0&&onSeg(a1,b1,a2)) return true;
  if (o2===0&&onSeg(a1,b2,a2)) return true;
  if (o3===0&&onSeg(b1,a1,b2)) return true;
  if (o4===0&&onSeg(b1,a2,b2)) return true;
  return false;
}
</script>

<style scoped>
.tracks .seg { cursor: pointer; }
.handle { pointer-events: all; }
.track.sel .seg { stroke: var(--accent); stroke-width: 4; }
</style>