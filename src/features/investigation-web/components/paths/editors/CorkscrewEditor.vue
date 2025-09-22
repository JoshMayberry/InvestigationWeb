<template>
  <div class="block">
    <div class="block-title sm">{{ title }}</div>
    <div class="grid-auto">
      <label class="inline">
        <span>Turns</span>
        <input class="rng" type="range" min="0" max="20" step="1" :value="turnsShow" @input="setVal('turns', num(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" step="1" :value="turns" @change="setVal('turns', Math.round(num(($event.target as HTMLInputElement).value)))" />
      </label>
      <label class="inline">
        <span>Direction</span>
        <select class="sel" :value="dir" @change="setVal('direction', num(($event.target as HTMLSelectElement).value))">
          <option :value="1">Clockwise</option>
          <option :value="-1">Counter</option>
        </select>
      </label>
      <label class="inline">
        <span>Start r</span>
        <input class="num" type="number" min="1" step="1" :value="startR" @change="setVal('startRadius', num(($event.target as HTMLInputElement).value))" />
      </label>
      <label class="inline">
        <span>End r</span>
        <input class="num" type="number" min="1" step="1" :value="endR" @change="setVal('endRadius', num(($event.target as HTMLInputElement).value))" />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";

export default defineComponent({
  name: "CorkscrewEditor",
  props: {
    mode: { type:String, required:true },
    link: { type:Object, required:false },
    track: { type:Object, required:false }
  },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as any
    };
  },
  computed:{
    undo(): any { return this.runtime?.controllers?.undo; },
    isTrack(): boolean { return !!this.track; },
    target(): any {
      if (this.mode === "draft") return this.isTrack ? this.store.trackDraft : this.store.linkDraft;
      return this.isTrack ? this.track : this.link;
    },
    title(): string {
      const t = this.target?.type;
      return t === "spiral" ? "Spiral" : "Corkscrew";
    },
    turns(): number { return (this.target?.turns ?? 3); },
    turnsShow(): number { return Math.min(20, Math.max(0, this.turns)); },
    startR(): number { return this.target?.startRadius ?? 10; },
    endR(): number { return this.target?.endRadius ?? 60; },
    dir(): number { return this.target?.direction ?? 1; }
  },
  methods:{
    num(v:any){ return Number(v); },
    patchDraft(patch:any){
      if (this.isTrack) this.store.setTrackDraft(patch);
      else this.store.setLinkDraft(patch);
    },
    patchItem(id:string, patch:any){
      if (this.isTrack) this.store.patchTrack(id, patch);
      else this.store.patchLink(id, patch);
    },
    setVal(key:'turns'|'direction'|'startRadius'|'endRadius', val:any){
      if (this.mode === "draft"){
        this.patchDraft({ [key]: val });
        return;
      }
      const id = this.target?.id;
      if (!id) return;
      const beforeVal = (this.target as any)[key];
      const afterVal = val;
      this.undo?.push({
        label:`${this.title.toLowerCase()}-${key}`,
        _coalesceKey:`${this.title.toLowerCase()}:${id}:${key}`,
        before:{ [key]: beforeVal },
        after:{ [key]: afterVal },
        do:()=> this.patchItem(id, { [key]: afterVal }),
        undo:()=> this.patchItem(id, { [key]: beforeVal })
      });
      this.patchItem(id, { [key]: afterVal });
    }
  }
});
</script>

<style scoped>
.block { display:flex; flex-direction:column; gap:8px; }
.block-title.sm { margin-top:2px; font-size:12px; color: var(--muted); }
.grid-auto { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:8px; }
.inline { display:flex; align-items:center; gap:8px; }
.rng { flex:1 1 160px; min-width:140px; }
.num, .sel {
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.2);
  color:var(--text);
  padding:4px 6px;
  border-radius:6px;
  font-size:12px;
}
.num { width:90px; }
</style>