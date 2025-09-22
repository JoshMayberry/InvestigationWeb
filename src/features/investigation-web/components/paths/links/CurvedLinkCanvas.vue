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
      @click.stop
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
import { curvedPath } from "../calculations/curvedPath"

export default defineComponent({
  name: "CurvedLinkCanvas",
  props: { l: { type: Object, required: true } },
  setup(props){
    const c = useLinkCommon();
    const d = computed(()=> curvedPath(props.l, c.getNode));
    function dash(s: string) { return s === "dashed" ? "6 4" : (s === "dotted" ? "2 4" : undefined); }
    return { ...c, d, dash };
  }
});
</script>

<style scoped>
.hit { cursor: pointer; }
.hovered:not(.sel) { stroke-width:3; stroke-opacity:1; filter: drop-shadow(0 0 2px currentColor); }
.sel { stroke-width:3; filter: drop-shadow(0 0 3px currentColor); }
</style>