<template>
  <div class="form">
    <div class="block-title">{{ mode === 'draft' ? 'New Link' : 'Link' }}</div>

    <label v-if="mode==='selected'">
      <span>ID</span>
      <input class="txt" :value="link?.id" @input="onId(($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Type</span>
      <select class="sel" :value="typeVal" @change="onType(($event.target as HTMLSelectElement).value)">
        <option v-for="t in typeList" :key="t.id" :value="t.id">{{ t.label }}</option>
      </select>
    </label>

    <label>
      <span>Color</span>
      <input class="color" type="color" :value="colorVal" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Stroke</span>
      <select class="sel" :value="strokeVal" @change="onChange('stroke', ($event.target as HTMLSelectElement).value)">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select>
    </label>

    <label>
      <span>Arrow Head</span>
      <input type="checkbox" :checked="arrowVal" @change="onChange('arrowHead', ($event.target as HTMLInputElement).checked)" />
    </label>

    <label class="range">
      <span>Edge Padding</span>
      <input class="rng" type="range" min="0" max="24" :value="padVal" @input="onChange('pad', Number(($event.target as HTMLInputElement).value))" />
      <span class="pill">{{ padVal }}</span>
    </label>

    <label class="row">
      <input type="checkbox"
        :checked="simEnabled"
        @change="onSimToggle(($event.target as HTMLInputElement).checked)" />
      <span>Simulation Link</span>
    </label>

    <template v-if="simEnabled">
      <label class="range">
        <span>Rest Length</span>
        <input class="rng" type="range" min="10" max="800" step="10"
          :value="simRestLength"
          @input="onSimProp('restLength', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ simRestLength }}</span>
      </label>
      <label class="range">
        <span>Tension Stiffness</span>
        <input class="rng" type="range" min="-1" max="1" step="0.01"
          :value="simTension"
          @input="onSimProp('tension', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ simTension }}</span>
      </label>
      <label class="range">
        <span>Compression Stiffness</span>
        <input class="rng" type="range" min="-1" max="1" step="0.01"
          :value="simCompression"
          @input="onSimProp('compression', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ simCompression }}</span>
      </label>
      <label class="range">
        <span>Max Force Clamp</span>
        <input class="rng" type="range" min="0" max="50" step="1"
          :value="simMaxForce"
          @input="onSimProp('maxForce', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ simMaxForce }}</span>
      </label>

      <div class="block-title sm">Link Sim Presets</div>
      <div class="row">
        <select class="sel" @change="applyLinkSimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Apply Preset --</option>
          <option v-for="p in store.presets.linkSim" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="secondary small" @click="saveLinkSimPreset">Save</button>
      </div>
      <div class="row">
        <select class="sel" @change="removeLinkSimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Remove Preset --</option>
          <option v-for="p in store.presets.linkSim" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
    </template>

    <!-- Connected Nodes -->
    <div class="block-title sm">Nodes</div>
    <div class="pill-row" v-if="linkNodes.length">
      <span class="pill hdr">From</span>
      <button v-if="linkNodes[0]" class="pill link" @click="selectNode(linkNodes[0].id)">{{ linkNodes[0].id }}</button>
      <span class="pill hdr">To</span>
      <button v-if="linkNodes[1]" class="pill link" @click="selectNode(linkNodes[1].id)">{{ linkNodes[1].id }}</button>
    </div>

    <!-- Type-specific editor (small and isolated) -->
    <component
      v-if="typeDef.editor"
      :is="typeDef.editor"
      :mode="mode"
      :link="link"
    />

    <p v-if="mode==='draft'" class="muted small">Click first node, then second. Shift to keep adding.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, computed } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import type { InvestigationRuntime } from "../../../context/runtime";
import { RUNTIME_KEY } from "../../../context/runtime";
import { getPathType, listPathTypes } from "../../paths/registry";

