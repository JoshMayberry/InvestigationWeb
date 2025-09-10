<template>
  <div class="block">
    <div class="block-title sm">Spline</div>
    <label class="inline">
      <span>Tension</span>
      <input class="rng" type="range" min="0" max="1" step="0.01" :value="tension" @input="set('tension', num(($event.target as HTMLInputElement).value))" />
      <input class="num" type="number" min="0" max="1" step="0.01" :value="tension" @change="set('tension', num(($event.target as HTMLInputElement).value))" />
    </label>
    <div class="row">
      <button class="secondary" @click="addCtrl()">+ Add control</button>
      <button class="secondary" @click="clearCtrls()" :disabled="(ctrls.length||0)===0">Clear</button>
      <span class="muted small">Controls: {{ ctrls.length }}</span>
    </div>
    <div class="ctrl-list">
      <div class="ctrl" v-for="(c,i) in ctrls" :key="i">
        <label class="inline">
          <span>Pos %</span>
          <input class="rng" type="range" min="0" max="100" :value="c.t" @input="setCtrl(i,'t', num(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="0" max="100" :value="c.t" @change="setCtrl(i,'t', num(($event.target as HTMLInputElement).value))" />
        </label>
        <label class="inline">
          <span>Offset %</span>
          <input class="rng" type="range" min="-100" max="100" :value="c.off" @input="setCtrl(i,'off', num(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="-100" max="100" :value="c.off" @change="setCtrl(i,'off', num(($event.target as HTMLInputElement).value))" />
        </label>
        <button class="danger small" @click="removeCtrl(i)">Remove</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";
export default defineComponent({
  name:"SplineEditor",
  props:{ mode:{type:String,required:true}, link:{type:Object,required:false}, track:{type:Object,required:false} },
  data(){ return { store: useInvestigationWebStore(), runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    isTrack(): boolean { return !!this.track; },
    targetId(): string | null { return this.isTrack ? (this.track as any)?.id : (this.link as any)?.id || null; },
    ctrlDraft(): any[] { return this.isTrack ? (this.store.trackDraft.controls??[]) : (this.store.linkDraft.controls??[]); },
    ctrls(): any[] {
      if (this.mode==='draft') return this.ctrlDraft;
      if (!this.targetId) return [];
      return this.isTrack ? ((this.track as any).controls||[]) : ((this.link as any).controls||[]);
    },
    tension(): number {
      if (this.mode==='draft') return this.isTrack ? (this.store.trackDraft.tension ?? 0.25) : (this.store.linkDraft.tension ?? 0.25);
      return this.isTrack ? ((this.track as any).tension ?? 0.25): ((this.link as any).tension ?? 0.25);
    },
    undo(): any { return this.runtime?.controllers?.undo; },
  },
  methods:{
    num(v:any){ return Number(v); },
    setDraft(patch:any){
      if (this.isTrack) this.store.setTrackDraft(patch); else this.store.setLinkDraft(patch);
    },
    patchItem(id:string, patch:any){
      if (this.isTrack) this.store.patchTrack(id, patch); else this.store.patchLink(id, patch);
    },
    set(key:'tension', val:number){
      if (this.mode==='draft'){ this.setDraft({ [key]: val }); return; }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = { [key]: this.tension };
      const after = { [key]: val };
      this.undo.push({ label:`spline-${key}`, _coalesceKey:`spline:${id}:${key}`, before, after,
        do:()=> this.patchItem(id, after), undo:()=> this.patchItem(id, before) });
      this.patchItem(id, after);
    },
    addCtrl(){
      if (this.mode==='draft'){
        const arr = this.ctrlDraft.slice(); arr.push({ t:50, off:0 }); this.setDraft({ controls: arr }); return;
      }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = this.ctrls.slice();
      const after = [...before, { t:50, off:0 }];
      this.undo.push({ label:"spline-add-ctrl", before:{ controls: before }, after:{ controls: after },
        do:()=> this.patchItem(id, { controls: after }),
        undo:()=> this.patchItem(id, { controls: before }) });
      this.patchItem(id, { controls: after });
    },
    removeCtrl(i:number){
      if (this.mode==='draft'){
        const arr = this.ctrlDraft.slice(); arr.splice(i,1); this.setDraft({ controls: arr }); return;
      }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = this.ctrls.slice();
      const after = before.slice(); after.splice(i,1);
      this.undo.push({ label:"spline-remove-ctrl", before:{ controls: before }, after:{ controls: after },
        do:()=> this.patchItem(id, { controls: after }),
        undo:()=> this.patchItem(id, { controls: before }) });
      this.patchItem(id, { controls: after });
    },
    clearCtrls(){
      if (this.mode==='draft'){ this.setDraft({ controls: [] }); return; }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = this.ctrls.slice();
      const after:any[] = [];
      this.undo.push({ label:"spline-clear-ctrls", before:{ controls: before }, after:{ controls: after },
        do:()=> this.patchItem(id, { controls: after }),
        undo:()=> this.patchItem(id, { controls: before }) });
      this.patchItem(id, { controls: after });
    },
    setCtrl(i:number, key:'t'|'off', v:number){
      if (this.mode==='draft'){
        const arr = this.ctrlDraft.slice();
        const cur = arr[i] ?? { t:50, off:0 };
        arr[i] = { ...cur, [key]: v };
        this.setDraft({ controls: arr });
        return;
      }
      if (!this.targetId) return;
      const id = this.targetId;
      const before = this.ctrls.slice();
      const after = before.slice();
      after[i] = { ...after[i], [key]: v };
      this.undo.push({ label:"spline-edit-ctrl", _coalesceKey:`spline:${id}:${i}:${key}`, before:{ controls: before }, after:{ controls: after },
        do:()=> this.patchItem(id, { controls: after }),
        undo:()=> this.patchItem(id, { controls: before }) });
      this.patchItem(id, { controls: after });
    },
  }
});
</script>

<style scoped>
.block { display:flex; flex-direction:column; gap:8px; }
.block-title.sm { margin-top:2px; font-size:12px; color: var(--muted); }
.row { display:flex; gap:8px; align-items:center; }
.ctrl-list { display:flex; flex-direction:column; gap:8px; }
.ctrl { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:6px; border:1px solid rgba(255,255,255,0.08); border-radius:8px; }
.inline { display:flex; align-items:center; gap:8px; justify-content:space-between; flex-wrap:wrap; }
.rng { flex:1 1 160px; min-width:140px; }
.num { width:90px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.2); color:var(--text); padding:4px 6px; border-radius:6px; font-size:12px; }
.muted.small { font-size:11px; color: var(--muted); }
</style>