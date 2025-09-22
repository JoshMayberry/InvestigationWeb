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

    // Relink mode: currently relinking link id (store.tools.relinkTarget)
    relinkActive(): boolean {
      return this.store?.currentEditState === "relink" && !!this.store?.tools?.relinkTarget;
    },
    relinkLink(): any | null {
      const id = this.store?.tools?.relinkTarget;
      if (!id) return null;
      return (this.store?.links || []).find((l:any)=> l.id === id) || null;
    },
    relinkSource(): any | null {
      const id = this.relinkLink?.from;
      return id ? this.nodes.find((n:any)=> n.id === id) || null : null;
    },
    relinkTargetNode(): any | null {
      // Use hover controller to determine the node under the cursor in panels/canvas
      const hoverId = this.runtime?.controllers?.hover?.id || null;
      return hoverId ? this.nodes.find((n:any)=> n.id === hoverId) || null : null;
    },

    source(): any | null {
      // normal linkPlacement source or relink source
      if (this.relinkActive) return this.relinkSource;
      const id = this.lpGhost?.sourceId;
      return id ? this.nodes.find((n:any)=>n.id===id) || null : null;
    },
    target(): any | null {
      if (this.relinkActive) return this.relinkTargetNode;
      const id = this.lpGhost?.targetHoverId;
      return id ? this.nodes.find((n:any)=>n.id===id) || null : null;
    },

    active(): boolean {
      // active if normal link placement ghost active OR relink ghost active with both endpoints present
      if (this.lpGhost?.active && this.source) return true;
      if (this.relinkActive && this.relinkSource && this.relinkTargetNode) return true;
      return false;
    },

    // color: prefer relink link color if present
    color(): string {
      if (this.relinkActive && this.relinkLink?.color) return this.relinkLink.color;
      return this.lpGhost?.valid ? this.lpGhost?.color : "#ef4444";
    },

    opacity(): number {
      if (this.relinkActive) {
        // slightly translucent for relink preview
        return this.relinkSource && this.relinkTargetNode ? 0.9 : 0.6;
      }
      return this.lpGhost?.valid ? 0.65 : 0.9;
    },

    dash(): string | undefined {
      if (this.relinkActive) {
        // solid when valid (different endpoints), dashed when invalid
        const link = this.relinkLink;
        if (!link) return "4 3";
        const a = link.from, b = this.relinkTargetNode?.id;
        if (!b || a === b) return "4 3";
        const dup = (this.store.links || []).some((l:any)=> (l.from === a && l.to === b) || (l.from === b && l.to === a));
        return dup ? "4 3" : (link.stroke === "dashed" ? "6 4" : (link.stroke === "dotted" ? "2 4" : undefined));
      }
      if (!this.lpGhost?.valid) return "4 3";
      return this.lpGhost?.stroke === "dashed" ? "6 4" : (this.lpGhost?.stroke === "dotted" ? "2 4" : undefined);
    },

    markerEnd(): string | undefined {
      // prefer relink link arrowHead if present
      const arrow = this.relinkLink?.arrowHead ?? this.store?.linkDraft?.arrowHead;
      return (this.relinkActive && this.relinkSource && this.relinkTargetNode && arrow) ? "url(#iw-arrow-head)" : (this.lpGhost?.valid && this.store?.linkDraft?.arrowHead ? "url(#iw-arrow-head)" : undefined);
    },

    bind(): any {
      // Compute coords from source->target (either linkPlacement or relink)
      const pad = this.store?.linkDraft?.pad || 0;
      const a = this.source;
      if (!a) return {};
      if (this.target) {
        const b = this.target;
        return this.trimmed(a.x, a.y, a.r || 12, b.x, b.y, b.r || 12, pad);
      }
      // fallback: if relinking and no hover target, do not draw
      if (this.relinkActive) return {};
      // fallback for live pointer during normal linkPlacement
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