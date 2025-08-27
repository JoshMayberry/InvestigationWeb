<template>
  <div class="player-page">
    <h2>Three Virtues — Navigation Web</h2>

    <NavigationWeb :doc="doc" :width="1200" :height="700" @node:click="onNodeClick">
      <template #tracks>
        <!-- Virtue spiral bases -->
        <TrackDef v-bind="spiralE" />
        <TrackDef v-bind="spiralH" />
        <TrackDef v-bind="spiralR" />

        <!-- Virtue segments -->
        <TrackDef v-bind="seg('spiral-E-deep'   , spiralE, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('spiral-E-mid'    , spiralE, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('spiral-E-shallow', spiralE, ranges.shal[0], ranges.shal[1])" />

        <TrackDef v-bind="seg('spiral-H-deep'   , spiralH, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('spiral-H-mid'    , spiralH, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('spiral-H-shallow', spiralH, ranges.shal[0], ranges.shal[1])" />

        <TrackDef v-bind="seg('spiral-R-deep'   , spiralR, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('spiral-R-mid'    , spiralR, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('spiral-R-shallow', spiralR, ranges.shal[0], ranges.shal[1])" />

        <!-- Boundary bases (reverse direction) -->
        <TrackDef v-bind="boundary0" />
        <TrackDef v-bind="boundary1" />
        <TrackDef v-bind="boundary2" />

        <!-- Boundary segments -->
        <TrackDef v-bind="seg('boundary-0-deep'   , boundary0, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('boundary-0-mid'    , boundary0, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('boundary-0-shallow', boundary0, ranges.shal[0], ranges.shal[1])" />

        <TrackDef v-bind="seg('boundary-1-deep'   , boundary1, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('boundary-1-mid'    , boundary1, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('boundary-1-shallow', boundary1, ranges.shal[0], ranges.shal[1])" />

        <TrackDef v-bind="seg('boundary-2-deep'   , boundary2, ranges.deep[0], ranges.deep[1])" />
        <TrackDef v-bind="seg('boundary-2-mid'    , boundary2, ranges.mid[0] , ranges.mid[1] )" />
        <TrackDef v-bind="seg('boundary-2-shallow', boundary2, ranges.shal[0], ranges.shal[1])" />
      </template>
    </NavigationWeb>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive, computed } from 'vue';
import NavigationWeb from '../components/NavigationWeb.vue';
import TrackDef from '../components/TrackDef.vue';
import type { NavDoc, NodeWithSlot } from '../types';
import { spiralTrackAt, segmentTrack } from '../patterns/tracks';

