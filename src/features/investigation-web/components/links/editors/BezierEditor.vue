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
  props: { mode: { type:String, required:true }, link: { type:Object, required:false } },
  data(){ return { store: useInvestigationWebStore(), runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    beSym(): boolean { return this.mode==='draft' ? !!this.store.linkDraft.symmetric : !!(this.link as any)?.symmetric; },
    c1(): any { return this.mode==='draft' ? (this.store.linkDraft.c1 ?? { t:25, off:30 }) : ((this.link as any)?.c1 ?? { t:25, off:30 }); },
    c2(): any { return this.mode==='draft' ? (this.store.linkDraft.c2 ?? { t:75, off:-30 }) : ((this.link as any)?.c2 ?? { t:75, off:-30 }); },
    undo(): any { return this.runtime?.controllers?.undo; },
  },
  methods:{
    num(v:any){ return Number(v); },
    bool(v:any){ return !!v; },
    set(key:'symmetric', val:any){
      if (this.mode==='draft'){ this.store.setLinkDraft({ [key]: val } as any); return; }
      const id = (this.link as any)?.id; if (!id) return;
      const before = (this.link as any)[key];
      const after = val;
      this.undo.push({ label:`bezier-${key}`, _coalesceKey:`bezier:${id}:${key}`, before:{ [key]:before }, after:{ [key]:after },
        do:()=> this.store.patchLink(id, { [key]: after }), undo:()=> this.store.patchLink(id, { [key]: before }) });
    },
    setC(which:1|2, key:'t'|'off', val:number){
      if (this.mode==='draft'){
        const patch:any = {};
        if (which===1) patch.c1 = { ...(this.store.linkDraft.c1 ?? { t:25, off:30 }), [key]: val };
        else patch.c2 = { ...(this.store.linkDraft.c2 ?? { t:75, off:-30 }), [key]: val };
        this.store.setLinkDraft(patch);
        return;
      }
      const id = (this.link as any)?.id; if (!id) return;
      const cur = which===1 ? (this.link as any).c1 : (this.link as any).c2;
      const next = { ...cur, [key]: val };
      const field = which===1 ? "c1" : "c2";
      this.undo.push({
        label:`bezier-${field}-${key}`,
        _coalesceKey:`bezier:${id}:${field}:${key}`,
        before:{ [field]: cur }, after:{ [field]: next },
        do: ()=> this.store.patchLink(id, { [field]: next }),
        undo: ()=> this.store.patchLink(id, { [field]: cur }),
      });
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