<template>
  <div class="form">
    <div class="block-title">{{ mode === 'defaults' ? 'New Node Defaults' : 'Node' }}</div>

    <label v-if="mode==='selected'">
      <span>ID</span>
      <input class="txt" :value="node?.id" @input="onId(($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Label</span>
      <input class="txt" :value="labelVal" @input="onChange('label', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Color</span>
      <input class="color" type="color" :value="colorVal" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
    </label>

    <label class="range">
      <span>Radius</span>
      <input class="rng" type="range" min="6" max="36" :value="radiusVal" @input="onChange('r', Number(($event.target as HTMLInputElement).value))" />
      <span class="pill">{{ radiusVal }}</span>
    </label>

    <label class="row">
      <input type="checkbox" :checked="(mode==='selected' ? !!node?.locked : false)" @change="onChange('locked', ($event.target as HTMLInputElement).checked)" />
      <span>Locked (disable dragging)</span>
    </label>

    <template v-if="mode==='selected'">
      <div class="block-title sm">Bonuses</div>
      <div class="bonus-list">
        <div class="bonus-item" v-for="(b, i) in nodeBonuses" :key="i">
          <label>
            <span>Title</span>
            <input class="txt" :value="b.title" @input="onBonusChange(i, 'title', ($event.target as HTMLInputElement).value)" placeholder="Bonus title" />
          </label>
          <label>
            <span>Description</span>
            <textarea class="area" :value="b.description || ''" @input="onBonusChange(i, 'description', ($event.target as HTMLTextAreaElement).value)" placeholder="Bonus description (optional)"></textarea>
          </label>
          <div class="row">
            <button class="danger small" @click="removeBonus(i)">Remove</button>
          </div>
        </div>
      </div>
      <div class="row">
        <button class="secondary" @click="addBonus">+ Add Bonus</button>
      </div>
    </template>

    <template v-if="mode==='selected'">
      <div class="block-title sm">Links</div>
      <div class="pill-row">
        <span class="pill hdr">Incoming</span>
        <button v-for="l in incomingLinks" :key="l.id" class="pill link" @click="selectLink(l.id)" :title="`from ${l.from}`">{{ l.id }}</button>
      </div>
      <div class="pill-row">
        <span class="pill hdr">Outgoing</span>
        <button v-for="l in outgoingLinks" :key="l.id" class="pill link" @click="selectLink(l.id)" :title="`to ${l.to}`">{{ l.id }}</button>
      </div>
    </template>

    <!-- Track + Snap Neighbors (only for snap nodes) -->
    <template v-if="mode==='selected' && node && node.kind==='snap'">
      <div class="block-title sm">Track</div>
      <div class="pill-row">
        <span class="pill hdr">Track</span>
        <button class="pill link" @click="selectTrack(node.trackId)">{{ node.trackId }}</button>
      </div>
      <div class="pill-row" v-if="mode==='selected' && node && node.kind==='snap' && track">
        <span class="pill hdr">Segment</span>
        <select class="sel small"
          :value="(node.trackSegment ?? inferSegment)"
          @change="changeSegment(($event.target as HTMLSelectElement).value)"
          :disabled="(track.segments||1)===1">
          <option v-for="s in track.segments || 1" :key="s-1" :value="s-1">#{{ s }}</option>
        </select>
      </div>
      <div class="pill-row" v-if="track && track.groupId">
        <span class="pill hdr">Group</span>
        <button class="pill link" @click="selectGroup(track.groupId)">{{ track.groupId }}</button>
      </div>
    </template>

    <div v-if="mode==='selected'" class="actions">
      <button class="secondary" @click="setAsDefaults">Set As Default</button>
      <button class="danger" @click="deleteNode">Delete</button>
      <button class="secondary" @click="duplicateNode">Duplicate → Staging</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import type { InvestigationRuntime } from "../../../context/runtime";
import { RUNTIME_KEY } from "../../../context/runtime";

