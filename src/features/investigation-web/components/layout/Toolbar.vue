<template>
  <div class="toolbar">
    <div class="group">
      <button class="btn" @click="onSave" :disabled="!canSave">Save</button>
      <button class="btn" @click="onLoad">Load</button>
      <button class="btn" @click="onExport">Export</button>
      <button class="btn" @click="triggerImport">Import</button>

      <Tooltip :text="undoTooltip">
        <button class="btn" @click="undo" :disabled="!canUndo">Undo</button>
      </Tooltip>
      <Tooltip :text="redoTooltip">
        <button class="btn" @click="redo" :disabled="!canRedo">Redo</button>
      </Tooltip>

      <input ref="fileEl" type="file" accept=".json,.js,application/json" style="display:none" @change="onImportChange" />
    </div>
    <div class="hint" v-if="hint">{{ hint }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { exportSnapshot } from "../../utils/snapshotFiles";
import type { Snapshot } from "../../types/snapshot";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";
import Tooltip from "../ui/Tooltip.vue";

export default defineComponent({
  name: "Toolbar",
  components:{ Tooltip },
  data(){
    return {
      fileEl: null as HTMLInputElement | null,
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    undoCtrl(): any { return this.runtime?.controllers?.undo; },
    canSave(): boolean { return !!this.store?.dirty; },
    canUndo(): boolean { return this.undoCtrl?.canUndo(); },
    canRedo(): boolean { return this.undoCtrl?.canRedo(); },
    undoTooltip(): string {
      if (!this.canUndo) return "Nothing to undo";
      const label = this.undoCtrl?.peekUndo()?.label;
      return label ? `Undo: ${label}` : "Undo";
    },
    redoTooltip(): string {
      if (!this.canRedo) return "Nothing to redo";
      const label = this.undoCtrl?.peekRedo()?.label;
      return label ? `Redo: ${label}` : "Redo";
    },
    hint(): string {
      const state = this.store.currentEditState;
      switch (state) {
        case "add-link": return "Add Link: click first node, then second. Hold Shift to keep adding";
        case "add-free-node": return "Add Node: click to place. Hold Shift to keep adding";
        case "place-stashed-node": return "Placing staged node: click to place";
        case "drag-free-node": return "Dragging node";
        case "edit-selected-node":
          return this.runtime?.controllers?.selection.get()
            ? `Selected: ${this.runtime?.controllers?.selection.get()}`
            : "Edit";
        default:
          return this.store.policy.canEditStructure ? "Click a node to select" : "View mode";
      }
    }
  },
  mounted(){ this.fileEl = this.$refs.fileEl as HTMLInputElement | null; },
  methods:{
    async onSave(){ await this.store.save(); },
    async onLoad(){ await this.store.load(); },
    onExport(){
      const doc: Snapshot = {
        version: 3,
        nodes: this.store.nodes as any,
        staging: this.store.staging as any,
        bonuses: this.store.bonuses,
        meta: { savedAt: new Date().toISOString() }
      };
      exportSnapshot("investigation-web.json", doc);
    },
    triggerImport(){ this.fileEl?.click(); },
    async onImportChange(ev: Event){
      const input = ev.target as HTMLInputElement;
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const ok = this.store.setRawSnapshot(parsed);
        if (!ok) alert("Invalid snapshot data.");
      } catch {
        alert("Failed to import file.");
      } finally {
        if (this.fileEl) this.fileEl.value = "";
      }
    },
    undo(){ this.undoCtrl?.undo(); },
    redo(){ this.undoCtrl?.redo(); }
  }
});
</script>

<style scoped>
.toolbar {
  display:flex;
  align-items:center;
  gap:18px;
  padding:8px 14px;
  background: linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border:1px solid rgba(255,255,255,0.08);
  border-radius:10px;
  backdrop-filter: blur(6px);
  box-shadow:0 2px 8px -2px rgba(0,0,0,.45);
  font-size:12px;
}
.group { display:flex; gap:6px; }
.btn {
  background: rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.18);
  color: var(--text);
  padding:6px 12px;
  font-size:12px;
  border-radius:6px;
  cursor:pointer;
  letter-spacing:.3px;
  transition: background .18s, border-color .18s, color .18s;
}
.btn:hover:not(:disabled) {
  background: var(--accent);
  border-color: var(--accent);
  color:#09101f;
}
.btn:disabled { opacity:.45; cursor:default; }
.hint { color: var(--muted); font-size:12px; letter-spacing:.4px; flex:1; text-align:right; }
</style>