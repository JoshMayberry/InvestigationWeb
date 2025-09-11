<template>
  <g class="calc-groups">
    <g v-for="g in groups" :key="g.id" class="calc-group"
       @click.stop
       :class="{ sel: isSel(g.id) }"
       @pointerdown.stop="onGroupPointerDown(g, $event)">
      <rect
        v-if="g.bbox"
        @click.stop
        :x="g.bbox.x" :y="g.bbox.y"
        :width="g.bbox.w" :height="g.bbox.h"
        fill="none"
        pointer-events="stroke"
        :stroke="isSel(g.id)?'#fbbf24':'#64748b'"
        stroke-width="2"
        stroke-dasharray="6 4"
        vector-effect="non-scaling-stroke"
      />
      <!-- future: rotation handle -->
    </g>
  </g>
</template>
<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY } from "../../context/runtime";
export default defineComponent({
  name:'WebCalculatedGroups',
  setup(){
    const runtime:any = inject(RUNTIME_KEY, null);
    const store = useInvestigationWebStore();
    return { runtime, store };
  },
  computed:{
    groups():any[]{ return this.store.calcGroups || []; },
    selection(){ return this.runtime?.controllers?.selection; }
  },
  methods:{
    isSel(id:string){ return this.selection?.get?.() === id; },
    onGroupPointerDown(g:any, e:PointerEvent){
      this.selection?.set?.(g.id);
      // TODO: enable drag / resize controller
    }
  }
});
</script>
<style scoped>
.calc-group.sel rect { stroke-width:3; }
.calc-group rect { cursor:pointer; transition: stroke .15s, stroke-opacity .15s; }
.calc-group:hover rect:not(.sel) { stroke:#94a3b8; stroke-opacity:0.85; }
</style>