export default defineComponent({
  name: "EditPageNode",
  props: {
    mode: { type: String as () => "defaults"|"selected", required: true },
    nodeId: { type: String, required: false }
  },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    undo(): any { return this.runtime?.controllers?.undo; },
    selection(): any { return this.runtime?.controllers?.selection; },
    node(): any | null {
      if (this.mode !== "selected") return null;
      return this.store.nodes.find((n:any)=>n.id===this.nodeId) || null;
    },
    labelVal(): string { return (this.mode === "selected" ? (this.node?.label || "") : this.store.settings.defaultNode.label) as string; },
    colorVal(): string { return (this.mode === "selected" ? (this.node?.color || this.store.settings.defaultNode.color) : this.store.settings.defaultNode.color) as string; },
    radiusVal(): number { return (this.mode === "selected" ? (this.node?.r || this.store.settings.defaultNode.r) : this.store.settings.defaultNode.r) as number; },
    nodeBonuses(): { title:string; description?:string }[] {
      if (this.mode !== "selected") return [];
      return this.node?.bonuses || [];
    },
    incomingLinks(): any[] { return this.mode==='selected' && this.node ? this.store.links.filter((l:any)=>l.to===this.node.id) : []; },
    outgoingLinks(): any[] { return this.mode==='selected' && this.node ? this.store.links.filter((l:any)=>l.from===this.node.id) : []; },
    track(): any | null {
      if (!this.node || this.node.kind !== 'snap') return null;
      return this.store.tracks.find((t:any)=> t.id === this.node.trackId) || null;
    },
    inferSegment(): number {
      if (!this.node || this.node.kind!=='snap' || !this.track) return 0;
      const segs = Math.max(1, this.track.segments||1);
      return Math.min(segs-1, Math.floor(this.node.trackPosition * segs));
    },
  },
  methods:{
    onId(next:string){
      if (!this.node) return;
      const oldId = this.node.id;
      const ok = this.store.renameNodeId(oldId, next);
      if (ok && next !== oldId) this.selection?.set(next);
    },
    onChange(key:"label"|"color"|"r"|"locked", value:any){
      if (this.mode === "defaults"){
        this.store.updateDefaultNode({ [key]: value } as any);
        return;
      }
      if (!this.node) return;
      const id = this.node.id;
      const before = (this.node as any)[key];
      const after = value;
      this.undo.push({
        label:`edit-node-${key}`,
        _coalesceKey:`node-prop:${id}:${key}`,
        before:{ [key]: before }, after:{ [key]: after },
        do: ()=> this.store.patchNode(id, { [key]: after } as any),
        undo: ()=> this.store.patchNode(id, { [key]: before } as any),
      });
    },
    addBonus(){
      if (!this.node) return;
      const id = this.node.id;
      const before = this.nodeBonuses.slice();
      const after = [...before, { title: "", description: "" }];
      this.undo.push({
        label:"node-bonus-add",
        before:{ bonuses: before }, after:{ bonuses: after },
        do: ()=> this.store.patchNode(id, { bonuses: after }),
        undo: ()=> this.store.patchNode(id, { bonuses: before }),
      });
    },
    removeBonus(idx:number){
      if (!this.node) return;
      const id = this.node.id;
      const before = this.nodeBonuses.slice();
      const after = before.slice(); after.splice(idx,1);
      this.undo.push({
        label:"node-bonus-remove",
        before:{ bonuses: before }, after:{ bonuses: after },
        do: ()=> this.store.patchNode(id, { bonuses: after }),
        undo: ()=> this.store.patchNode(id, { bonuses: before }),
      });
    },
    onBonusChange(idx:number, key:"title"|"description", value:string){
      if (!this.node) return;
      const id = this.node.id;
      const before = this.nodeBonuses.slice();
      const after = this.nodeBonuses.slice();
      after[idx] = { ...after[idx], [key]: value };
      this.undo.push({
        label:"node-bonus-edit",
        _coalesceKey:`node-bonus:${id}:${idx}:${key}`,
        before:{ bonuses: before }, after:{ bonuses: after },
        do: ()=> this.store.patchNode(id, { bonuses: after }),
        undo: ()=> this.store.patchNode(id, { bonuses: before }),
      });
    },
    setAsDefaults(){
      if (!this.node) return;
      this.store.setDefaultsFromNode(this.node.id);
    },
    deleteNode(){
      if (!this.node) return;
      this.store.deleteNode(this.node.id);
      this.selection?.clear();
    },
    duplicateNode(){ if (this.node) this.store.duplicateNodeToStaging(this.node.id); },
    selectLink(id:string){ this.selection?.set(id); },
    selectTrack(id:string){ this.selection?.set(id); },
    selectNode(id:string){ this.selection?.set(id); },
    selectGroup(id:string){ this.selection?.set(id); },
    changeSegment(v:string){
      if (!this.node || this.node.kind!=='snap' || !this.track) return;
      const seg = Math.max(0, Math.min((this.track.segments||1)-1, Number(v)|0));
      this.store.setSnapNodeSegment(this.node.id, seg);
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:10px; }
.block-title { font-size:12px; color:var(--muted); letter-spacing:.3px; }
.block-title.sm { margin-top:2px; }
label { display:flex; align-items:center; justify-content:space-between; gap:10px; }
label > span { font-size:12px; color: var(--muted); }
.txt, .sel {
  flex:1;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding:6px 8px;
  border-radius:6px;
  font-size:12px;
}
.color { width: 44px; height: 24px; padding:0; border:1px solid rgba(255,255,255,0.15); border-radius:6px; background: transparent; }
.range { align-items:center; }
.rng { flex:1; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; }
.pill-row { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
.pill.hdr { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); }
.pill.link { cursor:pointer; background: rgba(96,165,250,0.15); border:1px solid rgba(96,165,250,0.35); color: var(--text); }
.pill.link:hover { background: rgba(96,165,250,0.25); }
.row { display:flex; gap:8px; flex-wrap:wrap; }
.bonus-list { display:flex; flex-direction:column; gap:10px; }
.bonus-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 8px;
  padding: 8px;
  display:flex;
  flex-direction:column;
  gap:8px;
}
.area {
  flex:1;
  min-height: 60px;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding:6px 8px;
  border-radius:6px;
  font-size:12px;
  resize: vertical;
}
.actions { display:flex; gap:8px; }
.danger { color:#ef4444; }
.secondary { color:#93c5fd; }
.small { font-size: 11px; }
</style>