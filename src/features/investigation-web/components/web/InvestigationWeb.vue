<template>
  <div
    class="iw-wrap"
    :class="{
      'mode-add': addFreeNode,
      'mode-place-staged': !!placeStagedId,
      'mode-dragging': !!draggingId
    }"
    tabindex="-1"
    @contextmenu.prevent="onContextMenu"
  >
    <ReactiveSvg
      ref="rs"
      class="iw-canvas"
      @transform="onTransform"
      @resized="onResize"
    >
      <!-- World content -->
      <g class="nodes">
        <NodeDot
          v-for="n in localNodes"
          :key="n.id"
          :node="n"
          :draggable="policy?.canEditStructure"
          :selected="selectedId === n.id"
          :dim="filtersActive && !filteredIdsSet.has(n.id)"
          @move="onNodeMoveGhost"
          @drag:start="onDragStart"
          @drag:end="onDragEnd"
          @select="onNodeSelect"
          @hover="onHover"
          @leave="onLeave"
        />
      </g>

      <g v-if="enforceNoOverlap && showPadPreview" class="pad-preview">
        <circle
          v-for="n in localNodes"
          :key="`pad-${n.id}`"
          :cx="n.x"
          :cy="n.y"
          :r="paddingRadius(n)"
          class="pad-circle"
        />
      </g>

      <g v-if="ghost.active" class="ghost-layer">
        <g
          class="ghost-node"
          :transform="`translate(${ghost.x},${ghost.y})`"
          pointer-events="none"
        >
          <circle
            :r="ghost.r"
            :fill="ghostInvalid ? 'rgba(239,68,68,0.30)' : ghost.color"
            :stroke="ghostInvalid ? '#ef4444' : ghost.color"
            stroke-width="2"
            :stroke-dasharray="ghostInvalid ? '4 4' : null"
          />
          <text
            v-if="ghost.label"
            class="ghost-label"
            y="-18"
            text-anchor="middle"
            font-size="11"
            :fill="ghostInvalid ? '#ffc9c9' : '#c8d3ff'"
            fill-opacity="0.75"
          >{{ ghost.label }}</text>
        </g>
      </g>

      <template #overlay>
        <rect
          v-if="policy.canEditStructure"
          class="stash-zone"
          :x="overlayRect.x"
          :y="overlayRect.y"
          :width="overlayRect.w"
          :height="overlayRect.h"
          :fill="draggingId ? 'rgba(96,165,250,0.15)' : 'rgba(96,165,250,0.08)'"
          stroke="rgba(96,165,250,0.45)"
          stroke-dasharray="4 4"
          rx="3"
        />
      </template>
    </ReactiveSvg>

    <Transition name="fade">
      <NodeTooltip v-if="hoveredNode && showTooltip" :node="hoveredNode" />
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, nextTick } from "vue";
import ReactiveSvg from "../ReactiveSvg.vue";
import NodeDot from "./NodeDot.vue";
import NodeTooltip from "./NodeTooltip.vue";
import type { NodeAny } from "../../types/node";
import type { ViewPolicy } from "../../types";

