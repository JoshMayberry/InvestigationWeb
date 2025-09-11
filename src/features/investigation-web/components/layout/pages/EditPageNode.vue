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

    <label class="row" v-if="mode==='selected' && node && node.kind==='free'">
      <input
        type="checkbox"
        :checked="!!node.sim?.enabled"
        @change="onSimToggle(($event.target as HTMLInputElement).checked)"
      />
      <span>Participates in Simulation</span>
    </label>

    <template v-if="mode==='selected' && node && node.kind==='free' && node.sim?.enabled">
      <div class="block-title sm">Simulation Forces</div>
      <label class="range">
        <span>Attraction</span>
        <input class="rng" type="range" min="-500" max="500" step="5"
          :value="node.sim?.attraction ?? 0"
          @input="onSimProp('attraction', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ node.sim?.attraction ?? 0 }}</span>
      </label>
      <label class="range">
        <span>Max Force Clamp</span>
        <input class="rng" type="range" min="0" max="50" step="1"
          :value="node.sim?.maxForce ?? 10"
          @input="onSimProp('maxForce', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ node.sim?.maxForce ?? 10 }}</span>
      </label>
      <label class="range">
        <span>Mass</span>
        <input class="rng" type="range" min="0.1" max="50" step="0.1"
          :disabled="node.sim?.useRadiusMass"
          :value="node.sim?.mass ?? 1"
          @input="onSimProp('mass', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ node.sim?.useRadiusMass ? 'auto' : (node.sim?.mass ?? 1).toFixed(1) }}</span>
      </label>
      <label class="row">
        <input type="checkbox"
          :checked="!!node.sim?.useRadiusMass"
          @change="onSimProp('useRadiusMass', ($event.target as HTMLInputElement).checked)" />
        <span>Mass from radius</span>
      </label>
      <label class="range" v-if="node.sim?.useRadiusMass">
        <span>Mass Scale</span>
        <input class="rng" type="range" min="0.01" max="2" step="0.01"
          :value="node.sim?.massScale ?? 1"
          @input="onSimProp('massScale', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ (node.sim?.massScale ?? 1).toFixed(2) }}</span>
      </label>

      <div class="block-title sm">Node Sim Presets</div>
      <div class="row">
        <select class="sel" @change="applyNodeSimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Apply Preset --</option>
          <option v-for="p in store.presets.nodeSim" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="secondary small" @click="saveNodeSimPreset">Save</button>
      </div>
      <div class="row">
        <select class="sel" @change="removeNodeSimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Remove Preset --</option>
          <option v-for="p in store.presets.nodeSim" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>

      <div class="block-title sm">Color Attractions</div>
      <div class="color-attract-list" v-if="(node.sim?.colorAttractions||[]).length">
        <div class="color-attract-item" v-for="(ca, i) in node.sim?.colorAttractions" :key="i">
          <input type="color" :value="ca.color"
            @input="onColorAttractChange(i, 'color', ($event.target as HTMLInputElement).value)" />
          <input type="number" class="num" :value="ca.force"
            @input="onColorAttractChange(i, 'force', Number(($event.target as HTMLInputElement).value))" />
          <button class="danger small" @click="removeColorAttract(i)">×</button>
        </div>
      </div>
      <div class="row">
        <button class="secondary small" @click="addColorAttract">+ Add Color Attraction</button>
      </div>
    </template>

    <template v-if="mode==='selected' && node">
      <div class="block-title sm">Label Style</div>
      <label class="row">
        <span>Mode</span>
        <select class="sel" :value="labelMode" @change="onLabelStyle('mode', ($event.target as HTMLSelectElement).value)">
          <option value="angle">Angle</option>
            <option value="free">Free</option>
          <option value="hidden">Hidden</option>
        </select>
      </label>
      <template v-if="labelMode==='angle'">
        <label class="range">
          <span>Angle</span>
          <input class="rng" type="range" min="0" max="359" step="1"
            :value="node.labelStyle?.angle ?? 0"
            @input="onLabelStyle('angle', Number(($event.target as HTMLInputElement).value))" />
          <span class="pill">{{ node.labelStyle?.angle ?? 0 }}°</span>
        </label>
        <label class="range">
          <span>Margin</span>
          <input class="rng" type="range" min="0" max="40" step="1"
            :value="node.labelStyle?.margin ?? 4"
            @input="onLabelStyle('margin', Number(($event.target as HTMLInputElement).value))" />
          <span class="pill">{{ node.labelStyle?.margin ?? 4 }}</span>
        </label>
      </template>
      <template v-else-if="labelMode==='free'">
        <label class="range">
          <span>Offset X</span>
          <input class="rng" type="range" min="-200" max="200" step="1"
            :value="node.labelStyle?.offsetX ?? 0"
            @input="onLabelStyle('offsetX', Number(($event.target as HTMLInputElement).value))" />
          <span class="pill">{{ node.labelStyle?.offsetX ?? 0 }}</span>
        </label>
        <label class="range">
          <span>Offset Y</span>
          <input class="rng" type="range" min="-200" max="200" step="1"
            :value="node.labelStyle?.offsetY ?? 0"
            @input="onLabelStyle('offsetY', Number(($event.target as HTMLInputElement).value))" />
          <span class="pill">{{ node.labelStyle?.offsetY ?? 0 }}</span>
        </label>
        <label class="range">
          <span>Rotation</span>
          <input class="rng" type="range" min="-180" max="180" step="1"
            :value="node.labelStyle?.rotation ?? 0"
            @input="onLabelStyle('rotation', Number(($event.target as HTMLInputElement).value))" />
          <span class="pill">{{ node.labelStyle?.rotation ?? 0 }}°</span>
        </label>
      </template>
      <label class="range">
        <span>Font Size</span>
        <input class="rng" type="range" min="8" max="28" step="1"
          :value="node.labelStyle?.fontSize ?? 11"
          @input="onLabelStyle('fontSize', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ node.labelStyle?.fontSize ?? 11 }}</span>
      </label>
      <label class="row">
        <span>Font Weight</span>
        <select class="sel" :value="node.labelStyle?.fontWeight || 'normal'" @change="onLabelStyle('fontWeight', ($event.target as HTMLSelectElement).value)">
          <option>normal</option><option>500</option><option>600</option><option>700</option><option>bold</option>
        </select>
      </label>
      <label class="row">
        <span>Font Style</span>
        <select class="sel" :value="node.labelStyle?.fontStyle || 'normal'" @change="onLabelStyle('fontStyle', ($event.target as HTMLSelectElement).value)">
          <option>normal</option><option>italic</option><option>oblique</option>
        </select>
      </label>
      <label class="row">
        <span>Label Color</span>
        <input class="color" type="color" :value="node.labelStyle?.color || '#c8d3ff'"
          @input="onLabelStyle('color', ($event.target as HTMLInputElement).value)" />
      </label>
    </template>

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
    labelMode(): string {
      if (!this.node) return 'angle';
      return this.node.labelStyle?.mode || 'angle';
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
    onSimToggle(on:boolean){
      if (!this.node) return;
      const id = this.node.id;
      const beforeSim = this.node.sim ? { ...this.node.sim } : null;
      const afterSim = on
        ? { ...(beforeSim||{}), enabled:true }
        : beforeSim
          ? { ...beforeSim, enabled:false }
          : { enabled:false };
      this.undo.push({
        label:"toggle-sim",
        before:{ sim: beforeSim },
        after:{ sim: afterSim },
        do: ()=> this.store.patchNode(id, { sim: afterSim }),
        undo: ()=> this.store.patchNode(id, { sim: beforeSim })
      });
      this.store.patchNode(id, { sim: afterSim });
    },
    onSimProp(key:string, val:any){
      if (!this.node) return;
      const id = this.node.id;
      const before = { sim: { ...(this.node.sim||{}) } };
      const after = { sim: { ...(this.node.sim||{}), [key]: val } };
      this.undo.push({
        label:`node-sim-${key}`,
        before, after,
        do: ()=> this.store.patchNode(id, after),
        undo: ()=> this.store.patchNode(id, before),
      });
      this.store.patchNode(id, after);
    },
    addColorAttract(){
      if (!this.node) return;
      const id = this.node.id;
      const list = this.node.sim?.colorAttractions || [];
      const before = { sim: { ...(this.node.sim||{}), colorAttractions: list.slice() } };
      const afterList = [...list, { color:"#ffffff", force:100 }];
      const after = { sim: { ...(this.node.sim||{}), colorAttractions: afterList } };
      this.undo.push({
        label:"node-sim-color-attract-add",
        before, after,
        do: ()=> this.store.patchNode(id, after),
        undo: ()=> this.store.patchNode(id, before),
      });
      this.store.patchNode(id, after);
    },
    removeColorAttract(i:number){
      if (!this.node) return;
      const id = this.node.id;
      const list = this.node.sim?.colorAttractions || [];
      const before = { sim: { ...(this.node.sim||{}), colorAttractions: list.slice() } };
      const afterList = list.slice(); afterList.splice(i,1);
      const after = { sim: { ...(this.node.sim||{}), colorAttractions: afterList } };
      this.undo.push({
        label:"node-sim-color-attract-remove",
        before, after,
        do: ()=> this.store.patchNode(id, after),
        undo: ()=> this.store.patchNode(id, before),
      });
      this.store.patchNode(id, after);
    },
    onColorAttractChange(i:number, key:"color"|"force", val:any){
      if (!this.node) return;
      const id = this.node.id;
      const list = this.node.sim?.colorAttractions || [];
      const beforeList = list.slice();
      const afterList = list.slice();
      afterList[i] = { ...afterList[i], [key]: val };
      const before = { sim: { ...(this.node.sim||{}), colorAttractions: beforeList } };
      const after = { sim: { ...(this.node.sim||{}), colorAttractions: afterList } };
      this.undo.push({
        label:`node-sim-color-attract-${key}`,
        _coalesceKey:`node-sim-color-attract:${id}:${i}:${key}`,
        before, after,
        do: ()=> this.store.patchNode(id, after),
        undo: ()=> this.store.patchNode(id, before),
      });
      this.store.patchNode(id, after);
    },
    saveNodeSimPreset(){
      if (!this.node?.sim) return;
      const name = prompt("Preset name?","Node Sim");
      if (!name) return;
      const desc = prompt("Description?","Custom node sim preset") || "";
      this.store.addNodeSimPreset(name, desc, this.node);
    },
    applyNodeSimPreset(id:string){
      if (!id || !this.node) return;
      this.store.applyNodeSimPreset(id, this.node.id);
    },
    removeNodeSimPreset(id:string){
      if (!id) return;
      if (confirm("Remove node sim preset?")) this.store.removeNodeSimPreset(id);
    },
    onLabelStyle(key:string, val:any){
      if (!this.node) return;
      const id = this.node.id;
      const before = { labelStyle: { ...(this.node.labelStyle||{}) } };
      const after = { labelStyle: { ...(this.node.labelStyle||{}), [key]: val } };
      this.undo.push({
        label:`node-label-style-${key}`,
        _coalesceKey:`node-label-style:${id}:${key}`,
        before, after,
        do:()=> this.store.patchNode(id, after),
        undo:()=> this.store.patchNode(id, before),
      });
      this.store.patchNode(id, after);
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
.color-attract-list { display:flex; flex-direction:column; gap:6px; }
.color-attract-item { display:flex; gap:6px; align-items:center; }
.color-attract-item .num {
  width:70px;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  color:var(--text);
  padding:4px 6px;
  border-radius:6px;
  font-size:12px;
}
</style>