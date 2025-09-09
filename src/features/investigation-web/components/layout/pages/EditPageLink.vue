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
import { getLinkType, listLinkTypes } from "../../links/registry";

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
    typeList(): { id:string; label:string }[] { return listLinkTypes().map(t => ({ id:t.id, label:t.label })); },
    typeVal(): string {
      return this.mode==='draft'
        ? (this.store.linkDraft.type ?? 'straight')
        : (this.link?.type || 'straight');
    },
    typeDef(): any { return getLinkType(this.typeVal); },
    colorVal(): string { return this.mode==='draft' ? (this.store.linkDraft.color || "#93c5fd") : (this.link?.color || "#93c5fd"); },
    strokeVal(): string { return this.mode==='draft' ? (this.store.linkDraft.stroke || "solid") : (this.link?.stroke || "solid"); },
    arrowVal(): boolean { return this.mode==='draft' ? !!this.store.linkDraft.arrowHead : !!this.link?.arrowHead; },
    padVal(): number { return this.mode==='draft' ? (this.store.linkDraft.pad || 0) : (this.link?.pad || 0); },
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
        const def = getLinkType(next);
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
</style>