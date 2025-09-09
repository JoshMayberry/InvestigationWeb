<template>
  <g v-if="active" class="ghost-link-layer">
    <line
      v-bind="bind"
      class="ghost-link"
      :style="{ color: color }"
      stroke="currentColor"
      :stroke-dasharray="dash"
      stroke-width="2"
      :stroke-opacity="opacity"
      :marker-end="markerEnd"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "LinkGhost",
  data(){
    return {
      runtime: inject(RUNTIME_KEY, null) as any,
      store: useInvestigationWebStore()
    };
  },
  computed:{
    nodes(): any[] { return this.store?.nodes || []; },
    lpGhost(): any { return this.runtime?.controllers?.linkPlacement?.ghost; },
    source(): any | null {
      const id = this.lpGhost?.sourceId;
      return id ? this.nodes.find((n:any)=>n.id===id) || null : null;
    },
    target(): any | null {
      const id = this.lpGhost?.targetHoverId;
      return id ? this.nodes.find((n:any)=>n.id===id) || null : null;
    },
    active(): boolean { return !!(this.lpGhost?.active && this.source); }, // allow live pointer after source
    color(): string { return this.lpGhost?.valid ? this.lpGhost?.color : "#ef4444"; },
    opacity(): number { return this.lpGhost?.valid ? 0.65 : 0.9; },
    dash(): string | undefined {
      if (!this.lpGhost?.valid) return "4 3";
      return this.lpGhost?.stroke === "dashed" ? "6 4" : (this.lpGhost?.stroke === "dotted" ? "2 4" : undefined);
    },
    markerEnd(): string | undefined {
      const arrow = this.store?.linkDraft?.arrowHead;
      return this.lpGhost?.valid && arrow ? "url(#iw-arrow-head)" : undefined;
    },
    bind(): any {
      if (!this.active || !this.source) return {};
      const pad = this.store?.linkDraft?.pad || 0;
      const a = this.source;
      if (this.target) {
        const b = this.target;
        return this.trimmed(a.x, a.y, a.r || 12, b.x, b.y, b.r || 12, pad);
      }
      return this.trimOne(a.x, a.y, a.r || 12, this.lpGhost.pointer.x, this.lpGhost.pointer.y, pad);
    }
  },
  methods:{
    trimmed(ax:number, ay:number, ar:number, bx:number, by:number, br:number, pad:number){
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const aOff = ar + pad, bOff = br + pad;
      return { x1: ax + ux * aOff, y1: ay + uy * aOff, x2: bx - ux * bOff, y2: by - uy * bOff };
    },
    trimOne(ax:number, ay:number, ar:number, bx:number, by:number, pad:number){
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const aOff = ar + pad;
      return { x1: ax + ux * aOff, y1: ay + uy * aOff, x2: bx, y2: by };
    }
  }
});
</script>

<style scoped>
.ghost-link-layer { pointer-events:none; }
.ghost-link { pointer-events:none; }
</style>