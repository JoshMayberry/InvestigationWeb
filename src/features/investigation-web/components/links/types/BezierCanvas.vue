<template>
  <g v-if="getNode(l.from) && getNode(l.to)">
    <path
      v-if="d"
      :d="d"
      class="hit"
      stroke="rgba(0,0,0,0)"
      fill="none"
      :stroke-width="hitWidth"
      vector-effect="non-scaling-stroke"
      pointer-events="stroke"
      @pointerdown.stop="onLinkPointerDown(l.id)"
      @mouseenter="onEnter(l.id)"
      @mouseleave="onLeave()"
    />
    <path
      v-if="d"
      :d="d"
      :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
      :style="{ color: l.color }"
      stroke="currentColor"
      fill="none"
      :stroke-dasharray="dash(l.stroke)"
      stroke-width="2"
      stroke-opacity="0.9"
      vector-effect="non-scaling-stroke"
      :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useLinkCommon } from "../common";

export default defineComponent({
  name: "BezierCanvas",
  props: { l: { type: Object, required: true } },
  setup(props){
    const c = useLinkCommon();
    const d = computed(()=> bezierPath(props.l, c.getNode));
    function dash(s: string) { return s === "dashed" ? "6 4" : (s === "dotted" ? "2 4" : undefined); }
    return { ...c, d, dash };
  }
});

function bezierPath(l:any, getNode:(id:string)=>any): string | null {
  const a = getNode(l.from), b = getNode(l.to);
  if (!a || !b) return null;
  const pad = l.pad || 0;
  const dx = b.x - a.x, dy = b.y - a.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist, uy = dy / dist;
  const nx = -uy, ny = ux;
  const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
  const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
  const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;
  let c1 = l.c1 || { t:25, off:30 }, c2 = l.c2 || { t:75, off:-30 };
  if (l.symmetric) { c2 = { t: 100 - c1.t, off: -c1.off }; }
  const clamp = (v:number, lo:number, hi:number)=> Math.min(hi, Math.max(lo, v));
  const t1 = clamp(c1.t, 0, 100)/100, o1 = clamp(c1.off, -100, 100)/100;
  const t2 = clamp(c2.t, 0, 100)/100, o2 = clamp(c2.off, -100, 100)/100;
  const p1 = { x: s.x + ux * (t1*segLen) + nx * (o1*segLen), y: s.y + uy * (t1*segLen) + ny * (o1*segLen) };
  const p2 = { x: s.x + ux * (t2*segLen) + nx * (o2*segLen), y: s.y + uy * (t2*segLen) + ny * (o2*segLen) };
  return `M ${s.x} ${s.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${e.x} ${e.y}`;
}
</script>

<style scoped>
.hit { cursor: pointer; }
</style>