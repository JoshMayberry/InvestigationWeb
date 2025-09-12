<template>
  <div class="form" v-if="track">
    <!-- Template tweaks (header + Set As Default button + hide ID in draft) -->
    <!-- Replace first title div: -->
    <div class="block-title">{{ isDraft ? 'Track Defaults' : 'Track' }}</div>
    <!-- Wrap ID label with v-if="!isDraft" -->
    <label v-if="!isDraft">
      <span>ID</span>
      <input class="txt" :value="track.id" @change="onId(($event.target as HTMLInputElement).value)" :disabled="track.kind==='calc'" />
    </label>

    <label>
      <span>Color</span>
      <input type="color" :value="track.color || '#93c5fd'" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
    </label>

    <label class="row">
      <span>Locked</span>
      <input type="checkbox" :checked="!!track.locked" @change="onChange('locked', ($event.target as HTMLInputElement).checked)" :disabled="track.kind==='calc'" />
    </label>

    <label>
      <span>Type</span>
      <select class="sel" :value="track.type" @change="onType(($event.target as HTMLSelectElement).value)">
        <option v-for="t in trackTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </label>

    <label>
      <span>Segments</span>
      <input
        type="number"
        min="1"
        :value="track.segments || 1"
        @change="onSegments(($event.target as HTMLInputElement).value)"
        class="num"
      />
    </label>

    <div v-if="track.kind==='calc' && track.groupId" class="pill-row">
      <span class="pill hdr">Group</span>
      <button class="pill link" @click="selectGroup(track.groupId)">{{ track.groupId }}</button>
    </div>

    <!-- Dynamic shape editor (reuse path editors) -->
    <component
      v-if="!isCalc || isDraft"
      :is="typeDef && typeDef.editor"
      :mode="isDraft ? 'draft' : 'selected'"
      :track="track"
    />

    <div class="block-title sm">Snap Nodes</div>
    <div class="pill-row" v-if="snapNodes.length">
      <button
        v-for="n in snapNodes"
        :key="n.id"
        class="pill link"
        :title="`order ${n.trackOrder}`"
        @click="selectNode(n.id)"
      >{{ n.id }}</button>
    </div>
    <p v-else class="muted small">No snap nodes on this track.</p>

    <div class="block-title sm">Additional Fields</div>
    <div class="field-list" v-if="store.customFields.track.length && track">
      <label v-for="f in store.customFields.track" :key="f.key" class="row">
        <span>{{ f.label || f.key }}</span>
        <input class="txt"
          :value="(track.extra && track.extra[f.key]) || ''"
          @input="onTrackCustomFieldChange(f.key, ($event.target as HTMLInputElement).value)" />
        <button class="small danger" @click="removeTrackField(f.key)">✕</button>
      </label>
    </div>
    <div class="row">
      <button class="secondary small" @click="addTrackField">+ Add Field</button>
    </div>

    <div class="row actions">
      <button class="danger" @click="deleteTrack">Delete</button>
      <button class="secondary" @click="duplicate">Duplicate</button>
      <!-- In actions row add -->
      <button v-if="!isDraft" class="secondary" @click="setAsDefault">Set As Default</button>
      <button v-if="!isDraft" class="secondary" @click="stageAllTrack">Stage All Nodes</button>
    </div>
  </div>
  <div v-else class="muted small">No track selected.</div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";
import StraightEditor from "../../../components/paths/editors/StraightEditor.vue";
import CurvedEditor from "../../../components/paths/editors/CurvedEditor.vue";
import BezierEditor from "../../../components/paths/editors/BezierEditor.vue";
import SplineEditor from "../../../components/paths/editors/SplineEditor.vue";
import CorkscrewEditor from "../../../components/paths/editors/CorkscrewEditor.vue";
import SpiralEditor from "../../../components/paths/editors/SpiralEditor.vue";
import PathEditor from "../../../components/paths/editors/PathEditor.vue";

const TYPE_DEFS: any = {
  straight:{ editor: StraightEditor, label:"Straight" },
  curved:{ editor: CurvedEditor, label:"Curved" },
  bezier:{ editor: BezierEditor, label:"Bezier" },
  spline:{ editor: SplineEditor, label:"Spline" },
  corkscrew:{ editor: CorkscrewEditor, label:"Corkscrew" },
  spiral:{ editor: SpiralEditor, label:"Spiral" },
  path:{ editor: PathEditor, label:"Path" }
};

