<template>
  <g class="node-track-group">
    <NodeTrack
      v-for="t in tracks"
      :key="t.id"
      :x1="t.eval(0).x"
      :y1="t.eval(0).y"
      :x2="t.eval(1).x"
      :y2="t.eval(1).y"
      :color="t.color || defaultColor"
      :stroke-width="strokeWidth"
      :stroke-opacity="strokeOpacity"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import NodeTrack from './NodeTrack.vue';

type Point = { x:number; y:number };
type CompiledTrack = {
  id: string;
  color?: string;
  eval: (t:number)=>Point;
};

export default defineComponent({
  name: 'TrackGroup',
  components: { NodeTrack },
  props: {
    tracks: { type: Array as PropType<CompiledTrack[]>, default: () => [] },
    defaultColor: { type: String, default: '#7aa2ff' },
    strokeWidth: { type: Number, default: 2 },
    strokeOpacity: { type: Number, default: 0.9 },
  },
});
</script>
