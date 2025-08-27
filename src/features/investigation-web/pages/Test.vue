<script setup lang="ts">
import NavigationWeb from '../components/NavigationWeb.vue';
import TrackDef from '../components/TrackDef.vue';
import { ringTrack, spiralTrack } from '../patterns/tracks';
import type { NavDoc } from '../types';

const doc: NavDoc = {
  version: 1,
  layout: { kind: 'static', strategyId: 'spiral-boundaries' },
  linkDefaults: { style:'radial', curve:0, outward:60, laneSpacing:12 },
  nodes: [
    { id:'a', title:'A', tags:['Endurance'] },
    { id:'b', title:'B', tags:['Harmony'] },
    { id:'c', title:'C', links:['a'] },
  ]
};
const center = { cx: 600, cy: 350 };
</script>

<template>
  <NavigationWeb :doc="doc" :width="1200" :height="700">
    <template #tracks>
      <TrackDef v-bind="ringTrack('ring-1', center.cx, center.cy, 180)" />
      <TrackDef v-bind="spiralTrack('spiral-1', center.cx, center.cy, 40, 55, 1)" />
      <TrackDef v-bind="ringTrack('ring-2', center.cx, center.cy, 300)" />
    </template>
  </NavigationWeb>
</template>