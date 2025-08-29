<template>
  <ReactiveSvg
    ref="rs"
    :zoomExtent="[0.5, 2.5]"
    @resized="compileLayoutForViewport"
    @zoom="onZoom"
  >
    <!-- Tracks -->
    <TrackGroup
      :tracks="compiledTracks"
      :defaultColor="defaultTrackColor"
      :strokeWidth="2"
      :strokeOpacity="0.9"
    />

    <!-- Nodes -->
    <g class="nodes">
      <NodeDot
        v-for="n in localNodes"
        :key="n.id"
        :node="n"
        :tracks="compiledTracks"
        :hitThreshold="24"
        :getSvg="getSvgEl"
        :color="n.color || '#10b981'"
        :label="n.label || ''"
        @move="onNodeMove"
        @select="onNodeSelect"
      />
    </g>
  </ReactiveSvg>
</template>

<script lang="ts">
import { defineComponent, PropType, nextTick } from "vue";
import * as d3 from "d3";
import ReactiveSvg from "./ReactiveSvg.vue";
import TrackGroup from "./NodeTrackGroup.vue";
import NodeDot from "./NodeDot.vue";
import type { LayoutAny, CompiledTrack } from "../types/layout";
import { compileLayout as compileLayoutFn } from "../utils/compileLayout";
import { Rect } from "../types";
import { NodeAny } from "../types/node";

export default defineComponent({
  name: "NavigationWeb",
  components: { ReactiveSvg, TrackGroup, NodeDot },
  props: {
    layout: { type: Object as PropType<LayoutAny>, required: true },
    nodes:  { type: Array as PropType<NodeAny[]>, default: () => [] },
  },
  emits: ["update:nodes", "select:node"],
  data(){
    return {
      zoomT: d3.zoomIdentity as d3.ZoomTransform,
      compiledTracks: [] as CompiledTrack[],
      localNodes: [] as NodeAny[],
      seeded: false,
      defaultTrackColor: "#7aa2ff",
    };
  },
  created(){
    this.localNodes = this.nodes.map(n => ({ ...n }));
  },
  watch: {
    layout: { deep: true, handler(){ this.compileLayoutForViewport(); } },
    nodes: {
      deep: true,
      handler(newVal: NodeAny[]) {
        const byId = new Map(newVal.map(n => [n.id, n]));
        const next = this.localNodes.map(n => byId.get(n.id) ? { ...byId.get(n.id)! } : n);
        for (const n of newVal) if (!next.find(m => m.id === n.id)) next.push({ ...n });
        this.localNodes = next.filter(n => byId.has(n.id));
      }
    }
  },
  mounted(){
    this.compileLayoutForViewport();
  },
  methods: {
    onZoom(t: d3.ZoomTransform){ this.zoomT = t; },
    getSvgEl(): SVGSVGElement | null {
      const rs: any = this.$refs.rs;
      return rs?.getSvg?.() || null;
    },
    compileLayoutForViewport(){
      nextTick(()=>{
        const rs: any = this.$refs.rs;
        if (!rs) return;
        const { w, h } = rs.getSize?.() || { w:0, h:0 };
        if (!w || !h) return;

        const frame: Rect = { x:0, y:0, w, h };
        this.compiledTracks = compileLayoutFn(this.layout, frame);

        if (!this.seeded && this.localNodes.length > 0) {
          const cx = w / 2, cy = h / 2;
          this.localNodes = this.localNodes.map((n, i) => {
            if (n.kind === "free") {
              return {
                ...n,
                x: Number.isFinite(n.x) ? n.x : cx + (i % 2 ? 60 : -60),
                y: Number.isFinite(n.y) ? n.y : cy + (i % 2 ? -40 : 40),
              };
            }
            return n;
          });
          this.seeded = true;
        }
      });
    },
    onNodeMove(next: NodeAny) {
      const i = this.localNodes.findIndex(n => n.id === next.id);
      if (i >= 0) this.localNodes.splice(i, 1, { ...next });
      else this.localNodes.push({ ...next });
      this.$emit("update:nodes", this.localNodes.map(n => ({ ...n })));
    },
    onNodeSelect(node: NodeAny) {
      this.$emit("select:node", node);
    },
  },
});
</script>
