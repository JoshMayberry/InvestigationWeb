<template>
  <div class="block">
    <div class="block-title sm">{{ title }}</div>
    <div class="grid-auto">
      <label class="inline">
        <span>Turns</span>
        <input class="rng" type="range" min="0" max="20" step="1" :value="turnsShow" @input="set('turns', num(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" step="1" :value="turns" @change="set('turns', Math.round(num(($event.target as HTMLInputElement).value)))" />
      </label>
      <label class="inline">
        <span>Direction</span>
        <select class="sel" :value="dir" @change="set('direction', num(($event.target as HTMLSelectElement).value))">
          <option :value="1">Clockwise</option>
          <option :value="-1">Counter</option>
        </select>
      </label>
      <label class="inline">
        <span>Start r</span>
        <input class="num" type="number" min="1" step="1" :value="startR" @change="set('startRadius', num(($event.target as HTMLInputElement).value))" />
      </label>
      <label class="inline">
        <span>End r</span>
        <input class="num" type="number" min="1" step="1" :value="endR" @change="set('endRadius', num(($event.target as HTMLInputElement).value))" />
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";
export default defineComponent({
  name: "CorkscrewEditor",
  props: { mode: { type:String, required:true }, link: { type:Object, required:false } },
  setup(props){
    const store = useInvestigationWebStore();
    const runtime:any = inject(RUNTIME_KEY, null);
    const undo = computed(()=> runtime?.controllers?.undo);
    const title = computed(()=> (props.link as any)?.type === "spiral" ? "Spiral" : "Corkscrew");
    const turns = computed(()=> props.mode==='draft' ? (store.linkDraft.turns ?? 3) : ((props.link as any)?.turns ?? 3));
    const turnsShow = computed(()=> Math.min(20, Math.max(0, Number(turns.value ?? 0))));
    const startR = computed(()=> props.mode==='draft' ? (store.linkDraft.startRadius ?? 10) : ((props.link as any)?.startRadius ?? 10));
    const endR = computed(()=> props.mode==='draft' ? (store.linkDraft.endRadius ?? 60) : ((props.link as any)?.endRadius ?? 60));
    const dir = computed(()=> props.mode==='draft' ? (store.linkDraft.direction ?? 1) : ((props.link as any)?.direction ?? 1));
    function num(v:any){ return Number(v); }
    function set(key:'turns'|'direction'|'startRadius'|'endRadius', val:any){
      if (props.mode==='draft'){ store.setLinkDraft({ [key]: val } as any); return; }
      const id = (props.link as any)?.id; if (!id) return;
      const before = (props.link as any)[key]; const after = val;
      undo.value.push({ label:`${title.value.toLowerCase()}-${key}`, _coalesceKey:`${title.value.toLowerCase()}:${id}:${key}`, before:{ [key]:before }, after:{ [key]:after },
        do:()=> store.patchLink(id, { [key]: after }), undo:()=> store.patchLink(id, { [key]: before }) });
    }
    return { store, runtime, undo, title, turns: turns, turnsShow, startR, endR, dir, num, set };
  }
});
</script>

<style scoped>
.block { display:flex; flex-direction:column; gap:8px; }
.block-title.sm { margin-top:2px; font-size:12px; color: var(--muted); }
.grid-auto { display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; align-items:center; }
.inline { display:flex; align-items:center; gap:8px; justify-content:space-between; flex-wrap:wrap; }
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