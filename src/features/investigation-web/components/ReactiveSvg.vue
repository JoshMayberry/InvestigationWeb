<template>
  <div ref="wrap" class="rs-wrap" :style="{ background }">
    <svg
      ref="svg"
      class="rs-svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMid meet"
    >
      <g ref="root"><slot /></g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import * as d3 from 'd3';

type ZoomExtent = [number, number];
type StartTransform = { k?: number; x?: number; y?: number };

export default defineComponent({
  name: 'ReactiveSvg',
  props: {
    background: {
      type: String,
      default: 'radial-gradient(1200px 800px at 60% -10%, #162155 0%, #0b1020 60%)'
    },
    zoomExtent: {
      type: Array as unknown as PropType<ZoomExtent>,
      default: () => [0.5, 2.5] as ZoomExtent,
    },
    startTransform: {
      type: Object as PropType<StartTransform>,
      default: () => ({ k: 1, x: 0, y: 0 }),
    },
  },
  emits: ['resized','zoom'],
  data() {
    return {
      size: { w: 1, h: 1 },
      ro: null as ResizeObserver | null,
      zoomBehavior: null as d3.ZoomBehavior<SVGSVGElement, unknown> | null,
      currentTransform: d3.zoomIdentity as d3.ZoomTransform,
    };
  },
  computed: {
    viewBox(): string {
      const w = Math.max(1, Math.round(this.size.w));
      const h = Math.max(1, Math.round(this.size.h));
      return `0 0 ${w} ${h}`;
    },
  },
  provide() {
    return {
      reactiveSvgCtx: {
        getSvg: () => this.getSvg(),
        getRoot: () => this.getRoot(),
        getSize: () => this.getSize(),
        getTransform: () => this.currentTransform,
      },
    };
  },
  mounted() {
    this._measure();
    this._initZoom();
    this._observe();
  },
  beforeUnmount() {
    this.ro?.disconnect();
    this.ro = null;
  },
  methods: {
    getRoot(): SVGGElement | null { return this.$refs.root as SVGGElement | null; },
    getSvg():  SVGSVGElement | null { return this.$refs.svg  as SVGSVGElement | null; },
    getSize(): { w:number; h:number } { return { ...this.size }; },

    resetZoom(duration = 0) {
      const svg = this.getSvg(); if (!svg || !this.zoomBehavior) return;
      const sel = d3.select(svg);
      duration > 0
        ? sel.transition().duration(duration).call(this.zoomBehavior.transform as any, d3.zoomIdentity)
        : sel.call(this.zoomBehavior.transform as any, d3.zoomIdentity);
    },

    _measure() {
      const wrap = this.$refs.wrap as HTMLDivElement | undefined;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width && rect.height) {
        this.size.w = rect.width;
        this.size.h = rect.height;
      }
    },
    _initZoom() {
      const svg  = this.$refs.svg  as SVGSVGElement | undefined;
      const root = this.$refs.root as SVGGElement   | undefined;
      if (!svg || !root || this.zoomBehavior) return;

      this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent(this.zoomExtent)
        .on('zoom', (e) => {
          this.currentTransform = e.transform;
          d3.select(root).attr('transform', e.transform as any);
          this.$emit('zoom', e.transform);
        });

      const { k = 1, x = 0, y = 0 } = this.startTransform || {};
      d3.select(svg).call(this.zoomBehavior as any)
        .call(this.zoomBehavior.transform as any, d3.zoomIdentity.translate(x,y).scale(k));
    },
    _observe() {
      const wrap = this.$refs.wrap as HTMLDivElement | undefined;
      if (!wrap) return;
      this.ro = new ResizeObserver((entries) => {
        for (const e of entries) {
          const { width, height } = e.contentRect;
            if (!width || !height) continue;
          const w = Math.round(width), h = Math.round(height);
          if (w !== Math.round(this.size.w) || h !== Math.round(this.size.h)) {
            this.size.w = width;
            this.size.h = height;
            this.$emit('resized', { w: this.size.w, h: this.size.h });
          }
        }
      });
      this.ro.observe(wrap);
    },
  },
});
</script>

<style scoped>
.rs-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid #1b2460;
  border-radius: 10px;
}
.rs-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}
</style>
