<template>
  <g class="nodes">
    <NodeDot
      v-for="n in nodes"
      :key="n.id"
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
import { defineComponent } from "vue";
import NodeDot from "./NodeDot.vue";

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
  methods: {
    paddingRadius(n: any) {
      return (n.r || 14) + (this.settings.nodePadding || 0);
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