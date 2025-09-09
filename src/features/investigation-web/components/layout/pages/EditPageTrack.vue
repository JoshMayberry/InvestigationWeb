<template>
  <div class="form" v-if="track">
    <div class="block-title">Track</div>

    <label>
      <span>ID</span>
      <input class="txt" :value="track.id" @input="onId(($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Color</span>
      <input class="color" type="color" :value="track.color || '#93c5fd'" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
    </label>

    <label class="row">
      <input type="checkbox" :checked="!!track.locked" @change="onChange('locked', ($event.target as HTMLInputElement).checked)" />
      <span>Locked (disable moving endpoints)</span>
    </label>

    <div class="pill-row">
      <span class="pill hdr">p1</span>
      <span class="pill">{{ track.p1.x.toFixed(1) }}, {{ track.p1.y.toFixed(1) }}</span>
      <span class="pill hdr">p2</span>
      <span class="pill">{{ track.p2.x.toFixed(1) }}, {{ track.p2.y.toFixed(1) }}</span>
    </div>

    <div class="row">
      <button class="secondary" @click="duplicate">Duplicate</button>
      <button class="danger" @click="deleteTrack">Delete</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import type { InvestigationRuntime } from "../../../context/runtime";
import { RUNTIME_KEY } from "../../../context/runtime";

export default defineComponent({
  name: "EditPageTrack",
  props: { trackId: { type:String, required:true } },
  data(){
    return { store: useInvestigationWebStore(), runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null };
  },
  computed:{
    track(): any | null { return this.store.tracks.find((t:any)=> t.id === this.trackId) || null; },
    undo(): any { return this.runtime?.controllers?.undo; },
  },
  methods:{
    onId(next:string){
      const oldId = this.track?.id; if (!oldId) return;
      const ok = this.store.renameTrackId(oldId, next);
      if (ok && next !== oldId) this.runtime?.controllers?.selection.set(next);
    },
    onChange(key:"color"|"locked", value:any){
      if (!this.track) return;
      const id = this.track.id;
      const before = (this.track as any)[key];
      const after = value;
      this.undo.push({
        label:`edit-track-${key}`,
        _coalesceKey:`track-prop:${id}:${key}`,
        before:{ [key]: before }, after:{ [key]: after },
        do: ()=> this.store.patchTrack(id, { [key]: after } as any),
        undo: ()=> this.store.patchTrack(id, { [key]: before } as any),
      });
    },
    deleteTrack(){
      if (!this.track) return;
      this.store.deleteTrack(this.track.id);
      this.runtime?.controllers?.selection.clear();
    },
    duplicate(){
      if (!this.track) return;
      const nid = this.store.duplicateTrack(this.track.id);
      if (nid) this.runtime?.controllers?.selection.set(nid);
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:10px; }
.block-title { font-size:12px; color:var(--muted); letter-spacing:.3px; }
label { display:flex; align-items:center; justify-content:space-between; gap:10px; }
label > span { font-size:12px; color: var(--muted); }
.txt { flex:1; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.12); color: var(--text); padding:6px 8px; border-radius:6px; font-size:12px; }
.color { width: 44px; height: 24px; padding:0; border:1px solid rgba(255,255,255,0.15); border-radius:6px; background: transparent; }
.row { display:flex; gap:8px; align-items:center; }
.pill-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color: var(--text); }
.pill.hdr { background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.35); }
.danger { color:#ef4444; }
</style>