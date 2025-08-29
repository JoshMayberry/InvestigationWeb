<template>
  <g class="node-track">
    <line
      :x1="x1" :y1="y1"
      :x2="x2" :y2="y2"
      :stroke="color"
      :stroke-width="strokeWidth"
      :stroke-opacity="strokeOpacity"
      stroke-linecap="round"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "NodeTrack",
  props: {
    x1: { type: Number, required: true },
    y1: { type: Number, required: true },
    x2: { type: Number, required: true },
    y2: { type: Number, required: true },
    color: { type: String, default: "#7aa2ff" },
    strokeWidth: { type: Number, default: 2 },
    strokeOpacity: { type: Number, default: 0.9 },
  },
});
</script>
