<template>
  <div class="block">
    <div class="block-title sm">Curved midpoints</div>
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
  name: "CurvedEditor",
  props: { mode: { type:String, required:true }, link: { type:Object, required:false } },
  data(){ return { store: useInvestigationWebStore(), runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    ctrls(): {t:number; off:number}[] {
      if (this.mode!=='selected' || !this.link) return [];
      return (this.link as any).midControls || [];
    },
    undo(): any { return this.runtime?.controllers?.undo; },
  },
  methods:{
    num(v:any){ return Number(v); },
    addCtrl(){
      if (this.mode==='draft'){
        const arr = (this.store.linkDraft.midControls ?? []).slice();
        arr.push({ t: 50, off: 25 });
        this.store.setLinkDraft({ midControls: arr });
        return;
      }
      if (!this.link) return;
      const id = (this.link as any).id;
      const before = ((this.link as any).midControls || []).slice();
      const after = [...before, { t: 50, off: 25 }];
      this.undo.push({ label:"curved-add-ctrl", before:{ midControls: before }, after:{ midControls: after },
        do:()=> this.store.patchLink(id, { midControls: after }),
        undo:()=> this.store.patchLink(id, { midControls: before }) });
    },
    removeCtrl(i:number){
      if (this.mode==='draft'){
        const arr = (this.store.linkDraft.midControls ?? []).slice();
        arr.splice(i,1);
        this.store.setLinkDraft({ midControls: arr });
        return;
      }
      if (!this.link) return;
      const id = (this.link as any).id;
      const before = ((this.link as any).midControls || []).slice();
      const after = before.slice(); after.splice(i,1);
      this.undo.push({ label:"curved-remove-ctrl", before:{ midControls: before }, after:{ midControls: after },
        do:()=> this.store.patchLink(id, { midControls: after }),
        undo:()=> this.store.patchLink(id, { midControls: before }) });
    },
    clearCtrls(){
      if (this.mode==='draft'){ this.store.setLinkDraft({ midControls: [] }); return; }
      if (!this.link) return;
      const id = (this.link as any).id;
      const before = ((this.link as any).midControls || []).slice();
      const after:any[] = [];
      this.undo.push({ label:"curved-clear-ctrls", before:{ midControls: before }, after:{ midControls: after },
        do:()=> this.store.patchLink(id, { midControls: after }),
        undo:()=> this.store.patchLink(id, { midControls: before }) });
    },
    setCtrl(i:number, key:'t'|'off', val:number){
      if (this.mode==='draft'){
        const arr = (this.store.linkDraft.midControls ?? []).slice();
        const cur = arr[i] ?? { t:50, off:25 };
        arr[i] = { ...cur, [key]: val };
        this.store.setLinkDraft({ midControls: arr });
        return;
      }
      if (!this.link) return;
      const id = (this.link as any).id;
      const before = ((this.link as any).midControls || []).slice();
      const after = before.slice();
      after[i] = { ...after[i], [key]: val };
      this.undo.push({ label:"curved-edit-ctrl", _coalesceKey:`curved:${id}:${i}:${key}`, before:{ midControls: before }, after:{ midControls: after },
        do:()=> this.store.patchLink(id, { midControls: after }),
        undo:()=> this.store.patchLink(id, { midControls: before }) });
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