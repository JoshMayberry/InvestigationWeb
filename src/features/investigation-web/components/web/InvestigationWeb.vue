<template>
  <div
    class="iw-wrap"
    :class="{
      'mode-add': placingMode === 'add-free',
      'mode-place-staged': placingMode === 'place-staged',
      'mode-dragging': dragGhost?.mode === 'drag-node'
    }"
    tabindex="-1"
    @contextmenu.prevent="onContextMenu"
  >
    <ReactiveSvg
      ref="rs"
      class="iw-canvas"
      @resized="onResize"
    >
      <g class="nodes">
        <NodeDot
          v-for="n in nodes"
          :key="n.id"
          :node="n"
          :dim="filtersActive && !filteredIdsSet.has(n.id)"
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

      <g v-if="dragGhost?.active" class="ghost-layer">
        <g class="ghost-node" :transform="`translate(${dragGhost.x},${dragGhost.y})`" pointer-events="none">
          <circle
            :r="dragGhost.r"
            :fill="dragGhost.invalid ? 'rgba(239,68,68,0.30)' : dragGhost.color"
            :stroke="dragGhost.invalid ? '#ef4444' : dragGhost.color"
            stroke-width="2"
            :stroke-dasharray="dragGhost.invalid ? '4 4' : null"
          />
          <text
            v-if="dragGhost.label"
            class="ghost-label"
            y="-18"
            text-anchor="middle"
            font-size="11"
            :fill="dragGhost.invalid ? '#ffc9c9' : '#c8d3ff'"
            fill-opacity="0.75"
          >{{ dragGhost.label }}</text>
        </g>
      </g>

      <template #overlay>
        <rect
          v-if="policy.canEditStructure && dragGhost?.mode === 'drag-node'"
          class="stash-zone"
          :x="overlayRect.x"
          :y="overlayRect.y"
          :width="overlayRect.w"
          :height="overlayRect.h"
          :fill="dragGhost?.mode === 'drag-node' ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.08)'"
          stroke="rgba(96,165,250,0.45)"
          stroke-dasharray="4 4"
          rx="3"
        />
      </template>
    </ReactiveSvg>

    <!-- Tooltip (kept mounted to prevent flicker) -->
    <NodeTooltip
      ref="nodeTip"
      :node="hoveredNode"
      :active="!!hoveredNode && showTooltip"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import ReactiveSvg from "../ReactiveSvg.vue";
