<template>
  <NavigationWeb :doc="doc">
    <template #tracks>
      <TrackDef v-for="t in trackDefs" :key="t.id" v-bind="t" />
    </template>
  </NavigationWeb>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import NavigationWeb from '../components/NavigationWeb.vue';
import TrackDef from '../components/TrackDef.vue';
import { ringTrack } from '../patterns/tracks';
import type { NavDoc, NodeDoc, TrackDef as TDef } from '../types';

export default defineComponent({
  name: 'GmPage',
  components: { NavigationWeb, TrackDef },
  data() {
    const doc: NavDoc = reactive({
      version: 1,
      layout: { kind:'static', strategyId:'rings' },
      linkDefaults: { style:'radial', curve:0, outward:60, laneSpacing:12 },
      nodes: [ /* ... */ ]
    });
    // compute once; if you need responsive sizes, move this to a computed
    const trackDefs: TDef[] = [
      ringTrack('ring-0', 550, 340, 120),
      ringTrack('ring-1', 550, 340, 200),
      ringTrack('ring-2', 550, 340, 280),
    ];
    return { doc, trackDefs };
  },
});
</script>
