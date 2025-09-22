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
    <ReactiveSvg ref="rs" class="iw-canvas" @resized="onResize">
      <defs>
        <marker id="iw-arrow-head" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke" />
        </marker>
      </defs>

      <GridOverlay
        :show="showGrid"
        :gridSize="settings.gridSize || 16"
      />

      <!-- CHANGE: use local computed visible set (no store getter dependency) -->
      <WebLinks :visibleIdSet="playerView ? playerVisibleIdSet : null" />
      <WebTracks />
      <WebCalculatedGroups />

      <NodeLayer
        :nodes="nodes"
        :settings="settings"
        :filtersActive="filtersActive"
        :filteredIdsSet="filteredIdsSet"
        :playerView="playerView"
        :discoveryPreviewActive="discoveryPreviewActive"
        :discoveryVisibleSet="discoveryVisibleSet"
      />

      <NodeGhost />
      <LinkGhost />
      <TrackGhost />
      <WebCalcGroupGhost />

      <template #overlay>
        <rect
          v-if="policy.canEditStructure && (dragGhost?.mode === 'drag-node' || placingMode === 'place-staged' || placingMode === 'add-free')"
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

    <NodeTooltip ref="nodeTip" :node="hoveredNode" :active="!!hoveredNode && showTooltip" />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, watch } from "vue";
import ReactiveSvg from "../ReactiveSvg.vue";
import WebLinks from "./WebLinks.vue";
import WebTracks from "./WebTracks.vue";
import WebCalculatedGroups from "./WebCalculatedGroups.vue";
import NodeLayer from "./NodeLayer.vue";
import LinkGhost from "./LinkGhost.vue";
import NodeGhost from "./NodeGhost.vue";
import TrackGhost from "./TrackGhost.vue";
import WebCalcGroupGhost from "./WebCalcGroupGhost.vue";
import NodeTooltip from "./NodeTooltip.vue";
import GridOverlay from "./GridOverlay.vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY } from "../../context/runtime";

// new composables (split)
import { useStashOverlay } from "./composables/useStashOverlay";
import { useTrackInteractions } from "./composables/useTrackInteractions";
import { useNodeInteractions } from "./composables/useNodeInteractions";
import { useLinkInteractions } from "./composables/useLinkInteractions";
import { useKeys } from "./composables/useKeys";
import { useGridSnap } from "./composables/useGridSnap";