export default defineComponent({
  name: 'PlayerPage',
  components: { NavigationWeb, TrackDef },
  setup(){
    // ----- Geometry (configurable) -----
    const width = 1200, height = 700;
    const cx = width/2, cy = height/2;
    const r0 = 30;          // inner radius at "center"
    const k  = 55;          // spiral growth factor
    const turns = 1;

    // Same angles as your prototype:
    const startAngles = {
      E: -Math.PI/6,       // Endurance
      H:  Math.PI/2,       // Harmony
      R: -5*Math.PI/6,     // Remembrance
    };
    // Centers of the 3 wedges (used for boundary spirals)
    const boundaryAngles = [
      -Math.PI/2,          // between E and H
       Math.PI/6,          // between H and R
       5*Math.PI/6,        // between R and E
    ];

    // Segment ranges (deep/mid/shallow) across one full turn
    const ranges = {
      deep: [0/3, 1/3],
      mid : [1/3, 2/3],
      shal: [2/3, 1  ],
    };

    // Factories
    const spiralE    = computed(()=> spiralTrackAt('spiral-E', cx, cy, r0, k, turns, startAngles.E, +1));
    const spiralH    = computed(()=> spiralTrackAt('spiral-H', cx, cy, r0, k, turns, startAngles.H, +1));
    const spiralR    = computed(()=> spiralTrackAt('spiral-R', cx, cy, r0, k, turns, startAngles.R, +1));
    const boundary0  = computed(()=> spiralTrackAt('boundary-0', cx, cy, r0, k, turns, boundaryAngles[0], -1));
    const boundary1  = computed(()=> spiralTrackAt('boundary-1', cx, cy, r0, k, turns, boundaryAngles[1], -1));
    const boundary2  = computed(()=> spiralTrackAt('boundary-2', cx, cy, r0, k, turns, boundaryAngles[2], -1));
    const seg = (id:string, base:any, f0:number, f1:number)=> segmentTrack(id, base.value, f0, f1);

    // ----- Doc: full-blown static layout config -----
    const doc = reactive<NavDoc>({
      version: 1,
      layout: {
        kind: 'static',
        strategyId: 'three-spirals',
        options: {
          center: { cx, cy, width, height },
          spiral: { r0, k, turns, startAngles, boundaryAngles },
          tiers : { center: 0, deep: [0,1/3], mid: [1/3,2/3], shallow: [2/3,1] },
          staging: {
            enabled: true,
            dirs: ['N','E','S','W'],
            lineLen: Math.min(width, height) * 0.6,
            margin: 70,
            gap: 60,
            seedLanesPerDir: 1
          },
          labels: {
            virtues: { E: 'Endurance', H: 'Harmony', R: 'Remembrance' },
            showBoundaryLabels: true
          }
        }
      },
      linkDefaults: { style:'radial', curve:0, outward:60, laneSpacing:12 },
      nodes: [
        // --- Boundary (fixed transitions) ---
        { id:'painspren-nirvana',   title:'Painspren Nirvana',   style:{}, data:{virtue:'Endurance', tier:'center'},   slot:{ trackId:'boundary-0-deep', order:2 } },
        { id:'culleys-will',        title:"Culley’s Will",       style:{}, data:{virtue:'Remembrance', tier:'center'}, slot:{ trackId:'boundary-2-deep', order:1 } },
        { id:'amalgam-hoard',       title:'Amalgamation’s Hoard',style:{}, data:{virtue:'Harmony', tier:'center'},     slot:{ trackId:'boundary-1-deep', order:3 } },

        // --- Endurance spiral segments ---
        { id:'farm-pacts',          title:'Farm Pacts',          style:{}, data:{virtue:'Endurance', tier:'shallow'},  slot:{ trackId:'spiral-E-shallow', order:2 }, links:['pack-tactics'] },
        { id:'pack-tactics',        title:'Pack Tactics',        style:{}, data:{virtue:'Endurance', tier:'mid'},      slot:{ trackId:'spiral-E-mid',     order:1 }, links:['merged-identity'] },
        { id:'merged-identity',     title:'Merged Identity',     style:{}, data:{virtue:'Endurance', tier:'deep'},     slot:{ trackId:'spiral-E-deep',    order:2 }, links:['painspren-nirvana'] },

        // --- Harmony spiral segments ---
        { id:'burning-doll',        title:'Burning Doll',        style:{}, data:{virtue:'Harmony', tier:'shallow'},    slot:{ trackId:'spiral-H-shallow', order:1 } },
        { id:'abandoned-doll',      title:'Abandoned Doll',      style:{}, data:{virtue:'Harmony', tier:'mid'},        slot:{ trackId:'spiral-H-mid',     order:2 } },
        { id:'kianna-dolls',        title:"Kianna’s Dolls",      style:{}, data:{virtue:'Harmony', tier:'deep'},       slot:{ trackId:'spiral-H-deep',    order:2 }, links:['amalgam-hoard'] },

        // --- Remembrance spiral segments ---
        { id:'shared-song',         title:'A Shared Song',       style:{}, data:{virtue:'Remembrance', tier:'shallow'},slot:{ trackId:'spiral-R-shallow', order:1 } },
        { id:'rhythm-grasping',     title:'Rhythm of Grasping',  style:{}, data:{virtue:'Remembrance', tier:'mid'},    slot:{ trackId:'spiral-R-mid',     order:2 } },
        { id:'rewritten-song',      title:'Rewritten Song',      style:{}, data:{virtue:'Remembrance', tier:'deep'},   slot:{ trackId:'spiral-R-deep',    order:1 }, links:['culleys-will'] },
      ] as unknown as NodeWithSlot[],  // slot is optional; included for clarity here
    });

    function onNodeClick(n:any){ console.log('Player clicked', n); }

    return {
      doc, onNodeClick,
      spiralE, spiralH, spiralR,
      boundary0, boundary1, boundary2,
      seg, ranges
    };
  }
});
</script>

<style scoped>
.player-page{ display:flex; flex-direction:column; gap:12px; }
h2{ margin:0; }
</style>
