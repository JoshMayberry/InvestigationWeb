<template>
  <g
    ref="g"
    class="node-dot"
    :transform="`translate(${positionActual.x},${positionActual.y})`"
    :style="{ cursor: dragging ? 'grabbing' : 'grab' }"
    @click="onSelect"
  >
    <!-- ghost (in local coords) -->
    <circle
      v-if="dragging && positionGhost"
      :cx="positionGhostLocal.x"
      :cy="positionGhostLocal.y"
      :r="r"
      fill="none"
      stroke="#ffd166"
      :stroke-width="2"
      stroke-dasharray="4 3"
      opacity="0.9"
      pointer-events="none"
    />
    <!-- snap suggestion (also in local coords) -->
    <circle
      v-if="dragging && snapCandidate"
      :cx="positionSnapLocal.x"
      :cy="positionSnapLocal.y"
      :r="r - 2"
      fill="none"
      stroke="#7fd37f"
      :stroke-width="2"
      opacity="0.9"
      pointer-events="none"
    />
    <!-- actual node -->
    <circle
      :r="r"
      :fill="color"
      stroke="#15204e"
      stroke-width="2"
    />
    <text
      v-if="label"
      y="-16"
      text-anchor="middle"
      fill="#c8d3ff"
      font-size="11"
      pointer-events="none"
    >{{ label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { NodeAny, NodeFree, NodeSnap } from "../types/node"
import { CompiledTrack, Projection } from "../types/layout"
import * as d3 from "d3";
import { Point } from "../types";


export default defineComponent({
  name: "NodeDot",
  props: {
    node: { type: Object as PropType<NodeAny>, required: true },
    tracks: { type: Array as PropType<CompiledTrack[]>, default: () => [] },
    hitThreshold: { type: Number, default: 24 }, // px
    r: { type: Number, default: 12 },
    color: { type: String, default: "#10b981" },
    label: { type: String, default: "" },
    getSvg: { type: Function as PropType<() => SVGSVGElement|null>, default: () => null },
    draggable: { type: Boolean, default: true },
  },
  emits: ["move", "select"],
  data(){
    return {
      g: null as SVGGElement | null,
      dragging: false,
      positionGhost: null as Point | null,                // absolute SVG coords
      snapCandidate: null as Projection | null,
      _dragStartPos: { x:0, y:0 },                // node position at gesture start
      _dragOffset: { dx:0, dy:0 },                // nodePos - pointerPos at start
    };
  },
  computed: {
    positionActual(): Point {
      const node = this.node;
       switch (node.kind) {
        case "free":
          return { x: node.x || 0, y: node.y || 0 };
        case "snap":
          const track = this.tracks.find(t => t.id === node.trackId);
          const evaluatedTrack = track?.eval(node.t) || { x: 0, y: 0 };
          return { x: evaluatedTrack.x || 0, y: evaluatedTrack.y || 0 };
        default:
          throw new Error(`Unknown node kind '${(node as any).kind}'`);
      }
    },

    // Convert absolute ghost/snap points into the node"s local space (so they render correctly inside the translated <g>)
    positionGhostLocal(): Point {
      const g = this.positionGhost;
      return g ? { x: g.x - this.positionActual.x, y: g.y - this.positionActual.y } : { x: 0, y: 0 };
    },
    positionSnapLocal(): Point {
      const s = this.snapCandidate?.point || null;
      return s ? { x: s.x - this.positionActual.x, y: s.y - this.positionActual.y } : { x: 0, y: 0 };
    },
  },
  mounted(){
    this.g = this.$refs.g as SVGGElement | null;
    if (this.draggable) this.installDrag();
  },
  beforeUnmount(){
    if (this.g) d3.select(this.g).on(".drag", null);
  },
  methods: {
    onSelect() {
      this.$emit("select", this.node);
    },
    installDrag(){
      if (!this.g) return;

      const svg = this.getSvg?.() || (this.g as any).ownerSVGElement;
      const sel = d3.select(this.g);

      sel.call(
        d3.drag<SVGGElement, unknown>()
          // Keep pointer coords in the SVG viewport space
          .container(() => svg)
          .on("start", (ev: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
            // Node position at gesture start (in absolute SVG coords)
            this._dragStartPos = { x: this.positionActual.x, y: this.positionActual.y };

            // Pointer absolute coords at gesture start (d3 already gives SVG coords)
            const px = ev.x, py = ev.y;

            // Offset ensures the pointer stays "anchored" to where you grabbed the dot
            this._dragOffset = { dx: this._dragStartPos.x - px, dy: this._dragStartPos.y - py };

            this.dragging = true;
            this.positionGhost = { ...this._dragStartPos };
            this.snapCandidate = null;

            // Don’t let zoom pan start
            (ev.sourceEvent as any)?.stopPropagation?.();
          })

          .on("drag", (ev: d3.D3DragEvent<SVGGElement, unknown, unknown>) => {
            // New absolute SVG position for the ghost
            const gx = ev.x + this._dragOffset.dx;
            const gy = ev.y + this._dragOffset.dy;
            this.positionGhost = { x: gx, y: gy };

            // If you add projectors later, suggest a snap when close
            const hit = this.closestTrack({ x: gx, y: gy });
            if (hit && hit.dist <= this.hitThreshold) {
              this.snapCandidate = { trackId: hit.trackId, point: hit.point, t: hit.t, dist: hit.dist };
            } else {
              this.snapCandidate = null;
            }
          })

          .on("end", () => {
            const last = this.positionGhost;
            const suggestion = this.snapCandidate;

            this.dragging = false;
            this.positionGhost = null;

            if (suggestion){
              // Snap commit
              this.$emit("move", {
                id: this.node.id,
                kind: "snap",
                trackId: suggestion.trackId,
                t: suggestion.t,
                color: (this.node as any).color,
                label: (this.node as any).label,
              } as NodeSnap);
            } else if (last){
              // Free commit
              this.$emit("move", {
                id: this.node.id,
                kind: "free",
                x: last.x,
                y: last.y,
                color: (this.node as any).color,
                label: (this.node as any).label,
              } as NodeFree);
            }
            this.snapCandidate = null;
          })
      );
    },

    closestTrack(p: Point){
      let best: { trackId:string; t:number; point:Point; dist:number } | null = null;
      for (const tr of this.tracks){
        if (!tr.project) continue; // (projection can be added later)
        const pr = tr.project(tr.id, p);
        if (!best || pr.dist < best.dist){
          best = { trackId: tr.id, t: pr.t, point: pr.point, dist: pr.dist };
        }
      }
      return best;
    },
  },
});
</script>

<style scoped>
.node-dot { touch-action: none; }
</style>