import NodeDot from "./NodeDot.vue";
import NodeTooltip from "./NodeTooltip.vue";
import type { NodeAny } from "../../types/node";
import { RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";
import { makeOverlapValidator } from "../../context/validators/overlap";

export default defineComponent({
  name: "InvestigationWeb",
  components: { ReactiveSvg, NodeDot, NodeTooltip },
  data(){
    const store = useInvestigationWebStore();
    return {
      store,
      runtime: inject(RUNTIME_KEY, null),
      overlayRect: { x:0, y:0, w:120, h:0 },
      canvasSize: { w:0, h:0 },
      shiftDown:false,
    };
  },
  computed:{
    nodes(): NodeAny[] { return this.store.nodes; },
    hoveredId(): string | null { return this.runtime?.controllers.hover.id || null; },
    hoveredNode(): NodeAny | null {
      const id = this.hoveredId;
      return id ? this.nodes.find(n => n.id === id) || null : null;
    },
    filteredIdsSet(): Set<string> { return this.store.filteredIdSet; },
    filtersActive(): boolean { return this.store.filtersActive; },
    settings(): any { return this.store.settings; },
    policy(): any { return this.runtime?.policy || this.store.policy; },
    dragGhost(): any { return this.runtime?.controllers.drag.ghost; },
    nodePlacement(): any { return this.runtime?.controllers.nodePlacement; },
    placingMode(): string { return this.nodePlacement?.activeMode() || "none"; },
    showTooltip(): boolean {
      return !this.policy.canEditStructure || this.shiftDown;
    }
  },
  watch:{
    "settings.enforceNoOverlap": { handler(){ this.installValidator(); } },
    "settings.nodePadding": { handler(){ this.installValidator(); } },
    nodes: { handler(){ this.installValidator(); }, deep:true },

    // NEW: react to tool toggles to start/cancel placement session
    "store.tools.addFreeNode"(on:boolean){
      if (!this.policy.canEditStructure) return;
      if (!on) {
        if (this.placingMode === "add-free") this.nodePlacement.cancel();
        return;
      }
      // Will lazily start on next pointer move (no coords here).
    },
    "store.tools.placeStagedId"(id:string|null){
      if (!this.policy.canEditStructure) return;
      if (!id && this.placingMode === "place-staged") this.nodePlacement.cancel();
      // Start lazily on pointer move when we have pointer coords.
    }
  },
  mounted(){
    window.addEventListener("keydown", this._onKey);
    window.addEventListener("keyup", this._onKey);
    this.onResize({ w:(this.$el as HTMLElement).clientWidth, h:(this.$el as HTMLElement).clientHeight });
    this.attachSvgListeners();
    this.installValidator();
  },
  beforeUnmount(){
    window.removeEventListener("keydown", this._onKey);
    window.removeEventListener("keyup", this._onKey);
    this.detachSvgListeners();
  },
  methods:{
    view(){ return this.runtime.controllers.view; },
    drag(){ return this.runtime.controllers.drag; },
    sel(){ return this.runtime.controllers.selection; },
    hover(){ return this.runtime.controllers.hover; },
    attachSvgListeners(){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      if (svg) {
        svg.addEventListener("click", this.onSvgClick);
        svg.addEventListener("pointermove", this.onSvgPointerMove);
        svg.addEventListener("pointerleave", this.onSvgPointerLeave);
      }
    },
    detachSvgListeners(){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      if (svg) {
        svg.removeEventListener("click", this.onSvgClick);
        svg.removeEventListener("pointermove", this.onSvgPointerMove);
        svg.removeEventListener("pointerleave", this.onSvgPointerLeave);
      }
    },
    installValidator(){
      if (!this.runtime) return;
      if (!this.settings.enforceNoOverlap){
        this.drag().setValidator(()=>({ valid:true }));
        return;
      }
      this.drag().setValidator(
        makeOverlapValidator(
          () => this.nodes.map(n => ({ id:n.id, x:n.x, y:n.y, r:n.r })),
          this.settings.nodePadding
        )
      );
    },
    worldFromClient(clientX:number, clientY:number){
      return this.view().worldFromClient(clientX, clientY);
    },
    paddingRadius(n:NodeAny){ return (n.r || 14) + this.settings.nodePadding; },
    onResize(sz:{w:number;h:number}) {
      this.canvasSize = sz;
      this.updateOverlay();
    },
    updateOverlay(){
      this.overlayRect = {
        x: Math.max(0, this.canvasSize.w - this.overlayRect.w),
        y: 0,
        w: this.overlayRect.w,
        h: this.canvasSize.h
      };
      this.runtime.controllers.stash.setRect(this.overlayRect);
    },
    onContextMenu(){
      if (this.store.tools.addFreeNode || this.store.tools.placeStagedId || this.dragGhost?.active) {
        this.drag().cancel();
        this.store.resetTools();
      }
    },
    onSvgClick(e:MouseEvent){
      if (!this.policy.canEditStructure) return;
      if ((e.target as Element).closest(".node")) return;

      // If tool active but placement not started yet (no pointer move), start now.
      if (!this.nodePlacement.isActive()) {
        if (this.store.tools.placeStagedId) {
          const staged = this.store.staging.find(n => n.id === this.store.tools.placeStagedId);
          if (staged){
            this.nodePlacement.startStaged(
              this.store.tools.placeStagedId,
              { r:staged.r, color:staged.color, label:staged.label },
              e.clientX, e.clientY
            );
          }
        } else if (this.store.tools.addFreeNode) {
          const d = this.store.settings.defaultNode;
          this.nodePlacement.startFree(
            { r:d.r, color:d.color, label:d.label },
            e.clientX, e.clientY
          );
        }
      }

      // Commit if active
      if (this.nodePlacement.isActive()) {
        if (this.dragGhost?.active && this.dragGhost.invalid) return;
        const committed = this.nodePlacement.commitAt(e.clientX, e.clientY);
        if (committed) {
          if (this.placingMode === "add-free") this.store.setAddFreeNode(false);
          if (this.placingMode === "place-staged") this.store.setPlaceStaged(null);
        }
        return;
      }

      // Background (no placement mode) clears selection
      this.sel().clear();
    },
    onSvgPointerMove(e:PointerEvent){
      if (!this.policy.canEditStructure) return;

      const addFree = this.store.tools.addFreeNode;
      const placeId = this.store.tools.placeStagedId;

      // If neither tool is on, ensure placement canceled
      if (!addFree && !placeId){
        if (this.nodePlacement.isActive()) this.nodePlacement.cancel();
        return;
      }

      // Start / update staged placement
      if (placeId){
        const staged = this.store.staging.find(n => n.id === placeId);
        if (!staged) {
          if (this.placingMode === "place-staged") this.nodePlacement.cancel();
          return;
        }
        if (this.placingMode !== "place-staged"){
          this.nodePlacement.startStaged(
            placeId,
            { r:staged.r, color:staged.color, label:staged.label },
            e.clientX, e.clientY
          );
        } else {
          this.nodePlacement.updatePointer(e.clientX, e.clientY);
        }
        return;
      }

      // Start / update free placement
      if (addFree){
        const d = this.store.settings.defaultNode;
        if (this.placingMode !== "add-free"){
          this.nodePlacement.startFree(
            { r:d.r, color:d.color, label:d.label },
            e.clientX, e.clientY
          );
        } else {
          this.nodePlacement.updatePointer(e.clientX, e.clientY);
        }
      }
    },
    onSvgPointerLeave(e:PointerEvent){
      if (!this.policy.canEditStructure) return;
      if (this.nodePlacement.isActive()){
        const svg = (this.$refs.rs as any)?.getSvg?.();
        if (svg && e.relatedTarget && svg.contains(e.relatedTarget as Node)) return;
        this.nodePlacement.cancel();
      }
    },
    _onKey(e:KeyboardEvent){
      if (e.key === "Shift") this.shiftDown = e.type === "keydown";
      if (e.key === "Escape") {
        if (this.dragGhost?.mode === "drag-node") return;
        if (this.nodePlacement.isActive()){
          this.nodePlacement.cancel();
        }
        if (this.store.tools.addFreeNode) this.store.setAddFreeNode(false);
        if (this.store.tools.placeStagedId) this.store.setPlaceStaged(null);
      }
    },
  }
});
</script>

<style scoped>
.iw-wrap { position:relative; width:100%; height:100%; }
.iw-canvas { width:100%; height:100%; }
.nodes .node { cursor: pointer; }
.mode-dragging .nodes .node { cursor: grabbing; }
.stash-zone { pointer-events:none; transition: background .18s; }
.mode-dragging .stash-zone { background: rgba(96,165,250,0.22); }
.ghost-layer { pointer-events:none; }
.ghost-node { opacity:0.9; }
.pad-preview { pointer-events:none; }
.pad-circle {
  fill: rgba(96,165,250,0.05);
  stroke: rgba(96,165,250,0.35);
  stroke-width:1;
  stroke-dasharray:4 4;
}
</style>