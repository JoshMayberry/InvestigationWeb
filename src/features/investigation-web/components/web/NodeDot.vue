<template>
  <g
    class="node"
    :class="{ dim }"
    :data-id="node.id"
    :transform="`translate(${node.x},${node.y})`"
    ref="el"
    @mouseenter="$emit('hover', node);"
    @mouseleave="$emit('leave', node);"
    @focus="$emit('hover', node);"
    @blur="$emit('leave', node);"
  >
    <!-- selection ring -->
    <circle
      v-if="selected"
      class="sel"
      :r="(node.r || 12) + 6"
      fill="none"
      stroke="var(--ring)"
      stroke-width="6"
      opacity="0.85"
      pointer-events="none"
    />
    <circle
      class="core"
      :r="node.r || 12"
      :fill="node.color || 'var(--ok)'"
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
import * as d3 from "d3";
import { clamp } from "../../utils";
import type { NodeAny } from "../../types/node";

type SvgCtx = {
  getSvg: () => SVGSVGElement | null;
  getTransform: () => d3.ZoomTransform;
  getSize: () => { w:number; h:number };
};

export default defineComponent({
  name: "NodeDot",
  inject: {
    reactiveSvgCtx: { default: null },
  },
  props: {
    node: { type: Object as () => NodeAny, required: true },
    draggable: { type: Boolean, default: true },
    selected: { type: Boolean, default: false },
    clampToViewport: { type: Boolean, default: true },
    clampPadding: { type: Number, default: 8 },
    dim: { type: Boolean, default: false },
  },
  emits: ["move", "moveEnd", "select", "hover", "leave"],
  data() {
    return {
      dragging: false,
      _startX: 0,
      _startY: 0,
      _moved: false,
    };
  },
  mounted() {
    this.refreshDrag();
  },
  beforeUnmount() {
    const el = this.$refs.el as SVGGElement | undefined;
    if (el) d3.select(el).on(".drag", null);
  },
  methods: {
    refreshDrag() {
      const el = this.$refs.el as SVGGElement | undefined;
      if (!el) return;
      const sel = d3.select(el);
      sel.on(".drag", null); // reset idempotently

      if (!this.draggable) return;

      const ctx = (this as any).reactiveSvgCtx as SvgCtx | null;
      const threshold = 3; // px

      sel.call(
        d3.drag<SVGGElement, unknown>()
          .container(() => ctx?.getSvg() || (el as any).ownerSVGElement)
          .on("start", (ev) => {
            this.dragging = true;
            this._moved = false;
            const t = ctx?.getTransform?.();
            const [sx, sy] = t && t.invert ? t.invert([ev.x, ev.y]) : [ev.x, ev.y];
            this._startX = sx;
            this._startY = sy;
            (ev.sourceEvent as any)?.stopPropagation?.(); // don’t let zoom see this press
            sel.raise();
          })
          .on("drag", (ev) => {
            const t = ctx?.getTransform?.();
            let x = ev.x, y = ev.y;
            if (t && typeof t.invert === "function") [x, y] = t.invert([ev.x, ev.y]);

            // movement tracking for click detection
            if (!this._moved && (Math.abs(x - this._startX) > threshold || Math.abs(y - this._startY) > threshold)) {
              this._moved = true;
            }

            if (this.clampToViewport) {
              const size = ctx?.getSize?.();
              if (size) {
                const r = this.node.r || 12;
                const pad = this.clampPadding;
                x = clamp(x, r + pad, size.w - r - pad);
                y = clamp(y, r + pad, size.h - r - pad);
              }
            }
            this.$emit("move", { id: this.node.id, x, y });
          })
          .on("end", () => {
            this.dragging = false;
            // If there was effectively no movement, treat as click -> select
            if (!this._moved) this.$emit("select", this.node);
            this.$emit("moveEnd", { id: this.node.id });
          })
      );
    },
  },
  watch: {
    draggable() { this.refreshDrag(); },
  },
});
</script>

<style scoped>
.node { touch-action: none; transition: opacity .25s ease; }
.node .core, .node .label { transition: opacity .25s ease; }
.node.dim .core,
.node.dim .label { opacity: 0.25; }
.node:focus { outline: none; }
.sel { filter: drop-shadow(0 0 6px rgba(96,165,250,.5)); }
</style>