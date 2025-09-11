<template>
  <div class="rs-wrap" ref="wrap">
    <svg class="rs-svg" ref="svg">
      <g class="world" ref="world" :transform="`translate(${t.x},${t.y}) scale(${t.k})`">
        <slot />
      </g>
      <g class="overlay">
        <slot name="overlay" />
      </g>
    </svg>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import * as d3 from "d3";
import { InvestigationRuntime, RUNTIME_KEY } from "../context/runtime";
import { useInvestigationWebStore } from "../stores/web";

interface RSTransform { k:number; x:number; y:number; }

export default defineComponent({
  name: "ReactiveSvg",
  emits: ["transform","resized","zoom"],
  props: {
    minZoom: { type:Number, default: 0.25 },
    maxZoom: { type:Number, default: 3 },
    zoomStep: { type:Number, default: 0.08 },
  },
  data(){
    return {
      t: { k:1, x:0, y:0 } as RSTransform,
      svgEl: null as SVGSVGElement | null,
      worldEl: null as SVGGElement | null,
      wrapEl: null as HTMLDivElement | null,
      size: { w:0, h:0 },
      resizeObs: null as ResizeObserver | null,
      zoomBehavior: null as d3.ZoomBehavior<SVGSVGElement, unknown> | null,
      runtime: null as InvestigationRuntime | null,
      store: useInvestigationWebStore(),
    };
  },
  created(){ this.runtime = inject(RUNTIME_KEY, null); },
  mounted(){
    this.svgEl = this.$refs.svg as SVGSVGElement;
    this.worldEl = this.$refs.world as SVGGElement;
    this.wrapEl = this.$refs.wrap as HTMLDivElement;
    if (this.runtime && this.svgEl){
      this.runtime.controllers.view.setSvgEl(this.svgEl);
      this.runtime.controllers.view.setTransform({ ...this.t });
    }
    this.initZoom();
    this.observeResize();
  },
  beforeUnmount(){
    if (this.resizeObs) this.resizeObs.disconnect();
    if (this.svgEl && this.zoomBehavior) d3.select(this.svgEl).on(".zoom", null);
    if (this.runtime) this.runtime.controllers.view.setSvgEl(null);
  },
  methods: {
    initZoom(){
      if (!this.svgEl || !this.worldEl) return;
      const self = this;
      this.zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([this.minZoom, this.maxZoom])
        .filter(function(event: any) {
          // Disable background drag-pan while Link Lasso active
          if (self.store?.tools?.linkLasso) {
            if (event.type === "mousedown") return false; // block drag start
          }
          if (event.type === "mousedown" && event.button !== 0) return false;
          if ((event.target as HTMLElement).closest(".stash-zone")) return false;
          return true;
        })
        .on("zoom", function(ev){
          const tr = ev.transform;
          self.t = { k: tr.k, x: tr.x, y: tr.y };
          if (self.runtime) self.runtime.controllers.view.setTransform(self.t);
          self.$emit("transform", { ...self.t });
          self.$emit("zoom", { ...self.t });
        });

      d3.select(this.svgEl)
        .call(this.zoomBehavior as any)
        .on("dblclick.zoom", null); // explicit remove
    },
    observeResize(){
      if (!this.wrapEl) return;
      this.resizeObs = new ResizeObserver(entries => {
        for (const e of entries) {
          const cr = e.contentRect;
            this.size = { w: cr.width, h: cr.height };
            this.$emit("resized", this.size);
        }
      });
      this.resizeObs.observe(this.wrapEl);
    },
    zoomBy(factor:number, center?: { x:number; y:number }){
      if (!this.svgEl || !this.zoomBehavior) return;
      const sel = d3.select(this.svgEl);
      if (center) {
        const t = d3.zoomTransform(this.svgEl);
        const k = Math.min(this.maxZoom, Math.max(this.minZoom, t.k * factor));
        const p = [center.x, center.y];
        const newT = d3.zoomIdentity
          .translate(p[0], p[1])
          .scale(k)
          .translate(- (p[0] - t.x)/t.k, - (p[1] - t.y)/t.k);
        sel.call(this.zoomBehavior.transform as any, newT);
      } else {
        sel.call(this.zoomBehavior.scaleBy as any, factor);
      }
    },
    centerOn(x:number, y:number, k?:number){
      if (!this.svgEl || !this.zoomBehavior) return;
      const sel = d3.select(this.svgEl);
      const targetK = k ? Math.min(this.maxZoom, Math.max(this.minZoom, k)) : this.t.k;
      const newT = d3.zoomIdentity
        .translate(this.size.w/2 - x*targetK, this.size.h/2 - y*targetK)
        .scale(targetK);
      sel.call(this.zoomBehavior.transform as any, newT);
    },
    getSvg(){ return this.svgEl; },
    getSize(){ return this.size; },
    getTransform(){ return { ...this.t }; },
  },
  provide(){
    return {
      reactiveSvgCtx: {
        getSvg: () => this.getSvg(),
        getSize: () => this.getSize(),
        getTransform: () => this.getTransform(),
      }
    };
  }
});
</script>

<style scoped>
.rs-wrap {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0d142c radial-gradient(circle at 40% 35%, #142653 0%, #0d142c 70%);
  user-select: none;
  overflow: hidden;
}
.rs-svg { width:100%; height:100%; display:block; }
.world { vector-effect: non-scaling-stroke; }
.overlay { pointer-events:none; }
</style>
