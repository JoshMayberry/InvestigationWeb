<template>
  <g v-if="ghost.active" class="calc-group-ghost" pointer-events="none">
    <g v-for="t in ghost.tracks" :key="t.id">
      <path
        v-if="t.type!=='straight'"
        :d="pathD(t)"
        fill="none"
        :stroke="trackStroke(t.id)"
        stroke-width="3"
        :stroke-dasharray="dash(t.id)"
        :stroke-opacity="opacity(t.id)"
        vector-effect="non-scaling-stroke"
      />
      <line
        v-else
        :x1="t.p1.x" :y1="t.p1.y" :x2="t.p2.x" :y2="t.p2.y"
        :stroke="trackStroke(t.id)"
        stroke-width="3"
        :stroke-dasharray="dash(t.id)"
        :stroke-opacity="opacity(t.id)"
        vector-effect="non-scaling-stroke"
      />
    </g>
    <rect
      v-if="ghost.bbox"
      :x="ghost.bbox.x" :y="ghost.bbox.y"
      :width="ghost.bbox.w" :height="ghost.bbox.h"
      fill="none"
      :stroke="strokeColor"
      stroke-width="2"
      :stroke-dasharray="ghost.valid ? '6 4':'4 3'"
      vector-effect="non-scaling-stroke"
    />
  </g>
</template>
<script lang="ts">
import { defineComponent, watch } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { trackPathD } from "../../stores/util/trackGeometry";
export default defineComponent({
  name:"WebCalcGroupGhost",
  setup(){
    const store = useInvestigationWebStore();
    watch(()=>store.groupDraft, ()=>{
      const g = store.calcGroupPlacementGhost;
      if (g.active){
        const cx = g.centerX;
        const cy = g.centerY;
        store.updateCalcGroupPlacement(cx, cy);
      }
    }, { deep:true });
    return { store };
  },
  computed:{
    ghost():any { return this.store.calcGroupPlacementGhost; },
    strokeColor():string { return this.ghost.valid ? "#38bdf8" : "#ef4444"; }
  },
  methods:{
    pathD(t:any){ return trackPathD(t); },
    trackStroke(id:string){ return this.ghost.invalidIds.includes(id) ? "#ef4444" : (this.ghost.valid ? "#38bdf8" : "#38bdf8"); },
    dash(id:string){ return this.ghost.invalidIds.includes(id) ? "4 3" : "6 6"; },
    opacity(id:string){ return this.ghost.invalidIds.includes(id) ? 0.95 : 0.6; }
  }
});
</script>
<style scoped>
.calc-group-ghost { pointer-events:none; }
.calc-group-ghost path, .calc-group-ghost line { transition: stroke .1s, stroke-opacity .1s; }
</style>