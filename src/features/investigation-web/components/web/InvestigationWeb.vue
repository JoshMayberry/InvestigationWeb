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
      <defs>
        <marker id="iw-arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <!-- Use context-stroke so arrow color matches path/line stroke -->
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>

     <WebLinks />

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

     <NodeGhost />
     <LinkGhost />

      <template #overlay>
       <rect v-if="policy.canEditStructure && dragGhost?.mode === 'drag-node'" class="stash-zone" :x="overlayRect.x" :y="overlayRect.y" :width="overlayRect.w" :height="overlayRect.h" :fill="dragGhost?.mode === 'drag-node' ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.08)'" stroke="rgba(96,165,250,0.45)" stroke-dasharray="4 4" rx="3" />
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
import WebLinks from "./WebLinks.vue";
import LinkGhost from "./LinkGhost.vue";
import NodeGhost from "./NodeGhost.vue";
import type { NodeAny } from "../../types/node";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";
import { makeOverlapValidator } from "../../context/validators/overlap";

export default defineComponent({
  name: "InvestigationWeb",
  components: { ReactiveSvg, NodeDot, NodeTooltip, WebLinks, LinkGhost, NodeGhost },
  data(){
    const store = useInvestigationWebStore();
    return {
      store,
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null,
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

    // NEW: discovery sets and preview flag
    discoveryVisibleSet(): Set<string> { return this.store.visibleByDiscoveryIdSet; },
    discoveryPreviewActive(): boolean { return !!(this.runtime?.policy?.canDiscover); },

    settings(): any { return this.store.settings; },
    policy(): any { return this.runtime?.policy || this.store.policy; },
    dragGhost(): any { return this.runtime?.controllers.drag.ghost; },
    nodePlacement(): any { return this.runtime?.controllers.nodePlacement; },
    placingMode(): string { return this.nodePlacement?.activeMode() || "none"; },
    editState(): string { return this.store.currentEditState; },
    showTooltip(): boolean {
      // hide tooltip when link placement active & Shift
      const lp = this.runtime?.controllers.linkPlacement;
      if (lp?.isActive() && this.shiftDown) return false;
      return !this.policy.canEditStructure || this.shiftDown;
    },
    lpGhost(): any { return this.runtime?.controllers.linkPlacement.ghost; },
    sourceNodeForLink(): NodeAny | null {
      const id = this.lpGhost?.sourceId;
      return id ? this.nodes.find(n => n.id === id) || null : null;
    },
  },
  watch:{
    // Cancel link placement when tool toggled off
    "store.tools.addLink"(on:boolean){
      const lp = this.runtime?.controllers.linkPlacement;
      if (!on && lp?.isActive()) lp.cancel();
    },
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
    },
    hoveredId(id:string|null){
      const lp = this.runtime?.controllers.linkPlacement;
      if (this.store.tools.addLink && lp?.isActive()) {
        lp.hoverNode(id);
      }
    },
    "settings.enforceNoOverlap": { handler(){ this.installValidator(); } },
    "settings.nodePadding": { handler(){ this.installValidator(); } },
    nodes: { handler(){ this.installValidator(); }, deep:true },

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
    view(){ return this.runtime?.controllers.view; },
    drag(){ return this.runtime?.controllers.drag; },
    sel(){ return this.runtime?.controllers.selection; },
    hover(){ return this.runtime?.controllers.hover; },
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
        this.drag()?.setValidator(()=>({ valid:true }));
        return;
      }
      this.drag()?.setValidator(
        makeOverlapValidator(
          () => this.nodes.map(n => ({ id:n.id, x:n.x, y:n.y, r:n.r })),
          this.settings.nodePadding
        )
      );
    },
    worldFromClient(clientX:number, clientY:number){
      return this.view()?.worldFromClient(clientX, clientY);
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
      this.runtime?.controllers.stash.setRect(this.overlayRect);
    },
    onContextMenu(){
      if (this.store.tools.addFreeNode || this.store.tools.placeStagedId || this.store.tools.addLink || this.dragGhost?.active) {
        // Cancel link placement too
        if (this.store.tools.addLink) this.runtime?.controllers.linkPlacement.cancel();
        this.drag()?.cancel();
        this.store.resetTools();
      }
    },
    onSvgClick(e:MouseEvent){
      if (!this.policy.canEditStructure) return;
      const targetNodeEl = (e.target as Element).closest(".node") as SVGGElement | null;
      const lp = this.runtime?.controllers.linkPlacement;

      // Link tool active
      if (this.store.tools.addLink){
        if (lp && !lp.isActive()){
          const d = this.store.linkDraft;
          lp.start(d.type, d.color, d.stroke);
        }
        if (targetNodeEl && lp){
          const nodeId = targetNodeEl.getAttribute("data-id");
          if (nodeId){
            const committed = lp.tryCommit(nodeId, { shift: e.shiftKey });
            if (committed && !e.shiftKey){
              this.store.setAddLink(false);
            }
          }
        }
        return; // ignore empty-space clicks while adding links
      }

      // Node placement flow
      if (this.store.tools.addFreeNode){
        if (this.nodePlacement?.isActive()){
          if (this.dragGhost?.active && this.dragGhost.invalid) return;
          const ok = this.nodePlacement.commitAt(e.clientX, e.clientY);
          if (ok && !e.shiftKey) this.store.setAddFreeNode(false);
          return;
        } else {
          const d = this.store.settings.defaultNode;
          this.nodePlacement.startFree(
            { r:d.r, color:d.color, label:d.label },
            e.clientX, e.clientY
          );
          const ok = this.nodePlacement.commitAt(e.clientX, e.clientY);
          if (ok && !e.shiftKey) this.store.setAddFreeNode(false);
          return;
        }
      }

      // Background (no placement mode) clears selection
      this.sel()?.clear();
    },
    onSvgPointerMove(e:PointerEvent){
      if (!this.policy.canEditStructure) return;

      // Link placement pointer update (independent)
      const lp = this.runtime?.controllers.linkPlacement;
      if (this.store.tools.addLink && lp?.isActive()){
        lp.pointerMove(e.clientX, e.clientY);
      }

      const addFree = this.store.tools.addFreeNode;
      const placeId = this.store.tools.placeStagedId;

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
        if (this.store.tools.addLink) {
          this.runtime?.controllers.linkPlacement.cancel();
          this.store.setAddLink(false);
        }
        if (this.store.tools.addFreeNode) this.store.setAddFreeNode(false);
        if (this.store.tools.placeStagedId) this.store.setPlaceStaged(null);
      }
    },
    getNode(id:string){ return this.nodes.find(n => n.id === id); },
    onLinkPointerDown(id:string){
      // 4) Select link for editing
      if (this.store.tools.addLink) return; // ignore during add
      this.sel()?.set(id);
      // keep currentEditState as-is; PanelEdit detects selectedLink
    },
    // 6,7) compute padded endpoints between two nodes
    lineBind(fromId:string, toId:string, pad:number){
      const a = this.getNode(fromId); const b = this.getNode(toId);
      if (!a || !b) return {};
      const res = this._trimmedLine(a.x, a.y, a.r || 12, b.x, b.y, b.r || 12, pad || 0);
      return { x1: res.x1, y1: res.y1, x2: res.x2, y2: res.y2 };
    },
    ghostLineBind(){
      const src = this.sourceNodeForLink!;
      const tgtId = this.lpGhost.targetHoverId;
      if (tgtId){
        const b = this.getNode(tgtId);
        if (b){
          const res = this._trimmedLine(src.x, src.y, src.r || 12, b.x, b.y, b.r || 12, this.store.linkDraft.pad || 0);
          return { x1: res.x1, y1: res.y1, x2: res.x2, y2: res.y2 };
        }
      }
      // fallback to pointer (trim only source end)
      const pad = this.store.linkDraft.pad || 0;
      const tmp = this._trimOneEnd(src.x, src.y, src.r || 12, this.lpGhost.pointer.x, this.lpGhost.pointer.y, pad);
      return { x1: tmp.x1, y1: tmp.y1, x2: tmp.x2, y2: tmp.y2 };
    },
    _trimmedLine(ax:number, ay:number, ar:number, bx:number, by:number, br:number, pad:number){
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const aOff = ar + pad;
      const bOff = br + pad;
      return {
        x1: ax + ux * aOff,
        y1: ay + uy * aOff,
        x2: bx - ux * bOff,
        y2: by - uy * bOff,
      };
    },
    _trimOneEnd(ax:number, ay:number, ar:number, bx:number, by:number, pad:number){
      const dx = bx - ax, dy = by - ay;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const aOff = ar + pad;
      return {
        x1: ax + ux * aOff,
        y1: ay + uy * aOff,
        x2: bx,
        y2: by,
      };
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

/* 3) Minor Add panel button styles already in PanelAdd; ghost styles here */
.ghost-link { pointer-events:none; }
</style>