<template>
  <div class="player-page">
    <h2>Three Virtues — Navigation Web</h2>

    <NavigationWeb
      :doc="doc"
      :width="1200"
      :height="700"
      :assign="assign"
      @node:click="onNodeClick"
    >
      <template #tracks>
        <SpiralTracks
          :width="1200" :height="700" :margin="70"
          :spirals="3"
          :turns="1"
          :r0="30"
          :fit="true"
          :startAngles="starts"
          :directions="[+1,+1,+1]"
          :segments="['deep','mid','shallow']"
          :boundary="{ enabled:true, segmented:true, directions:-1 }"
          ns="tv-"
        />
      </template>
    </NavigationWeb>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import NavigationWeb from '../components/NavigationWeb.vue';
import SpiralTracks from '../components/SpiralTracks.vue';
import type { NavDoc } from '../types';
import { makeVirtueTierAssigner } from '../patterns/assigners'; // if you added the helper from before

export default defineComponent({
  name: 'PlayerPage',
  components: { NavigationWeb, SpiralTracks },
  data(){
    // same angles you used in your raw HTML prototype (E, H, R)
    const starts = [ -Math.PI/6, Math.PI/2, -5*Math.PI/6 ];

    const doc = reactive<NavDoc>({
      version: 1,
      layout: { kind:'static', strategyId:'three-spirals' },
      linkDefaults: { style:'radial', curve:0, outward:60, laneSpacing:12 },
      nodes: [
        { id:'farm-pacts', title:'Farm Pacts', virtue:'Endurance',  tier:'shallow',  links:['pack-tactics'] },
        { id:'pack-tactics', title:'Pack Tactics', virtue:'Endurance', tier:'mid',    links:['merged-identity'] },
        { id:'merged-identity', title:'Merged Identity', virtue:'Endurance', tier:'deep', links:['painspren-nirvana'] },

        { id:'burning-doll', title:'Burning Doll', virtue:'Harmony', tier:'shallow' },
        { id:'kianna-dolls', title:'Kianna’s Dolls', virtue:'Harmony', tier:'deep', links:['amalgam-hoard'] },

        { id:'shared-song', title:'A Shared Song', virtue:'Remembrance', tier:'shallow' },
        { id:'rewritten-song', title:'Rewritten Song', virtue:'Remembrance', tier:'deep', links:['culleys-will'] },

        // “boundary” trio
        { id:'painspren-nirvana', title:'Painspren Nirvana', virtue:'Endurance',   tier:'deep', boundary:0 },
        { id:'amalgam-hoard',     title:'Amalgamation’s Hoard', virtue:'Harmony',  tier:'deep', boundary:1 },
        { id:'culleys-will',      title:"Culley’s Will", virtue:'Remembrance',     tier:'deep', boundary:2 },
      ]
    });

    // optional: route virtue/tier (+ boundary) to the right segment track id
    const assign = makeVirtueTierAssigner({
      order: ['Endurance','Harmony','Remembrance'],
      segmentNames: ['deep','mid','shallow'],
      preferBoundary: true,
      ns: 'tv-'
    });

    return {
      doc, starts, assign
    };
  },
  methods: {
    onNodeClick(n: any){ console.log('Player clicked', n); }
  }
});
</script>
