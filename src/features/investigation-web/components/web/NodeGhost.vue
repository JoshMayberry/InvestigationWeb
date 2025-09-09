<template>
  <g v-if="ghost?.active" class="ghost-layer" :transform="`translate(${ghost.x},${ghost.y})`" pointer-events="none">
    <circle
      :r="ghost.r"
      :fill="ghost.invalid ? 'rgba(239,68,68,0.30)' : ghost.color"
      :stroke="ghost.invalid ? '#ef4444' : ghost.color"
      stroke-width="2"
      :stroke-dasharray="ghost.invalid ? '4 4' : undefined"
    />
    <text
      v-if="ghost.label"
      class="ghost-label"
      y="-18"
      text-anchor="middle"
      font-size="11"
      :fill="ghost.invalid ? '#ffc9c9' : '#c8d3ff'"
      fill-opacity="0.75"
    >{{ ghost.label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "NodeGhost",
  data(){ return { runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{ ghost(): any { return this.runtime?.controllers?.drag?.ghost; } }
});
</script>

<style scoped>
.ghost-layer { pointer-events:none; opacity:0.9; }
</style>