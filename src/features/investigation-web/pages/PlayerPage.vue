<template>
  <div class="player-page">
    <h2>Navigation Web</h2>
    <NavigationWeb :doc="doc" @node:click="onNodeClick" />
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import NavigationWeb from '../components/NavigationWeb.vue';
import type { NavDoc } from '../types';


export default defineComponent({
  name: 'PlayerPage',
  components: { NavigationWeb },
  data(){
    const doc = reactive<NavDoc>({
      version: 1,
      layout: { kind:'dynamic', strategyId:'force', options:{ charge:-120, linkDistance:90 } },
      linkDefaults: { style:'radial', curve:0, outward:40, laneSpacing:12 },
      nodes: [
        { id:'1', title:'One',   style:{ fill:'#10b981' }, links:['2','3'] },
        { id:'2', title:'Two',   style:{ fill:'#60a5fa' }, links:['4'] },
        { id:'3', title:'Three', style:{ fill:'#f59e0b' } },
        { id:'4', title:'Four',  style:{ fill:'#ef4444' }, links:['1'] },
      ],
    });
    return { doc };
  },
  methods: {
    onNodeClick(n: any){ console.log('Player clicked', n); }
  }
});
</script>

<style scoped>
.player-page {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.player-page > h2 {
  flex: 0;
}

.player-page > * {
  flex: 1;
}

</style>