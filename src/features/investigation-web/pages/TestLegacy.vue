<script lang="ts">
import { defineComponent } from 'vue';
import NavigationWeb from '../components/NavigationWeb.vue';
import SpiralTracks from '../components/SpiralTracks.vue';
import { importLegacyV4 } from '../utils/legacy';

import legacy from '@app/../poc/three-virtues-web (8).json';

export default defineComponent({
  name: 'PlayerPage',
  components: { NavigationWeb, SpiralTracks },
  data(){
    const starts = [ -Math.PI/6, Math.PI/2, -5*Math.PI/6 ]; // E, H, R
    const { doc, assign } = importLegacyV4(legacy, { ns:'tv-' });

    // force the exact link defaults used in the expected screenshot
    doc.linkDefaults = { style:'straight', outward:-12, curve:6, laneSpacing:14 };

    return { doc, starts, assign };
  },
  methods: { onNodeClick(n:any){ console.log('clicked', n); } }
});
</script>

<template>
  <div class="player-page">
    <h2>Three Virtues — Navigation Web</h2>
    <NavigationWeb
      :doc="doc" :width="1200" :height="700" :assign="assign"
      @node:click="onNodeClick"
    >
      <template #tracks>
        <SpiralTracks
          :width="1200" :height="700" :margin="70"
          :spirals="3" :turns="1" :r0="30" :fit="true"
          :startAngles="starts" :directions="[+1,+1,+1]"
          :segments="['deep','mid','shallow']"
          :boundary="{ enabled:true, segmented:true, directions:-1 }"
          ns="tv-"
        />
      </template>
    </NavigationWeb>
  </div>
</template>
