<template>
  <div class="block">
    <div class="block-title sm">Bezier</div>
    <label class="row">
      <span>Symmetric</span>
      <input type="checkbox" :checked="beSym" @change="set('symmetric', bool(($event.target as HTMLInputElement).checked))" />
    </label>
    <div class="grid-auto">
      <label class="inline">
        <span>C1 Pos %</span>
        <input class="rng" type="range" min="0" max="100" :value="c1.t" @input="setC(1,'t', num(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" min="0" max="100" :value="c1.t" @change="setC(1,'t', num(($event.target as HTMLInputElement).value))" />
      </label>
      <label class="inline">
        <span>C1 Offset %</span>
        <input class="rng" type="range" min="-100" max="100" :value="c1.off" @input="setC(1,'off', num(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" min="-100" max="100" :value="c1.off" @change="setC(1,'off', num(($event.target as HTMLInputElement).value))" />
      </label>

      <template v-if="!beSym">
        <label class="inline">
          <span>C2 Pos %</span>
          <input class="rng" type="range" min="0" max="100" :value="c2.t" @input="setC(2,'t', num(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="0" max="100" :value="c2.t" @change="setC(2,'t', num(($event.target as HTMLInputElement).value))" />
        </label>
        <label class="inline">
          <span>C2 Offset %</span>
          <input class="rng" type="range" min="-100" max="100" :value="c2.off" @input="setC(2,'off', num(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="-100" max="100" :value="c2.off" @change="setC(2,'off', num(($event.target as HTMLInputElement).value))" />
        </label>
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";
export default defineComponent({
  name: "BezierEditor",
  props: { mode:{type:String,required:true}, link:{type:Object,required:false}, track:{type:Object,required:false} },
  data(){ return { store: useInvestigationWebStore(), runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    isTrack(): boolean { return !!this.track; },
    targetId(): string | null { return this.isTrack ? (this.track as any)?.id : (this.link as any)?.id || null; },
    beSym(): boolean {
      if (this.mode==='draft') return this.isTrack ? !!this.store.trackDraft.symmetric : !!this.store.linkDraft.symmetric;
      return !!(this.isTrack ? (this.track as any)?.symmetric : (this.link as any)?.symmetric);
    },
    c1(): any {
      const fallback = { t:25, off:30 };
      if (this.mode==='draft') return (this.isTrack ? this.store.trackDraft.c1 : this.store.linkDraft.c1) ?? fallback;
      return (this.isTrack ? (this.track as any)?.c1 : (this.link as any)?.c1) ?? fallback;
    },
    c2(): any {
      const fallback = { t:75, off:-30 };
      if (this.mode==='draft') return (this.isTrack ? this.store.trackDraft.c2 : this.store.linkDraft.c2) ?? fallback;
      return (this.isTrack ? (this.track as any)?.c2 : (this.link as any)?.c2) ?? fallback;
    },
    undo(): any { return this.runtime?.controllers?.undo; },
  },
  methods:{
    num(v:any){ return Number(v); },
    bool(v:any){ return !!v; },
    setDraft(patch:any){
      if (this.isTrack) this.store.setTrackDraft(patch); else this.store.setLinkDraft(patch);
    },
    patchItem(id:string, patch:any){
      if (this.isTrack) this.store.patchTrack(id, patch); else this.store.patchLink(id, patch);
    },
    set(key:'symmetric', val:any){
      if (this.mode==='draft'){ this.setDraft({ [key]: val }); return; }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = { [key]: this.beSym };
      const after = { [key]: val };
      this.undo.push({ label:`bezier-${key}`, _coalesceKey:`bezier:${id}:${key}`, before, after,
        do:()=> this.patchItem(id, after), undo:()=> this.patchItem(id, before) });
      this.patchItem(id, after);
    },
    setC(which:1|2, key:'t'|'off', val:number){
      if (this.mode==='draft'){
        const prop = which===1 ? 'c1':'c2';
        const base = which===1 ? this.c1 : this.c2;
        this.setDraft({ [prop]: { ...base, [key]: val } });
        return;
      }
      if (!this.targetId) return;
      const id = this.targetId;
      const prop = which===1 ? 'c1':'c2';
      const cur = which===1 ? this.c1 : this.c2;
      const next = { ...cur, [key]: val };
      this.undo.push({
        label:`bezier-${prop}-${key}`,
        _coalesceKey:`bezier:${id}:${prop}:${key}`,
        before:{ [prop]: cur }, after:{ [prop]: next },
        do: ()=> this.patchItem(id, { [prop]: next }),
        undo: ()=> this.patchItem(id, { [prop]: cur })
      });
      this.patchItem(id, { [prop]: next });
    },
  }
});
</script>

<style scoped>
.block { display:flex; flex-direction:column; gap:8px; }
.block-title.sm { margin-top:2px; font-size:12px; color: var(--muted); }
.row { display:flex; gap:8px; align-items:center; }
.grid-auto { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; align-items:center; }
.inline { display:flex; align-items:center; gap:8px; justify-content:space-between; flex-wrap:wrap; }
.rng { flex:1 1 160px; min-width:140px; }
.num { width:90px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:var(--text); padding:4px 6px; border-radius:6px; font-size:12px; }
</style>