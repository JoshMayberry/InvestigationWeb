<template>
  <g v-if="active" class="ghost-track-layer" pointer-events="none">
    <!-- Line only when we have both endpoints (during step 1) -->
    <line v-if="hasLine"
      :x1="p1.x" :y1="p1.y" :x2="p2.x" :y2="p2.y"
      :stroke="color"
      :stroke-dasharray="dash"
      stroke-width="3"
      :stroke-opacity="opacity"
    />
    <!-- Endpoints -->
    <circle
      :cx="p1.x" :cy="p1.y" r="4.5"
      :fill="color" :fill-opacity="0.9"
      stroke="rgba(255,255,255,0.9)" stroke-width="1"
    />
    <circle v-if="hasLine"
      :cx="p2.x" :cy="p2.y" r="4.5"
      :fill="color" :fill-opacity="0.9"
      stroke="rgba(255,255,255,0.9)" stroke-width="1"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "TrackGhost",
  data(){ return { runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    ghost(): any { return this.runtime?.controllers?.trackPlacement?.ghost; },
    active(): boolean { return !!(this.ghost?.active); },
    hasLine(): boolean { return !!(this.ghost?.p1 && this.ghost?.p2); },
    color(): string { return this.ghost?.valid ? (this.ghost?.color || "#93c5fd") : "#ef4444"; },
    opacity(): number { return this.ghost?.valid ? 0.8 : 0.95; },
    dash(): string { return this.ghost?.valid ? "6 4" : "4 3"; },
    p1(): {x:number;y:number} {
      if (this.ghost?.p1) return this.ghost.p1;
      return this.ghost?.pointer || { x:0, y:0 };
    },
    p2(): {x:number;y:number} {
      if (this.ghost?.p2) return this.ghost.p2;
      return this.ghost?.pointer || { x:0, y:0 };
    }
  }
});
</script>

<style scoped>
.ghost-track-layer { pointer-events:none; }
</style>