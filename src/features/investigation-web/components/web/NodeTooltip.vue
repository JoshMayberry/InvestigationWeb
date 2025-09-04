<template>
  <div
    ref="tip"
    class="iw-node-tooltip"
    role="tooltip"
    :data-node="node.id"
    :style="{ visibility: ready ? 'visible' : 'hidden' }"
  >
    <slot :node="node">
      <div class="title">{{ node.label || node.id }}</div>
      <div v-if="node.label" class="sub muted">ID: {{ node.id }}</div>
      <div class="meta">
        <span class="pill">r={{ node.r }}</span>
        <span class="pill" v-if="node.color">{{ node.color }}</span>
      </div>
    </slot>
    <div class="arrow" data-popper-arrow></div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { NodeAny } from "../../types/node";
import * as d3 from "d3";
import { createPopper, Instance, VirtualElement } from "@popperjs/core";

type SvgCtx = {
  getSvg: () => SVGSVGElement | null;
  getTransform: () => d3.ZoomTransform;
};

export default defineComponent({
  name: "NodeTooltip",
  inject: { reactiveSvgCtx: { default: null } },
  props: {
    node: { type: Object as () => NodeAny, required: true },
    placement: { type: String, default: "top" },
    padding: { type: Number, default: 4 },
  },
  data() {
    return {
      inst: null as Instance | null,
      frame: 0,
      ready: false,
      virt: null as VirtualElement | null,
    };
  },
  mounted() {
    this.initPopper();
  },
  beforeUnmount() {
    cancelAnimationFrame(this.frame);
    this.inst?.destroy();
    this.inst = null;
  },
  methods: {
    initPopper() {
      const ctx = (this as any).reactiveSvgCtx as SvgCtx | null;
      const svg = ctx?.getSvg();
      const tip = this.$refs.tip as HTMLElement | undefined;
      if (!svg || !tip) return;

      const virt: VirtualElement = {
        getBoundingClientRect: () => {
          const t = ctx?.getTransform?.() || d3.zoomIdentity;
            // Transform node coords -> screen coords
          const sx = this.node.x * t.k + t.x;
          const sy = this.node.y * t.k + t.y;
          const r = (this.node.r || 12);
          const svgRect = svg.getBoundingClientRect();
          const x = svgRect.left + sx - r;
          const y = svgRect.top + sy - r;
          const size = r * 2;
          return {
            x, y, left: x, top: y, width: size, height: size,
            right: x + size, bottom: y + size,
            toJSON(){ return {}; }
          } as DOMRect;
        },
        contextElement: svg
      };
      this.virt = virt;

      this.inst = createPopper(virt, tip, {
        placement: this.placement as any,
        modifiers: [
          { name: "offset", options: { offset: [0, 10] } },
          { name: "preventOverflow", options: { padding: this.padding } },
          { name: "arrow", options: { padding: 6 } },
        ],
      });

      this.ready = true;
      this.loop(); // start raf
    },
    loop() {
      if (!this.inst) return;
      this.inst.update();
      this.frame = requestAnimationFrame(() => this.loop()); // bind
    },
  },
  watch: {
    node() {
      // Node changed, force immediate update next frame
      this.$nextTick(() => this.inst?.update());
    }
  },
});
</script>

<style scoped>
.iw-node-tooltip {
  position: absolute;
  z-index: 3000;
  background: var(--panel);
  color: var(--text);
  font-size: 12px;
  line-height: 1.2;
  padding: 8px 10px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 4px 18px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;
  max-width: 220px;
  pointer-events: none;
}
.title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 2px;
  color: var(--accent);
}
.sub { font-size: 11px; margin-bottom: 6px; }
.meta { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.pill {
  background: rgba(255,255,255,0.06);
  padding: 2px 6px 3px;
  border-radius: 6px;
  font-size: 10px;
  letter-spacing: .3px;
  border: 1px solid rgba(255,255,255,0.08);
}
.muted { color: var(--muted); }
.arrow {
  position: absolute;
  width: 10px;
  height: 10px;
  background: inherit;
  transform: rotate(45deg);
  z-index: -1;
}
[data-popper-placement^='top'] > .arrow { bottom: -5px; }
[data-popper-placement^='bottom'] > .arrow { top: -5px; }
[data-popper-placement^='left'] > .arrow { right: -5px; }
[data-popper-placement^='right'] > .arrow { left: -5px; }
</style>