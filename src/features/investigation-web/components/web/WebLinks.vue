<template>
  <g class="links">
    <template v-for="l in linksToShow" :key="l.id">
      <component
        :is="getType(l.type).linkCanvas"
        :l="l"
      />
      <path
        v-if="l.sim?.enabled"
        :d="straightOverlay(l)"
        class="sim-outline"
        vector-effect="non-scaling-stroke"
        fill="none"
      />
    </template>
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { getPathType } from "../paths/registry";

export default defineComponent({
  name: "WebLinks",
  props: {
    // Optional set of visible node ids (Player view)
    visibleIdSet: { type: Object as () => Set<string> | null, default: null },
  },
  data(){ return { store: useInvestigationWebStore() }; },
  computed:{
    linksToShow(): any[] {
      const all = this.store.links || [];
      const vis = this.visibleIdSet as Set<string> | null;
      if (!vis) return all;
      return all.filter((l:any)=> vis.has(l.from) && vis.has(l.to));
    }
  },
  methods:{
    getType(t:string){ return getPathType(t); },
    straightOverlay(l:any){
      const a = this.store.nodes.find((n:any)=> n.id===l.from);
      const b = this.store.nodes.find((n:any)=> n.id===l.to);
      if (!a || !b) return "";
      return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    }
  }
});
</script>

<style scoped>
.link-wrap.sim-active > :deep(path),
.link-wrap.sim-active > :deep(line) {
  filter: drop-shadow(0 0 4px rgba(245,158,11,0.8));
}
.sim-outline {
  stroke: #f59e0b;
  stroke-width: 1.5;
  stroke-dasharray: 6 4;
  pointer-events: none;
  opacity: 0.85;
}
.links path.hovered:not(.sel),
.links line.hovered:not(.sel) { filter: drop-shadow(0 0 4px rgba(96,165,250,0.65)); }
.links path.sel,
.links line.sel { stroke: var(--accent); stroke-width: 3; stroke-opacity: 1; filter: drop-shadow(0 0 6px rgba(96,165,250,0.9)); }
</style>