<template>
  <g v-if="getNode(l.from) && getNode(l.to)">
    <line
      v-bind="lineBind(l.from, l.to, l.pad || 0)"
      class="hit"
      stroke="rgba(0,0,0,0)"
      :stroke-width="hitWidth"
      vector-effect="non-scaling-stroke"
      pointer-events="stroke"
      @pointerdown.stop="onLinkPointerDown(l.id)"
      @mouseenter="onEnter(l.id)"
      @mouseleave="onLeave()"
      @click.stop
    />
    <line
      v-bind="lineBind(l.from, l.to, l.pad || 0)"
      :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
      :style="{ color: l.color }"
      stroke="currentColor"
      :stroke-dasharray="dash(l.stroke)"
      stroke-width="2"
      stroke-opacity="0.9"
      vector-effect="non-scaling-stroke"
      :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useLinkCommon } from "../common";

export default defineComponent({
  name: "StraightLinkCanvas",
  props: { l: { type: Object, required: true } },
  setup() {
    const c = useLinkCommon();
    function dash(s: string) { return s === "dashed" ? "6 4" : (s === "dotted" ? "2 4" : undefined); }
    return { ...c, dash };
  }
});
</script>

<style scoped>
.hit { cursor: pointer; }
.hovered:not(.sel) { stroke-width:3; stroke-opacity:1; filter: drop-shadow(0 0 2px currentColor); }
.sel { stroke-width:3; filter: drop-shadow(0 0 3px currentColor); }
</style>