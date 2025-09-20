<template>
  <div class="toolbar">
    <div class="group">
      <button class="btn" @click="onSave" :disabled="!canSave">Save</button>
      <button class="btn" @click="onLoad">Load</button>
      <button class="btn" @click="onExport">Export</button>
      <button class="btn" @click="onImportSnapshot">Import</button>

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
import { importSnapshotFile, exportSnapshot } from "../../utils/snapshotFiles";
import { useInvestigationWebStore } from "../../stores/web";
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
      if (this.store.currentMode === 'simulation') {
        return "Simulation Mode: drag nodes directly to influence forces";
      }
      if (this.store.tools.linkLasso) {
        return "Link Lasso: hold left mouse and sweep through nodes to chain links";
      }
      if (this.store.tools.linkCutter) {             // NEW
        return "Link Cutter: hold left mouse and sweep across links to remove them";
      }
      const state = this.store.currentEditState;
      switch (state) {
        case "add-link": return "Add Link: click first node, then second. Shift = keep adding";
        case "relink": return "Relink: click a node to reassign the selected link's endpoint. Right-click or Esc to cancel.";
        case "add-free-node":
          if (this.store.tools.addSimNode) return "Add Simulation Node: click to place. Shift = keep adding";
          return "Add Free Node: click to place. Shift = keep adding";
        case "add-snap-node": return "Add Snap Node: click a track to insert evenly. Shift = keep adding";
        case "place-stashed-node": return "Place Staged Free Node: click to place";
        case "place-stashed-snap-node": return "Place Staged Snap Node: click a track to insert";
        case "drag-free-node": return "Dragging free node. Alt = ignore grid";
        case "drag-snap-node": return "Reordering snap node along track";
        case "add-track": return "Add Track: click start, click end. Ctrl = 15° snap. Shift = keep. Alt = ignore grid";
        case "drag-track-end": return "Dragging track endpoint. Alt = ignore grid";
        case "drag-track": return "Dragging track. Alt = ignore grid";
        case "edit-selected-node":
          return this.runtime?.controllers?.selection.get()
            ? `Selected: ${this.runtime?.controllers?.selection.get()}`
            : "Edit";
        case "add-calc-group": return "Add Calculated Tracks: move mouse, click to place. Alt = ignore grid";
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
        version: 4,
        nodes: this.store.nodes as any,
        staging: this.store.staging as any,
        bonuses: this.store.bonuses,
        tracks: this.store.tracks as any,
        calcGroups: this.store.calcGroups as any,
        links: this.store.links as any,
        trackSeq: this.store.trackSeq,
        linkSeq: this.store.linkSeq,
        trackDraft: this.store.trackDraft,
        linkDraft: this.store.linkDraft,
        groupDraft: this.store.groupDraft,
        customFields: this.store.customFields as any,
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
    redo(){ this.undoCtrl?.redo(); },
    async onImportSnapshot(){
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.onchange = async () => {
        const file = input.files?.[0]; if (!file) return;
        const json = await importSnapshotFile(file);
        if (!json) return;
        // Hardened merge happens inside setRawSnapshot
        this.store.setRawSnapshot(json);
      };
      input.click();
    },
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