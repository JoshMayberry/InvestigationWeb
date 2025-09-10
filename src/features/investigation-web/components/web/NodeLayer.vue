<template>
  <g class="nodes">
    <NodeDot
      v-for="n in nodes"
      :key="n.id"
      v-show="!hideWhileDrag(n)"
      :node="n"
      :dim="(filtersActive && !filteredIdsSet.has(n.id)) || (discoveryPreviewActive && !discoveryVisibleSet.has(n.id))"
    />
  </g>

  <g v-if="settings.enforceNoOverlap && settings.showPadPreview" class="pad-preview">
    <circle
      v-for="n in nodes"
      :key="`pad-${n.id}`"
      :cx="n.x"
      :cy="n.y"
      :r="paddingRadius(n)"
      class="pad-circle"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import NodeDot from "./NodeDot.vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "NodeLayer",
  components: { NodeDot },
  props: {
    nodes: { type: Array, required: true },
    settings: { type: Object, required: true },
    filtersActive: { type: Boolean, required: true },
    filteredIdsSet: { type: Object, required: true },
    discoveryPreviewActive: { type: Boolean, required: true },
    discoveryVisibleSet: { type: Object, required: true },
  },
  data(){
    return {
      runtime: inject(RUNTIME_KEY, null) as any
    };
  },
  computed:{
    dragGhost(): any { return this.runtime?.controllers?.drag?.ghost || null; }
  },
  methods: {
    paddingRadius(n: any) {
      return (n.r || 14) + (this.settings.nodePadding || 0);
    },
    hideWhileDrag(n:any){
      const g = this.dragGhost;
      if (!g || !g.active) return false;
      return g.mode === "drag-node" && g.sourceId === n.id;
    }
  }
});
</script>

<style scoped>
.pad-preview { pointer-events:none; }
.pad-circle {
  fill: rgba(96,165,250,0.05);
  stroke: rgba(96,165,250,0.35);
  stroke-width:1;
  stroke-dasharray:4 4;
}
</style>