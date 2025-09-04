<template>
  <div class="iw-wrap" @keydown.shift="onShift(true)" @keyup.shift="onShift(false)" tabindex="-1">
    <ReactiveSvg
      ref="rs"
      class="iw-canvas"
      @zoom="onZoom"
    >
      <g class="nodes">
        <NodeDot
          v-for="n in localNodes"
          :key="n.id"
          :node="n"
          :draggable="policy?.canEditStructure"
          :selected="selectedId === n.id"
          :clamp-to-viewport="clampToViewport"
          :dim="filtersActive && !filteredIdsSet.has(n.id)"
          @move="onNodeMove"
            @moveEnd="onNodeMoveEnd"
          @select="onNodeSelect"
          @hover="onHover"
          @leave="onLeave"
        />
      </g>
    </ReactiveSvg>
    <Transition name="fade">
      <NodeTooltip
        v-if="hoveredNode && showTooltip"
        :node="hoveredNode"
      />
    </Transition>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, nextTick } from "vue";
import * as d3 from "d3";
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
    policy: {
      type: Object as PropType<ViewPolicy>,
      default: () => ({ canEditStructure: true, canDiscover: false, canInteract: true }),
    },
    selectedId: { type: String, default: null },
    clampToViewport: { type: Boolean, default: true },
    filteredIds: { type: Object as PropType<Set<string>>, default: () => new Set<string>() },
    filtersActive: { type: Boolean, default: false },
    editMode: { type: Boolean, default: false },
  },
  emits: ["update:nodes", "select:node"],
  data(){
    return {
      localNodes: [] as NodeAny[],
      draggingId: null as string | null,
      hoveredNode: null as NodeAny | null,
      currentTransform: d3.zoomIdentity as d3.ZoomTransform,
      svgCtx: {
        getSvg: () => null as SVGSVGElement | null,
        getRoot: () => null as SVGGElement | null,
        getSize: () => ({ w: 0, h: 0 }),
        getTransform: () => this.currentTransform,
      },
      shiftDown: false,
      filteredIdsSet: new Set<string>(),
    };
  },
  provide() {
    // Provide a stable object reference; inner functions updated after mount
    return { reactiveSvgCtx: this.svgCtx };
  },
  created(){
    this.localNodes = (this.nodes as NodeAny[]).map(n => ({
      id: n.id, kind: "free", x: n.x ?? 0, y: n.y ?? 0, r: n.r ?? 12, color: n.color, label: n.label
    }));
  },
  mounted(){
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKey);
    // Wire through to underlying ReactiveSvg instance
    const rs: any = this.$refs.rs;
    if (rs) {
      this.svgCtx.getSvg  = () => rs.getSvg?.() || null;
      this.svgCtx.getRoot = () => rs.getRoot?.() || null;
      this.svgCtx.getSize = () => rs.getSize?.() || { w:0, h:0 };
    }
  },
  beforeUnmount(){
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKey);
  },
  computed: {
    showTooltip(): boolean {
      // Allowed if not editing OR shift held
      return !this.editMode || this.shiftDown;
    },
  },
  watch: {
    nodes: {
      deep: true,
      handler(newVal: NodeAny[]) {
        const byId = new Map(newVal.map(n => [n.id, n]));
        const next = this.localNodes.map(n => {
          const src = byId.get(n.id) as NodeAny | undefined;
            return src ? { ...n, ...src } : n;
        });
        for (const n of newVal) if (!next.find(m => m.id === n.id)) {
          const nf = n as any;
          next.push({ id:nf.id, kind:"free", x:nf.x||0, y:nf.y||0, r:nf.r||12, color:nf.color, label:nf.label });
        }
        this.localNodes = next.filter(n => byId.has(n.id));
        nextTick(() => void 0);
      }
    },
    filteredIds: {
      immediate: true,
      handler(v: Set<string>){
        this.filteredIdsSet = v || new Set();
      }
    },
  },
  methods: {
    onZoom(t: d3.ZoomTransform){ this.currentTransform = t; },
    onNodeSelect(node: NodeAny) { this.$emit("select:node", node); },
    onNodeMove({ id, x, y }: { id:string; x:number; y:number }) {
      this.draggingId = id;
      const n = this.localNodes.find(n => n.id === id);
      if (n) { n.x = x; n.y = y; }
    },
    onNodeMoveEnd() {
      this.draggingId = null;
      const out = this.localNodes.map(n => ({ ...n }));
      this.$emit("update:nodes", out);
    },
    onShift(d: boolean){ this.shiftDown = d; },
    onHover(node: NodeAny){
      this.hoveredNode = node;
    },
    onLeave(){ this.hoveredNode = null; },
    _onKey(e: KeyboardEvent){
      if (e.key === 'Shift') this.shiftDown = e.type === 'keydown';
    },
  },
});
</script>

<style scoped>
.iw-wrap { position: relative; width: 100%; height: 100%; }
.iw-canvas { display: block; width: 100%; height: 100%; }
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
