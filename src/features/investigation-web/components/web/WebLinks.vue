<template>
  <g class="links">
    <component
      v-for="l in store.links"
      :key="l.id"
      :is="getType(l.type).linkCanvas"
      :l="l"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { getPathType } from "../paths/registry";

export default defineComponent({
  name: "WebLinks",
  data(){ return { store: useInvestigationWebStore() }; },
  methods:{ getType(t:string){ return getPathType(t); } }
});
</script>

<style scoped>
.links path.hovered:not(.sel),
.links line.hovered:not(.sel) { filter: drop-shadow(0 0 4px rgba(96,165,250,0.65)); }
.links path.sel,
.links line.sel { stroke: var(--accent); stroke-width: 3; stroke-opacity: 1; filter: drop-shadow(0 0 6px rgba(96,165,250,0.9)); }
</style>