export default defineComponent({
  name: "InvestigationWeb",
  components: { ReactiveSvg, WebLinks, WebTracks, WebCalculatedGroups, NodeLayer, LinkGhost, NodeGhost, TrackGhost, NodeTooltip, GridOverlay, WebCalcGroupGhost },
  // NEW: opt-in player mode without touching editor logic
  props: {
    playerView: { type: Boolean, default: false },
  },
  data(){
    const store = useInvestigationWebStore();
    const runtime = inject(RUNTIME_KEY, null) as any;
    return {
      store,
      runtime,
      overlayRect: { x:0, y:0, w:120, h:0 },
      _svgInstalled: false as boolean,
      _svgEl: null as SVGSVGElement | null,
      _lastNodeCount: 0,
    };
  },
  computed:{
    rs(): any { return (this.$refs.rs as any) || null; },

    // Visible node ids for the Player:
    // - connected: discovered ∪ discoverable (frontier)
    // - free: discovered only
    visibleIdsPlayer(): Set<string> {
      if (!this.playerView) return new Set<string>();
      return new Set([...this.store.discoverableIdSet, ...this.store.discoveredIdSet]);
    },

    // Nodes fed to the canvas
    nodes(): any[] {
      const all = this.store.nodes || [];
      if (!this.playerView) return all;
      const vis = this.visibleIdsPlayer;
      const out = all.filter((n:any)=> vis.has(n.id));
      return out;
    },

    // For link rendering, hide any link touching a hidden node
    playerVisibleIdSet(): Set<string> {
      return this.playerView ? this.visibleIdsPlayer : new Set<string>();
    },

    // Dimming:
    // In playerView, dim any node that is NOT discovered (i.e., show discoverable faint).
    // NodeLayer dims when id NOT IN discoveryVisibleSet. So pass discovered set here.
    discoveryVisibleSet(): Set<string> {
      if (this.playerView) {
        const discovered: Set<string> = this.store.discoveredIdSet;
        return new Set<string>(discovered);
      }
      // editor/GM preview path (unchanged)
      const s = this.store?.visibleByDiscoveryIdSet;
      if (s instanceof Set) return s;
      try { if (typeof s === "function") return new Set((s() || []) as string[]); } catch {}
      return new Set<string>();
    },

    // In playerView, force preview dimming active so undiscovered get faint style
    discoveryPreviewActive(): boolean {
      return false && this.playerView ? true : !!this.store.policy?.canDiscover;
    },

    hoveredId(): string | null { return this.runtime?.controllers?.hover?.id || null; },
    hoveredNode(): any | null {
      if (!this.hoveredId) return null;
      const id = this.hoveredId;
      // prefer nodes currently shown on canvas, fall back to staged items
      const foundOnCanvas = (this.nodes || []).find(n => n.id === id);
      if (foundOnCanvas) return foundOnCanvas;
      const staged = (this.store.staging || []).find(n => n.id === id);
      return staged || null;
    },
    filteredIdsSet(): Set<string> { return this.store.filteredIdSet; },
    filtersActive(): boolean { return this.store.filtersActive; },
    settings(): any { return this.store.settings; },
    policy(): any { return this.store.policy; },
    dragGhost(): any { return this.runtime?.controllers?.drag?.ghost; },
    placingMode(): string { return this.runtime?.controllers?.nodePlacement?.activeMode?.() || "none"; },
    currentMode(): string { return this.store?.currentMode || "view"; },
    gridActive(): boolean {
      const placing = this.placingMode === "add-free";
      const draggingNode = this.dragGhost?.mode === 'drag-node';
      const trackPlacing = this.store.tools.addTrack || !!this.runtime?.controllers?.trackPlacement?.ghost?.active;
      const draggingTrack = ["drag-track","drag-track-end"].includes(this.store.currentEditState);
      const calcGroupPlacing = this.store.calcGroupPlacementGhost?.active;
      return placing || draggingNode || trackPlacing || draggingTrack || calcGroupPlacing || !!this.settings.gridAlwaysVisible;
    },
    showGrid(): boolean {
      if (!this.settings.enableGrid) return false;
      if (this.currentMode === "setting") return true;
      return !!this.policy.canEditStructure && (this.settings.gridAlwaysVisible || this.gridActive);
    },
    showTooltip(): boolean {
      // const lp = this.runtime?.controllers?.linkPlacement;
      // const keys = this._keys;
      // if (lp?.isActive() && keys?.state.shiftDown) return false;
      // return !this.policy.canEditStructure || keys?.state.shiftDown;
      return true;
    },
  },
  created(){
    // install split composables
    const getSvg = () => this.rs?.getSvg?.() as SVGSVGElement | null;

    this._stash = useStashOverlay({ runtime: this.runtime, store: this.store });
    this._tracks = useTrackInteractions({ runtime: this.runtime, store: this.store, getSvg });
    this._nodes = useNodeInteractions({ runtime: this.runtime, store: this.store, getSvg });
    this._links = useLinkInteractions({ runtime: this.runtime, store: this.store, getSvg });
    this._keys = useKeys({ runtime: this.runtime, store: this.store });
    this._gridSnap = useGridSnap({ runtime: this.runtime, store: this.store, keys: this._keys });
  },
  mounted(){
    this._installDom();
    this.$watch(() => this.store.tools.addLink, (on:boolean) => {
      if (!on) this.runtime?.controllers?.linkPlacement?.cancel();
      else this.runtime?.controllers?.linkPlacement?.cancel();
    }, { immediate: false });

    this.$watch(
      () => this.store.nodes.length,
      (len, prev) => {
        if (!this.store.tools.addSimNode) { this._lastNodeCount = len; return; }
        if (len > prev) {
          const added = this.store.nodes.slice(prev);
          for (const n of added) {
            if (n.kind === 'free' && !n.sim?.enabled) {
              this.store.patchNode(n.id, { sim: { ...(n.sim||{}), enabled: true } });
            }
          }
        }
        this._lastNodeCount = len;
      },
      { immediate: true }
    );

    window.addEventListener("keydown", this._onKey);
  },
  beforeUnmount(){
    this._removeDom();
    this._keys?.dispose?.();
    this._tracks?.dispose?.();
    this._nodes?.dispose?.();
    this._links?.dispose?.();
    window.removeEventListener("keydown", this._onKey);
  },
  methods:{
    onResize(sz:{ w:number; h:number }){
      const rect = this._stash.onResize(sz);
      this.overlayRect = rect;
      if (!this._svgInstalled) this._installDom();
    },
    onContextMenu(){
      this._tracks?.cancelAll?.();
      this._nodes?.cancelAll?.();
      this._links?.cancelAll?.();
      this.store.resetTools?.();

      if (this.store.calcGroupPlacementGhost?.active) this.store.cancelCalcGroupPlacement();
    },
    _installDom(){
      const svg = this.rs?.getSvg?.();
      if (!svg || this._svgInstalled) return;
      svg.addEventListener("click", this._onClick);
      svg.addEventListener("pointermove", this._onMove);
      svg.addEventListener("pointerleave", this._onLeave);
      this._svgInstalled = true;
      this._svgEl = svg;
    },
    _removeDom(){
      const svg = this._svgEl || this.rs?.getSvg?.();
      if (!svg) return;
      svg.removeEventListener("click", this._onClick);
      svg.removeEventListener("pointermove", this._onMove);
      svg.removeEventListener("pointerleave", this._onLeave);
      this._svgInstalled = false;
      this._svgEl = null;
    },
    _onClick(e: MouseEvent){
      // order: track -> link -> node -> background
      if (this._tracks.onClick(e)) return;
      if (this._links.onClick(e)) return;
      if (this._nodes.onClick(e)) return;

      if (this.store.calcGroupPlacementGhost?.active){
        const id = this.store.commitCalcGroupPlacement();
        if (id){
          this.runtime?.controllers?.selection?.set(id);
        }
        return;
      }

      // background clears selection
      const el = e.target as Element | null;
      const isBg = !el || (!el.closest(".node") && !el.closest(".track") && !el.closest(".link") && !el.closest(".calc-group"));
      if (isBg) {
        if (Date.now() < (this.store.suppressClearSelectionUntil || 0)) return;
        this.runtime?.controllers?.selection?.clear?.();
      }
    },
    _onMove(e: PointerEvent){
      this._tracks.onPointerMove(e);
      this._links.onPointerMove(e);
      this._nodes.onPointerMove(e);

      if (this.store.tools.addCalcGroup && this.runtime?.controllers?.view){
        const w = this.runtime.controllers.view.worldFromClient(e.clientX, e.clientY);
        let { x, y } = w;
        if (this.store.settings.enableGrid && !e.altKey){
          const gs = this.store.settings.gridSize || 16;
          x = Math.round(x/gs)*gs;
          y = Math.round(y/gs)*gs;
        }
        this.store.updateCalcGroupPlacement(x, y, { alt: e.altKey });
      }
    },
    _onLeave(e: PointerEvent){
      this._nodes.onPointerLeave(e);
    },
    _onKey(e:KeyboardEvent){
      if (e.key === "Escape"){
        if (this.store.calcGroupPlacementGhost?.active){
          this.store.cancelCalcGroupPlacement();
          this.store.setCurrentEditState?.("none");
        } else {
          this._tracks?.cancelAll?.();
          this._nodes?.cancelAll?.();
          this._links?.cancelAll?.();
          this.store.resetTools?.();
        }
      }
      if (this.store.tools.linkLasso){
        this.store.setLinkLasso(false);
        this.runtime?.controllers?.linkPlacement?.cancel?.();
      }
    },
  },
  // private handles
  // eslint-disable-next-line vue/no-reserved-keys
  provide(){ return {}; }
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
.ghost-link { pointer-events:none; }
</style>