<template>
  <g v-if="show" class="grid">
    <g v-for="x in vlines" :key="'vx'+x"><line :x1="x" :y1="minY" :x2="x" :y2="maxY" stroke="rgba(148,163,184,0.15)" stroke-width="1" /></g>
    <g v-for="y in hlines" :key="'hy'+y"><line :x1="minX" :y1="y" :x2="maxX" :y2="y" stroke="rgba(148,163,184,0.15)" stroke-width="1" /></g>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject, ref, onMounted, onBeforeUnmount } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "GridOverlay",
  props: {
    show: { type:Boolean, required:true },
    gridSize: { type:Number, required:true },
  },
  setup(){
    const runtime:any = inject(RUNTIME_KEY, null);
    const minX = ref(0), maxX = ref(0), minY = ref(0), maxY = ref(0);
    const vlines = ref<number[]>([]);
    const hlines = ref<number[]>([]);

    function recompute(){
      if (!runtime?.controllers?.view?.getSvgEl) return;
      const svg = runtime.controllers.view.getSvgEl();
      if (!svg) return;
      const r = svg.getBoundingClientRect();
      // sample four corners to world space
      const tl = runtime.controllers.view.worldFromClient(r.left, r.top);
      const br = runtime.controllers.view.worldFromClient(r.right, r.bottom);
      minX.value = Math.min(tl.x, br.x); maxX.value = Math.max(tl.x, br.x);
      minY.value = Math.min(tl.y, br.y); maxY.value = Math.max(tl.y, br.y);
    }

    let raf:number|undefined;
    function tick(){ recompute(); raf = requestAnimationFrame(tick); }

    onMounted(()=> { tick(); });
    onBeforeUnmount(()=> { if (raf) cancelAnimationFrame(raf); });

    return {
      minX, maxX, minY, maxY,
      vlines,
      hlines,
    };
  },
  watch: {
    show(){ this.updateLines(); },
    gridSize(){ this.updateLines(); },
    minX(){ this.updateLines(); },
    maxX(){ this.updateLines(); },
    minY(){ this.updateLines(); },
    maxY(){ this.updateLines(); },
  },
  methods:{
    updateLines(){
      if (!this.show) { this.vlines = []; this.hlines = []; return; }
      const s = this.gridSize || 16;
      const vx:number[] = [];
      const hx:number[] = [];
      const x0 = Math.floor(this.minX / s) * s;
      const y0 = Math.floor(this.minY / s) * s;
      for (let x = x0; x <= this.maxX; x += s) vx.push(x);
      for (let y = y0; y <= this.maxY; y += s) hx.push(y);
      this.vlines = vx; this.hlines = hx;
    }
  }
});
</script>

<style scoped>
.grid { pointer-events:none; }
</style>