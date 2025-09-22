<template>
  <g v-if="active" class="ghost-track-layer" pointer-events="none">
    <path
      v-if="hasLine"
      :d="pathD"
      fill="none"
      :stroke="color"
      :stroke-dasharray="dash"
      stroke-width="4"
      :stroke-opacity="opacity"
      vector-effect="non-scaling-stroke"
    />
    <!-- endpoints -->
    <circle
      :cx="p1.x" :cy="p1.y" r="6"
      :fill="color"
      :fill-opacity="0.95"
      stroke="#0b1226" stroke-width="2"
    />
    <circle
      v-if="hasLine"
      :cx="p2.x" :cy="p2.y" r="6"
      :fill="color"
      :fill-opacity="0.95"
      stroke="#0b1226" stroke-width="2"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";
import { trackPathD } from "../../stores/util/trackGeometry";

export default defineComponent({
  name: "TrackGhost",
  setup(){
    const runtime:any = inject(RUNTIME_KEY, null);
    const store = useInvestigationWebStore();
    return { runtime, store };
  },
  computed:{
    placeGhost(): any { return this.runtime?.controllers?.trackPlacement?.ghost; },
    dragGhost(): any { return this.store.trackDragGhost; },
    usingDrag(): boolean { return !!this.dragGhost?.active; },
    ghost(): any { return this.usingDrag ? this.dragGhost : this.placeGhost; },
    active(): boolean { return !!this.ghost?.active; },
    hasLine(): boolean {
      return !!(this.p1 && this.p2 && (this.p1.x !== this.p2.x || this.p1.y !== this.p2.y));
    },
    p1(): {x:number;y:number} {
      if (this.ghost?.p1) return this.ghost.p1;
      return this.ghost?.pointer || { x:0, y:0 };
    },
    p2(): {x:number;y:number} {
      if (this.ghost?.p2) return this.ghost.p2;
      return this.ghost?.pointer || { x:0, y:0 };
    },
    color(): string { return this.ghost?.valid ? (this.ghost?.color || "#93c5fd") : "#ef4444"; },
    opacity(): number { return this.ghost?.valid ? 0.85 : 0.95; },
    dash(): string { return this.ghost?.valid ? "6 4" : "4 3"; },
    pathD(): string {
      if (!this.hasLine) return "";
      // Build a temp track shape
      if (this.usingDrag){
        const base = this.store.tracks.find((t:any)=> t.id === this.dragGhost.trackId);
        if (!base) return `M ${this.p1.x} ${this.p1.y} L ${this.p2.x} ${this.p2.y}`;
        const temp = { ...base, p1: this.p1, p2: this.p2 };
        return trackPathD(temp);
      } else {
        // placement: use draft settings
        const d = this.store.trackDraft;
        const temp:any = {
          id:"(ghost)",
            kind:"free",
          type: d.type || "straight",
          p1: this.p1,
          p2: this.p2,
          midControls: d.midControls,
          c1: d.c1,
          c2: d.c2,
          symmetric: d.symmetric,
          controls: d.controls,
          tension: d.tension,
          turns: d.turns,
          startRadius: d.startRadius,
          endRadius: d.endRadius,
          direction: d.direction
        };
        return trackPathD(temp);
      }
    }
  }
});
</script>

<style scoped>
.ghost-track-layer { pointer-events:none; }
</style>