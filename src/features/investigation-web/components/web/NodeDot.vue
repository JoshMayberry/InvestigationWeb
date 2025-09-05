<template>
  <g
    class="node"
    :class="{ dim, sel: isSelected, hovered: isHovered }"
    :transform="`translate(${node.x},${node.y})`"
    ref="el"
    @pointerdown="onPointerDown"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @click.stop
  >
    <circle
      v-if="isSelected"
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
import { defineComponent, inject } from "vue";
import type { NodeAny } from "../../types/node";
import { RUNTIME_KEY } from "../../context/runtime";

const MOVE_THRESHOLD = 3;

export default defineComponent({
  name: "NodeDot",
  props: {
    node: { type: Object as () => NodeAny, required: true },
    dim: { type: Boolean, default: false },
  },
  data(){
    return {
      runtime: null as any,
      pointerDown:false,
      moved:false,
      startClient:{ x:0, y:0 },
    };
  },
  computed:{
    selCtrl(): any { return this.runtime?.controllers?.selection; },
    hoverCtrl(): any { return this.runtime?.controllers?.hover; },
    dragCtrl(): any { return this.runtime?.controllers?.drag; },
    stashCtrl(): any { return this.runtime?.controllers?.stash; },
    viewCtrl(): any { return this.runtime?.controllers?.view; },
    isSelected(): boolean { return !!this.selCtrl?.is(this.node.id); },
    canEdit(): boolean { return !!this.runtime?.policy?.canEditStructure; },
    isHovered(): boolean { return !!this.hoverCtrl?.is(this.node.id); },
    placingActive(): boolean {
      const ghost = this.dragCtrl?.ghost;
      if (!ghost) return false;
      return ghost.mode === "add-free" || ghost.mode === "place-staged";
    }
  },
  created(){
    this.runtime = inject(RUNTIME_KEY, null);
  },
  methods:{
    onEnter(){ this.hoverCtrl?.set(this.node.id); },
    onLeave(){ this.hoverCtrl?.clear(); },
    onPointerDown(e:PointerEvent){
      if (!this.canEdit) return;
      if (this.placingActive) return; // disable interaction while placing
      e.stopPropagation();
      e.preventDefault();
      this.pointerDown = true;
      this.moved = false;
      this.startClient = { x:e.clientX, y:e.clientY };
      window.addEventListener("pointermove", this.onMove);
      window.addEventListener("pointerup", this.onUp, { once:true });
      window.addEventListener("keydown", this.onEsc);
    },
    onMove(e:PointerEvent){
      if (!this.pointerDown) return;
      const dx = e.clientX - this.startClient.x;
      const dy = e.clientY - this.startClient.y;
      if (!this.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        this.moved = true;
        if (!this.isSelected) this.selCtrl?.set(this.node.id);
        this.dragCtrl?.startNode(this.node.id, {
          x:this.node.x, y:this.node.y, r:this.node.r,
          color:this.node.color, label:this.node.label
        });
      }
      if (this.moved){
        this.dragCtrl?.updatePointer(e.clientX, e.clientY);
      }
    },
    onUp(e:PointerEvent){
      const wasMoved = this.moved;
      const ghost = this.dragCtrl?.ghost;
      const wasSelectedBefore = this.isSelected;
      this.cleanup();
      if (!wasMoved){
        // toggle selection
        if (wasSelectedBefore) this.selCtrl?.clear();
        else this.selCtrl?.set(this.node.id);
        if (ghost?.active && ghost.mode === "drag-node") this.dragCtrl?.cancel();
        return;
      }
      if (!ghost?.active || ghost.mode !== "drag-node"){
        this.dragCtrl?.cancel(); return;
      }
      // Outside SVG?
      const svg = this.viewCtrl?.getSvgEl();
      if (svg){
        const r = svg.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
          this.dragCtrl?.cancel(); return;
        }
      }
      // Into stash?
      if (this.stashCtrl?.isClientPointIn(e.clientX, e.clientY)){
        this.runtime?.store?.moveNodeToStaging?.(ghost.sourceId);
        if (this.selCtrl?.get() === ghost.sourceId) this.selCtrl?.clear();
        this.dragCtrl?.cancel(); return;
      }
      if (ghost.invalid){
        this.dragCtrl?.cancel(); return;
      }
      const id = this.node.id;
      const before = { x: this.node.x, y: this.node.y };
      const after = { x: ghost.x, y: ghost.y };
      this.runtime.controllers.undo.push({
        label: "move-node",
        _coalesceKey: `move-node:${id}`,
        before,
        after,
        do: () => this.runtime.store?.patchNode?.(id, after),
        undo: () => this.runtime.store?.patchNode?.(id, before)
      });
      this.dragCtrl?.cancel();
    },
    onEsc(e:KeyboardEvent){
      if (e.key === "Escape"){
        this.dragCtrl?.cancel();
        this.cleanup();
      }
    },
    cleanup(){
      this.pointerDown = false;
      window.removeEventListener("pointermove", this.onMove);
      window.removeEventListener("keydown", this.onEsc);
    }
  }
});
</script>

<style scoped>
.node { cursor: pointer; user-select: none; transition: filter .15s, opacity .15s; }
.mode-dragging .node { cursor: grabbing; }
.node.dim .core, .node.dim .label { opacity:.25; }
.node.hovered:not(.sel) .core { filter: drop-shadow(0 0 4px rgba(96,165,250,0.6)); }
.halo { pointer-events:none; }
.node.sel .core { filter: drop-shadow(0 0 6px rgba(96,165,250,0.9)); }
</style>