export default defineComponent({
  name: "InvestigationWeb",
  components: { ReactiveSvg, NodeDot, NodeTooltip },
  props: {
    nodes: { type: Array as PropType<NodeAny[]>, default: () => [] },
    stagedNodes: { type: Array as PropType<NodeAny[]>, default: () => [] }, // NEW
    policy: { type:Object as PropType<ViewPolicy>, default: () => ({ canEditStructure:true, canDiscover:false, canInteract:true }) },
    selectedId: { type:String, default:null },
    filteredIds: { type:Object as PropType<Set<string>>, default: () => new Set<string>() },
    filtersActive: { type:Boolean, default:false },
    editMode: { type:Boolean, default:false },
    addFreeNode: { type:Boolean, default:false },
    placeStagedId: { type:String, default:null },
    enforceNoOverlap: { type:Boolean, default:false },
    nodePadding: { type:Number, default:0 },
    showPadPreview: { type:Boolean, default:false },
  },
  emits: [
    "update:nodes",
    "select:node",
    "node:add",
    "node:droppedToStaging",
    "canvas:point",
    "tool:cancel" // NEW
  ],
  data(){
    return {
      localNodes: [] as NodeAny[],
      filteredIdsSet: new Set<string>(),
      draggingId: null as string | null,
      hoveredNode: null as NodeAny | null,
      overlayRect: { x:0, y:0, w:120, h:0 },
      canvasSize: { w:0, h:0 },
      shiftDown:false,
      ghost: {
        active:false,
        id:null as string|null,
        x:0,
        y:0,
        r:14,
        color:"#60a5fa",
        label:""
      },
      ghostInvalid:false,
      transform: { k:1, x:0, y:0 },
    };
  },
  created(){
    this.localNodes = this.nodes.map(n => ({ ...n }));
  },
  computed:{
    showTooltip(){ return !this.editMode || this.shiftDown; },
  },
  watch:{
    nodes: {
      deep:true,
      handler(v:NodeAny[]){
        this.localNodes = v.map(n => ({ ...n }));
        nextTick();
      }
    },
    filteredIds: {
      immediate:true,
      handler(v:Set<string>){
        this.filteredIdsSet = v || new Set();
      }
    },
    addFreeNode(){ this.ensureGhostMode(); },
    placeStagedId(){ this.ensureGhostMode(); },
    stagedNodes(){ this.ensureGhostMode(); },
    enforceNoOverlap(){ if (this.ghost.active) this.validateGhost(); },
    nodePadding(){ if (this.ghost.active) this.validateGhost(); },
  },
  mounted(){
    window.addEventListener("keydown", this._onKey);
    window.addEventListener("keyup", this._onKey);
    this.updateOverlay();
    this.attachSvgListeners();
  },
  beforeUnmount(){
    window.removeEventListener("keydown", this._onKey);
    window.removeEventListener("keyup", this._onKey);
    this.detachSvgListeners();
  },
  methods:{
    attachSvgListeners(){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      if (svg) {
        svg.addEventListener("pointermove", this.onSvgPointerMove);
        svg.addEventListener("click", this.onSvgClick);
      }
    },
    detachSvgListeners(){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      if (svg) {
        svg.removeEventListener("pointermove", this.onSvgPointerMove);
        svg.removeEventListener("click", this.onSvgClick);
      }
    },
    onTransform(t:{k:number;x:number;y:number}){ this.transform = t; },
    onResize(sz:{w:number;h:number}) {
      this.canvasSize = sz;
      this.updateOverlay();
    },
    updateOverlay(){
      this.overlayRect = {
        x: Math.max(0, this.canvasSize.w - 140),
        y: 0,
        w: 140,
        h: this.canvasSize.h
      };
    },
    worldFromClient(clientX:number, clientY:number){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      if (!svg) return { x:0, y:0 };
      const r = svg.getBoundingClientRect();
      const sx = clientX - r.left;
      const sy = clientY - r.top;
      return {
        x: (sx - this.transform.x) / this.transform.k,
        y: (sy - this.transform.y) / this.transform.k
      };
    },
    onContextMenu(){
      // cancel current tool modes
      if (this.addFreeNode || this.placeStagedId || this.ghost.active) {
        this.ghost.active = false;
        this.$emit("tool:cancel");
      }
    },
    ensureGhostMode(){
      if (this.draggingId) return;
      if (this.placeStagedId) {
        const st = this.stagedNodes.find(s => s.id === this.placeStagedId);
        if (st) {
          this.ghost.active = true;
          this.ghost.id = null;
          this.ghost.r = st.r || 14;
          this.ghost.color = st.color || "#10b981";
          this.ghost.label = st.label || "Staged";
          this.validateGhost();
          return;
        }
      }
      if (this.addFreeNode) {
        this.ghost.active = true;
        this.ghost.id = null;
        this.ghost.r = 14;
        this.ghost.color = "#10b981";
        this.ghost.label = "New";
        this.validateGhost();
        return;
      }
      if (!this.draggingId) {
        this.ghost.active = false;
        this.ghostInvalid = false;
      }
    },
    onSvgPointerMove(e:PointerEvent){
      if (this.draggingId) return;
      if (!(this.addFreeNode || this.placeStagedId)) return;
      const w = this.worldFromClient(e.clientX, e.clientY);
      this.ghost.x = w.x;
      this.ghost.y = w.y;
      this.validateGhost();
    },
    onSvgClick(e:MouseEvent){
      if (!this.policy.canEditStructure) return;
      const w = this.worldFromClient(e.clientX, e.clientY);
      // Stash placement precedence handled by page via canvas:point
      if (this.placeStagedId) {
        if (this.validateGhost(true)) {
          this.$emit("canvas:point", { x: w.x, y: w.y });
          this.ghost.active = false;
        }
        return;
      }
      if (this.addFreeNode) {
        if (!this.validateGhost(true)) return;
        this.$emit("node:add", { x: w.x, y: w.y });
      } else {
        this.$emit("canvas:point", { x: w.x, y: w.y });
      }
    },
    paddingRadius(n:NodeAny){
      const r = (n.r || 14) + this.nodePadding;
      return Math.max(1, r);
    },
    validateGhost(){
      if (!this.enforceNoOverlap) { this.ghostInvalid = false; return true; }
      const pad = this.nodePadding;
      const gx = this.ghost.x;
      const gy = this.ghost.y;
      const gr = this.ghost.r;
      for (const n of this.localNodes) {
        if (this.draggingId && n.id === this.draggingId) continue;
        const dx = gx - n.x;
        const dy = gy - n.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const need = (n.r || 14) + gr + 2*pad;
        if (dist < need) {
          this.ghostInvalid = true;
          return false;
        }
      }
      this.ghostInvalid = false;
      return true;
    },
    onNodeSelect(n:NodeAny){ this.$emit("select:node", n); },
    onNodeMoveGhost({ id, x, y }:{id:string;x:number;y:number}){
      if (!this.draggingId || this.draggingId !== id) return;
      this.ghost.x = x;
      this.ghost.y = y;
      this.validateGhost();
    },
    _onKey(e:KeyboardEvent){
      if (e.key === "Shift") this.shiftDown = e.type === "keydown";
      if (e.key === "Escape") {
        if (this.draggingId) {
          // Let NodeDot cancel logic handle; just ignore here
          return;
        }
        if (this.addFreeNode || this.placeStagedId || this.ghost.active) {
          this.ghost.active = false;
          this.$emit("tool:cancel");
        }
      }
    },
    onDragStart(p:{id:string; origin:{x:number;y:number}}){
      const node = this.localNodes.find(n => n.id === p.id);
      if (!node) return;
      this.draggingId = p.id;
      this.ghost.active = true;
      this.ghost.id = p.id;
      this.ghost.x = node.x;
      this.ghost.y = node.y;
      this.ghost.r = node.r || 14;
      this.ghost.color = node.color || "#10b981";
      this.ghost.label = node.label || "";
      this.validateGhost();
    },
    onDragEnd(payload:{id:string; clientX:number; clientY:number; canceled?:boolean}){
      const svg = (this.$refs.rs as any)?.getSvg?.();
      const node = this.localNodes.find(n => n.id === payload.id);
      const ghostValid = !this.ghostInvalid;
      if (svg){
        const rect = svg.getBoundingClientRect();
        const vx = payload.clientX - rect.left;
        const vy = payload.clientY - rect.top;
        const inSvg = vx >= 0 && vy >= 0 && vx <= rect.width && vy <= rect.height;
        const inStash = inSvg && vx >= (rect.width - this.overlayRect.w);
        if (!payload.canceled && inStash) {
          this.$emit("node:droppedToStaging", { id: payload.id });
        } else if (!payload.canceled && inSvg && ghostValid && node) {
          node.x = this.ghost.x;
          node.y = this.ghost.y;
          this.$emit("update:nodes", this.localNodes.map(n => ({ ...n })));
        }
      }
      this.draggingId = null;
      this.ghost.active = (this.addFreeNode || this.placeStagedId); // keep ghost if tool still active
      if (!this.ghost.active) {
        this.ghost.id = null;
      } else {
        this.ghost.id = null;
        this.ghost.r = 14;
        this.ghost.color = "#60a5fa";
        this.ghost.label = this.placeStagedId ? "Staged" : "New";
      }
      this.validateGhost();
    },
    onHover(n:NodeAny){ this.hoveredNode = n; },
    onLeave(){ this.hoveredNode = null; },
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
