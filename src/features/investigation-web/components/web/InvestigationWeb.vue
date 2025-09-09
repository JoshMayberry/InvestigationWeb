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

      <WebLinks />
      <WebTracks />

      <NodeLayer
        :nodes="nodes"
        :settings="settings"
        :filtersActive="filtersActive"
        :filteredIdsSet="filteredIdsSet"
        :discoveryPreviewActive="discoveryPreviewActive"
        :discoveryVisibleSet="discoveryVisibleSet"
      />

      <NodeGhost />
      <LinkGhost />
      <TrackGhost />

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
import NodeLayer from "./NodeLayer.vue";
import LinkGhost from "./LinkGhost.vue";
import NodeGhost from "./NodeGhost.vue";
import TrackGhost from "./TrackGhost.vue";
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
  components: { ReactiveSvg, WebLinks, WebTracks, NodeLayer, LinkGhost, NodeGhost, TrackGhost, NodeTooltip, GridOverlay },
  data(){
    const store = useInvestigationWebStore();
    const runtime = inject(RUNTIME_KEY, null) as any;
    return {
      store,
      runtime,
      overlayRect: { x:0, y:0, w:120, h:0 },
      _svgInstalled: false as boolean,
      _svgEl: null as SVGSVGElement | null,
    };
  },
  computed:{
    rs(): any { return (this.$refs.rs as any) || null; },
    nodes(): any[] { return this.store.nodes || []; },
    hoveredId(): string | null { return this.runtime?.controllers?.hover?.id || null; },
    hoveredNode(): any | null { return this.hoveredId ? this.nodes.find(n => n.id === this.hoveredId) || null : null; },
    filteredIdsSet(): Set<string> { return this.store.filteredIdSet; },
    filtersActive(): boolean { return this.store.filtersActive; },
    discoveryVisibleSet(): Set<string> { return this.store.visibleByDiscoveryIdSet; },
    discoveryPreviewActive(): boolean { return !!this.store.policy?.canDiscover; },
    settings(): any { return this.store.settings; },
    policy(): any { return this.store.policy; },
    dragGhost(): any { return this.runtime?.controllers?.drag?.ghost; },
    placingMode(): string { return this.runtime?.controllers?.nodePlacement?.activeMode?.() || "none"; },
    currentMode(): string {
      return this.store?.currentMode || "view";
    },
    gridActive(): boolean {
      const placing = this.placingMode === "add-free";
      const draggingNode = this.dragGhost?.mode === "drag-node";
      const trackPlacing = this.store.tools.addTrack || !!this.runtime?.controllers?.trackPlacement?.ghost?.active;
      const draggingTrack = ["drag-track","drag-track-end"].includes(this.store.currentEditState);
      // const settingsPanelOpen = !!this.store.panels?.settingsOpen;
      // return settingsPanelOpen || placing || draggingNode || trackPlacing || draggingTrack || !!this.settings.gridAlwaysVisible;
      // Interaction-driven activation during editing
      return placing || draggingNode || trackPlacing || draggingTrack || !!this.settings.gridAlwaysVisible;
    },
    showGrid(): boolean {
      if (!this.settings.enableGrid) return false;
      // Always show in Settings mode
      if (this.currentMode === "setting") return true;
      // Otherwise, only when editing and active/forced
      return !!this.policy.canEditStructure && (this.settings.gridAlwaysVisible || this.gridActive);
    },
    showTooltip(): boolean {
      const lp = this.runtime?.controllers?.linkPlacement;
      const keys = this._keys;
      if (lp?.isActive() && keys?.state.shiftDown) return false;
      return !this.policy.canEditStructure || keys?.state.shiftDown;
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

    // DOM listeners are installed in mounted, when refs are ready
  },
  mounted(){
    this._installDom();
    // Cancel any active ghost when addLink is turned off anywhere
    this.$watch(() => this.store.tools.addLink, (on:boolean) => {
      if (!on) this.runtime?.controllers?.linkPlacement?.cancel();
      else this.runtime?.controllers?.linkPlacement?.cancel(); // reset when turning on
    }, { immediate: false });
  },
  beforeUnmount(){
    this._removeDom();
    this._keys?.dispose?.();
    this._tracks?.dispose?.();
    this._nodes?.dispose?.();
    this._links?.dispose?.();
  },
  methods:{
    onResize(sz:{ w:number; h:number }){
      const rect = this._stash.onResize(sz);
      this.overlayRect = rect;
      // Late-mount safety: if svg wasn’t ready earlier, try now
      if (!this._svgInstalled) this._installDom();
    },
    onContextMenu(){
      this._tracks?.cancelAll?.();
      this._nodes?.cancelAll?.();
      this._links?.cancelAll?.();
      this.store.resetTools?.();
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

      // background clears selection
      const el = e.target as Element | null;
      const isBg = !el || (!el.closest(".node") && !el.closest(".track") && !el.closest(".link"));
      if (isBg) this.runtime?.controllers?.selection?.clear?.();
    },
    _onMove(e: PointerEvent){
      this._tracks.onPointerMove(e);
      this._links.onPointerMove(e);
      this._nodes.onPointerMove(e);
    },
    _onLeave(e: PointerEvent){
      this._nodes.onPointerLeave(e);
    }
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