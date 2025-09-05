<template>
  <g
    class="node"
    :class="{ dim, sel: selected }"
    :transform="`translate(${node.x},${node.y})`"
    ref="el"
    tabindex="0"
    @pointerdown="onPointerDown"
    @mouseenter="$emit('hover', node)"
    @mouseleave="$emit('leave', node)"
  >
    <circle
      v-if="selected"
      class="halo"
      :r="(node.r||12)+8"
      fill="rgba(96,165,250,0.18)"
      stroke="rgba(96,165,250,0.5)"
      stroke-width="1.5"
      pointer-events="none"
    />
    <circle
      class="core"
      :r="node.r || 12"
      :fill="node.color || '#10b981'"
      stroke="#15204e"
      stroke-width="2"
    />
    <text
      v-if="node.label"
      class="label"
      y="-16"
      text-anchor="middle"
      fill="#c8d3ff"
      font-size="11"
      pointer-events="none"
    >{{ node.label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { NodeAny } from "../../types/node";

type SvgCtx = {
  getSvg: () => SVGSVGElement | null;
  getTransform: () => { k:number; x:number; y:number };
  getSize: () => { w:number; h:number };
};

export default defineComponent({
  name: "NodeDot",
  inject: { reactiveSvgCtx: { default: null } },
  props: {
    node: { type: Object as () => NodeAny, required: true },
    selected: { type: Boolean, default: false },
    draggable: { type: Boolean, default: true },
    clampToViewport: { type: Boolean, default: false }, // ghost drag, do not clamp live
    clampPadding: { type: Number, default: 8 },
    dim: { type: Boolean, default: false },
  },
  emits: ["move","moveEnd","select","hover","leave","drag:start","drag:end"],
  data(){
    return {
      dragging:false,
      startWorld: { x:0, y:0 },
      startNode: { x:0, y:0 },
      moved:false,
      canceled:false,
    };
  },
  methods: {
    worldFromEvent(e:PointerEvent){
      const ctx = (this as any).reactiveSvgCtx as SvgCtx | null;
      const t = ctx?.getTransform();
      const svg = ctx?.getSvg();
      if (!t || !svg) return { x:0, y:0 };
      const rect = svg.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      return {
        x: (sx - t.x) / t.k,
        y: (sy - t.y) / t.k
      };
    },
    onPointerDown(e:PointerEvent){
      if (!this.draggable) {
        this.$emit("select", this.node);
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      this.dragging = true;
      this.moved = false;
      this.canceled = false;
      const w = this.worldFromEvent(e);
      this.startWorld = { ...w };
      this.startNode = { x:this.node.x, y:this.node.y };
      this.$emit("drag:start", { id: this.node.id, origin: { ...this.startNode } });
      window.addEventListener("pointermove", this.onPointerMove);
      window.addEventListener("pointerup", this.onPointerUp, { once:true });
      window.addEventListener("keydown", this.onKeyEsc, { once:false });
    },
    onPointerMove(e:PointerEvent){
      if (!this.dragging) return;
      const ctx = (this as any).reactiveSvgCtx as SvgCtx | null;
      const svg = ctx?.getSvg?.();
      if (svg){
        const r = svg.getBoundingClientRect();
        // Cancel if pointer leaves svg bounds
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
          this.cancelDrag(e);
          return;
        }
      }
      const w = this.worldFromEvent(e);
      const gx = this.startNode.x + (w.x - this.startWorld.x);
      const gy = this.startNode.y + (w.y - this.startWorld.y);

      if (!this.moved && (Math.abs(w.x - this.startWorld.x) > 1 || Math.abs(w.y - this.startWorld.y) > 1)) {
        this.moved = true;
      }

      // Emit prospective (ghost) position – DO NOT mutate node here
      this.$emit("move", { id:this.node.id, x: gx, y: gy, ghost:true });
    },
    onPointerUp(e:PointerEvent){
      if (!this.dragging) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      const wasMoved = this.moved;
      const canceled = this.canceled;
      this.cleanupDrag();
      if (!wasMoved && !canceled) this.$emit("select", this.node);
      this.$emit("moveEnd", { id:this.node.id, clientX, clientY, canceled });
      this.$emit("drag:end", { id:this.node.id, clientX, clientY, canceled, moved:wasMoved });
    },
    onKeyEsc(e:KeyboardEvent){
      if (e.key === "Escape") {
        this.cancelDrag();
      }
    },
    cancelDrag(e?:PointerEvent){
      if (!this.dragging) return;
      this.canceled = true;
      const clientX = e?.clientX ?? 0;
      const clientY = e?.clientY ?? 0;
      this.cleanupDrag();
      this.$emit("drag:end", { id:this.node.id, clientX, clientY, canceled:true, moved:this.moved });
    },
    cleanupDrag(){
      this.dragging = false;
      window.removeEventListener("pointermove", this.onPointerMove);
      window.removeEventListener("keydown", this.onKeyEsc);
    },
  },
});
</script>

<style scoped>
.node { cursor: pointer; user-select: none; }
.mode-dragging .node { cursor: grabbing; }
.node .core, .node .label { transition: opacity .25s; }
.node.dim .core, .node.dim .label { opacity:.25; }
.halo { pointer-events:none; }
</style>