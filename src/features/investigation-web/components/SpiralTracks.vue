<script lang="ts">
import { defineComponent } from 'vue';
import TrackDef from './TrackDef.vue';
import type { TrackDef as TDef } from '../types';
import { spiralTrackAt, segmentTrack } from '../patterns/tracks';

export default defineComponent({
  name: 'SpiralTracks',
  components: { TrackDef },

  props: {
    // Canvas / fit
    width : { type: Number, default: 1200 },
    height: { type: Number, default: 700 },
    margin: { type: Number, default: 60 },
    cx: { type: Number, default: NaN },
    cy: { type: Number, default: NaN },

    // Spiral system
    spirals: { type: Number, default: 3 },
    startAngles: { type: Array as () => number[] | undefined, default: undefined },
    directions:  { type: Array as () => (1|-1)[] | undefined, default: undefined },
    turns: { type: Number, default: 1 },
    r0: { type: Number, default: 30 },
    k:  { type: Number, default: NaN },        // growth; if NaN and fit=true we autocompute
    fit: { type: Boolean, default: true },

    // Segmenting (names or count)
    segments: { type: [Array, Number] as unknown as () => string[] | number, default: () => ['deep','mid','shallow'] },

    // Boundaries (between wedges)
    boundary: {
      type: Object as () => {
        enabled?: boolean,
        directions?: (1|-1)[] | (1|-1),
        segmented?: boolean,
        startAngles?: number[]
      },
      default: () => ({ enabled:true, segmented:true })
    },

    // Optional id namespace
    ns: { type: String, default: '' }
  },

  computed: {
    _cx(): number { return Number.isFinite(this.cx) ? this.cx : this.width/2; },
    _cy(): number { return Number.isFinite(this.cy) ? this.cy : this.height/2; },

    segNames(): string[] {
      if (Array.isArray(this.segments)) return this.segments as string[];
      const n = Math.max(1, this.segments as number);
      return Array.from({length:n}, (_,i)=> `s${i}`);
    },

    segRanges(): Array<[number,number]> {
      const n = this.segNames.length;
      return Array.from({length:n}, (_,i)=> [i/n, (i+1)/n] as [number,number]);
    },

    kVal(): number {
      if (!this.fit && Number.isFinite(this.k)) return this.k;
      const Rmax = Math.min(this.width, this.height)/2 - this.margin;
      const delta = this.turns * 2*Math.PI || 1;
      return (Rmax - this.r0) / delta;
    },

    spiralStarts(): number[] {
      if (this.startAngles && this.startAngles.length) return this.startAngles;
      const base = -Math.PI/2; // top
      return Array.from({length:this.spirals}, (_,i)=> base + (i * 2*Math.PI/this.spirals));
    },

    spiralDirs(): (1|-1)[] {
      if (this.directions && this.directions.length) return this.directions as (1|-1)[];
      return Array.from({length:this.spirals}, ()=> +1 as 1);
    },

    boundaryCenters(): number[] {
      if (!this.boundary?.enabled) return [];
      if (this.boundary?.startAngles?.length) return this.boundary.startAngles;

      // midpoints between adjacent spiral starts (shortest arc)
      const s = this.spiralStarts;
      const mids: number[] = [];
      for (let i=0;i<s.length;i++){
        const a = s[i], b = s[(i+1)%s.length];
        let d = b - a; while(d> Math.PI) d -= 2*Math.PI; while(d<-Math.PI) d += 2*Math.PI;
        mids.push(a + d/2);
      }
      return mids;
    },

    boundaryDirs(): (1|-1)[] {
      const inProp = this.boundary?.directions;
      if (Array.isArray(inProp)) return inProp as (1|-1)[];
      if (inProp === 1 || inProp === -1) return Array.from({length: this.boundaryCenters.length}, ()=> inProp);
      return Array.from({length: this.boundaryCenters.length}, ()=> -1 as -1); // default reverse
    },

    primaryTracks(): TDef[] {
      const out: TDef[] = [];
      this.spiralStarts.forEach((start, i)=>{
        const dir = this.spiralDirs[Math.min(i, this.spiralDirs.length-1)] ?? +1;
        const base = spiralTrackAt(this.idOf(`spiral-${i}`), this._cx, this._cy, this.r0, this.kVal, this.turns, start, dir);
        out.push(base);
        this.segNames.forEach((name, sIdx)=>{
          const [f0,f1] = this.segRanges[sIdx];
          out.push(segmentTrack(this.idOf(`spiral-${i}-${name}`), base, f0, f1));
        });
      });
      return out;
    },

    boundaryTracks(): TDef[] {
      if (!this.boundary?.enabled) return [];
      const out: TDef[] = [];
      this.boundaryCenters.forEach((start, i)=>{
        const dir = this.boundaryDirs[Math.min(i, this.boundaryDirs.length-1)] ?? -1 as -1;
        const base = spiralTrackAt(this.idOf(`boundary-${i}`), this._cx, this._cy, this.r0, this.kVal, this.turns, start, dir);
        out.push(base);
        if (this.boundary?.segmented !== false){
          this.segNames.forEach((name, sIdx)=>{
            const [f0,f1] = this.segRanges[sIdx];
            out.push(segmentTrack(this.idOf(`boundary-${i}-${name}`), base, f0, f1));
          });
        }
      });
      return out;
    },

    allTracks(): TDef[] {
      return [...this.primaryTracks, ...this.boundaryTracks];
    }
  },

  methods: {
    idOf(raw: string){ return this.ns ? `${this.ns}${raw}` : raw; }
  }
});
</script>

<template>
  <!-- Headless: these register themselves with <NavigationWeb/> via TracksKey -->
  <TrackDef
    v-for="t in allTracks"
    :key="t.id"
    :id="t.id"
    :eval="t.eval"
    :labelAt="t.labelAt"
  />
</template>