export default defineComponent({
  name:"EditPageTrack",
  props:{
    trackId: { type:String, required:false },
    mode: { type:String, default:"selected" } // 'selected' | 'draft'
  },
  components:{ StraightEditor, CurvedEditor, BezierEditor, SplineEditor, CorkscrewEditor, SpiralEditor },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as any
    };
  },
  computed:{
    undo(): any { return this.runtime?.controllers?.undo; },
    track(): any | null {
      if (this.mode === "draft") return { id:"(draft)", ...this.store.trackDraft };
      if (!this.trackId) return null;
      return this.store.tracks.find((t:any)=> t.id===this.trackId) || null;
    },
    isDraft(): boolean { return this.mode === "draft"; },
    trackTypes(): string[] { return Object.keys(TYPE_DEFS); },
    typeDef(): any {
      const t = this.track;
      return t ? TYPE_DEFS[t.type] : null;
    },
    snapNodes(): any[] {
      if (this.isDraft || !this.track) return [];
      return this.store.nodes
        .filter((n:any)=> n.kind==='snap' && n.trackId===this.track.id)
        .sort((a:any,b:any)=> a.trackOrder - b.trackOrder);
    },
    isCalc(): boolean { return !!this.track && this.track.kind==='calc'; },
  },
  methods:{
    onId(next:string){
      if (this.isDraft || !this.track) return;
      const old = this.track.id; if (next===old) return;
      this.store.renameTrackId(old, next);
      this.runtime?.controllers?.selection.set(next);
    },
    onChange(key:"color"|"locked", v:any){
      if (!this.track) return;
      if (this.isDraft){
        this.store.setTrackDraft({ [key]: v });
        return;
      }
      const id = this.track.id;
      const before = { [key]: (this.track as any)[key] };
      const after = { [key]: v };
      this.undo.push({
        label:`track-${key}`,
        before:{ id, ...before },
        after:{ id, ...after },
        do:()=> this.store.patchTrack(id, after),
        undo:()=> this.store.patchTrack(id, before)
      });
      this.store.patchTrack(id, after);
    },
    onType(next:string){
      if (!this.track) return;
      if (this.isDraft){
        this.store.setTrackDraft({ type: next });
        return;
      }
      if (this.track.type === next) return;
      const before = JSON.parse(JSON.stringify(this.track));
      const id = this.track.id;
      this.undo.push({
        label:"track-type",
        before:{ snapshot: before },
        after:{ type: next },
        do:()=> this.store.setTrackType(id, next),
        undo:()=> {
          const i = this.store.tracks.findIndex((t:any)=> t.id===id);
          if (i !== -1) this.store.tracks[i] = before;
        }
      });
      this.store.setTrackType(id, next);
    },
    onSegments(v:any){
      const n = Math.max(1, Math.floor(Number(v)||1));
      if (this.isDraft){
        this.store.setTrackDraft({ segments: n });
        return;
      }
      if (!this.track) return;
      if ((this.track.segments||1) === n) return;
      const id = this.track.id;
      const before = { segments: this.track.segments||1 };
      const after = { segments: n };
      this.undo.push({
        label:"track-segments",
        before:{ id, ...before },
        after:{ id, ...after },
        do:()=> this.store.patchTrack(id, after),
        undo:()=> this.store.patchTrack(id, before)
      });
      this.store.patchTrack(id, after);
    },
    deleteTrack(){
      if (this.isDraft || !this.track) return;
      const id = this.track.id;
      const snap = JSON.parse(JSON.stringify(this.track));
      this.undo.push({
        label:"track-delete",
        before:{ snapshot: snap },
        after:{},
        do:()=> { this.store.deleteTrack(id); this.runtime?.controllers?.selection.clear(); },
        undo:()=> { this.store.tracks.push(snap); }
      });
      this.store.deleteTrack(id);
      this.runtime?.controllers?.selection.clear();
    },
    duplicate(){
      if (this.isDraft || !this.track) return;
      const nid = this.store.duplicateTrack(this.track.id);
      if (nid) this.runtime?.controllers?.selection.set(nid);
    },
    selectNode(id:string){ this.runtime?.controllers?.selection.set(id); },
    selectGroup(id:string){ this.runtime?.controllers?.selection?.set(id); },
    setAsDefault(){
      if (this.isDraft || !this.track) return;
      this.store.setTrackDefaultsFromTrack(this.track.id);
    },
    stageAllTrack(){
      if (this.isDraft || !this.track) return;
      this.store.stageAllTrackSnapNodes(this.track.id);
    },
    addTrackField(){
      const key = prompt("Field key (identifier):","note");
      if (!key) return;
      const label = prompt("Label (optional):", key) || key;
      this.store.addCustomField('track', key, label);
    },
    removeTrackField(key:string){
      if (confirm(`Remove field '${key}' from all tracks?`)){
        this.store.removeCustomField('track', key);
      }
    },
    onTrackCustomFieldChange(key:string, val:string){
      if (!this.track) return;
      const id = this.track.id;
      this.store.patchTrack(id, { extra: { [key]: val } } as any);
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:12px; flex:1 1 auto; min-height:0; overflow-y:auto; }
.row { display:flex; align-items:center; gap:8px; }
.pill-row { display:flex; flex-wrap:wrap; gap:6px; }
.pill.link { background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4); padding:2px 8px; border-radius:999px; cursor:pointer; font-size:11px; }
.block-title { font-weight:600; font-size:14px; }
.block-title.sm { font-size:12px; opacity:.7; margin-top:4px; }
.muted.small { font-size:11px; opacity:.6; }
.actions { margin-top:8px; }
.txt, .sel { background:#0f172a; border:1px solid rgba(255,255,255,0.15); color:var(--text); padding:4px 6px; border-radius:6px; }
.num { background:#0f172a; border:1px solid rgba(255,255,255,0.15); color:var(--text); padding:4px 6px; border-radius:6px; width:90px; }
.field-list { border-top:1px solid rgba(255,255,255,0.1); padding-top:8px; }
.field-list label { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid rgba(255,255,255,0.1); }
.field-list label:last-child { border-bottom:none; }
.small.danger { opacity:.8; }
</style>