export default defineComponent({
  name: "EditPageLink",
  props: {
    mode: { type: String as () => "draft"|"selected", required:true },
    linkId: { type: String, required: false }
  },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    selection(): any { return this.runtime?.controllers?.selection; },
    undo(): any { return this.runtime?.controllers?.undo; },
    link(): any | null {
      if (this.mode !== "selected") return null;
      // Prefer prop, else fall back to selection controller
      const selId = (this.selection?.id ?? this.selection?.get?.()) as string | undefined;
      const id = this.linkId || selId;
      if (!id) return null;
      return this.store.links.find((l:any)=> l.id === id) || null;
    },
    typeList(): { id:string; label:string }[] { return listPathTypes().map(t => ({ id:t.id, label:t.label })); },
    typeVal(): string {
      return this.mode==='draft'
        ? (this.store.linkDraft.type ?? 'straight')
        : (this.link?.type || 'straight');
    },
    typeDef(): any { return getPathType(this.typeVal); },
    colorVal(): string { return this.mode==='draft' ? (this.store.linkDraft.color || "#93c5fd") : (this.link?.color || "#93c5fd"); },
    strokeVal(): string { return this.mode==='draft' ? (this.store.linkDraft.stroke || "solid") : (this.link?.stroke || "solid"); },
    arrowVal(): boolean { return this.mode==='draft' ? !!this.store.linkDraft.arrowHead : !!this.link?.arrowHead; },
    padVal(): number { return this.mode==='draft' ? (this.store.linkDraft.pad || 0) : (this.link?.pad || 0); },
    linkNodes(): any[] {
      if (this.mode === 'draft') return [];
      if (!this.link) return [];
      return [
        this.store.nodes.find((n:any)=> n.id === this.link.from) || null,
        this.store.nodes.find((n:any)=> n.id === this.link.to) || null
      ];
    },
    simEnabled(): boolean {
      return this.mode==='draft'
        ? !!this.store.linkDraft.sim?.enabled
        : !!this.link?.sim?.enabled;
    },
    simRestLength(): number {
      return this.mode==='draft'
        ? (this.store.linkDraft.sim?.restLength ?? 160)
        : (this.link?.sim?.restLength ?? 160);
    },
    simTension(): number {
      return this.mode==='draft'
        ? (this.store.linkDraft.sim?.tension ?? 0.05)
        : (this.link?.sim?.tension ?? 0.05);
    },
    simCompression(): number {
      return this.mode==='draft'
        ? (this.store.linkDraft.sim?.compression ?? 0.05)
        : (this.link?.sim?.compression ?? 0.05);
    },
    simMaxForce(): number {
      return this.mode==='draft'
        ? (this.store.linkDraft.sim?.maxForce ?? 4)
        : (this.link?.sim?.maxForce ?? 4);
    },
  },
  methods:{
    onId(next:string){
      if (!this.link) return;
      const oldId = this.link.id;
      const ok = this.store.renameLinkId(oldId, next);
      if (ok && next !== oldId) this.selection?.set(next);
    },
    onType(next:string){
      if (this.mode === "draft"){
        const def = getPathType(next);
        const defaults = def.defaults || {};
        this.store.setLinkDraft({ type: next, ...defaults } as any);
        return;
      }
      if (!this.link) return;
      const id = this.link.id;
      const before = { type: this.link.type };
      const after = { type: next };
      this.undo.push({
        label:"edit-link-type",
        before, after,
        do: ()=> this.store.patchLink(id, after as any),
        undo: ()=> this.store.patchLink(id, before as any),
      });
    },
    onChange(key:any, value:any){
      if (this.mode === "draft"){
        this.store.setLinkDraft({ [key]: value } as any);
        return;
      }
      if (!this.link) return;
      const id = this.link.id;
      const before = (this.link as any)[key];
      const after = value;
      this.undo.push({
        label:`edit-link-${key}`,
        _coalesceKey:`link-prop:${id}:${key}`,
        before:{ [key]: before }, after:{ [key]: after },
        do: ()=> this.store.patchLink(id, { [key]: after } as any),
        undo: ()=> this.store.patchLink(id, { [key]: before } as any),
      });
    },
    selectNode(id:string){ this.selection?.set?.(id); },
    onSimToggle(on:boolean){
      if (this.mode==='draft'){
        const sim = { ...(this.store.linkDraft.sim||{}), enabled:on };
        this.store.setLinkDraft({ sim } as any);
        return;
      }
      if (!this.link) return;
      const id = this.link.id;
      const before = { sim: { ...(this.link.sim||{}) } };
      const after = { sim: { ...(this.link.sim||{}), enabled:on } };
      this.undo.push({
        label:"link-sim-toggle",
        before, after,
        do: ()=> this.store.patchLink(id, after),
        undo: ()=> this.store.patchLink(id, before),
      });
      this.store.patchLink(id, after);
    },
    onSimProp(key:string, val:any){
      if (this.mode==='draft'){
        const sim = { enabled:true, ...(this.store.linkDraft.sim||{}), [key]: val };
        this.store.setLinkDraft({ sim } as any);
        return;
      }
      if (!this.link) return;
      const id = this.link.id;
      const before = { sim: { ...(this.link.sim||{}) } };
      const after = { sim: { ...(this.link.sim||{}), [key]: val } };
      this.undo.push({
        label:`link-sim-${key}`,
        _coalesceKey:`link-sim:${id}:${key}`,
        before, after,
        do: ()=> this.store.patchLink(id, after),
        undo: ()=> this.store.patchLink(id, before),
      });
      this.store.patchLink(id, after);
    },
    saveLinkSimPreset(){
      if (!this.link?.sim) return;
      const name = prompt("Preset name?","Link Sim");
      if (!name) return;
      const desc = prompt("Description?","Link simulation preset") || "";
      this.store.addLinkSimPreset(name, desc, this.link);
    },
    applyLinkSimPreset(id:string){
      if (!id || !this.link) return;
      this.store.applyLinkSimPreset(id, this.link.id);
    },
    removeLinkSimPreset(id:string){
      if (!id) return;
      if (confirm("Remove link sim preset?")) this.store.removeLinkSimPreset(id);
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:10px; }
.block { display:flex; flex-direction:column; gap:8px; }
.block-title { font-size:12px; color:var(--muted); letter-spacing:.3px; }
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
  appearance: none;
}
.color { width: 44px; height: 24px; padding:0; border:1px solid rgba(255,255,255,0.15); border-radius:6px; background: transparent; }
.range { align-items:center; }
.rng { flex:1; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; }
.muted.small { font-size:11px; color: var(--muted); }
:deep(select.sel) { background:#0f172a; color:var(--text); border-color:rgba(255,255,255,0.2); }
:deep(select.sel option) { background:#0f172a; color:var(--text); }
.pill-row { display:flex; align-items:center; gap:8px; }
.pill.hdr { opacity:.6; font-size:12px; }
.pill.link {
  flex:1;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding:4px 8px;
  border-radius:6px;
  font-size:12px;
  cursor:pointer;
}
.row {
  display:flex;
  align-items:center;
  gap:10px;
}
</style>