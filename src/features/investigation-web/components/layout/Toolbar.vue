<template>
  <div class="toolbar">
    <div class="group">
      <button class="btn" @click="$emit('save')" :disabled="!canSave">Save</button>
      <button class="btn" @click="$emit('load')">Load</button>
      <button class="btn" @click="$emit('export')">Export</button>
      <button class="btn" @click="triggerImport">Import</button>
      <input ref="fileEl" type="file" accept=".json,.js,application/json" style="display:none" @change="onImportChange" />
    </div>
    <div class="hint" v-if="hint">{{ hint }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "Toolbar",
  emits: ["save","load","export","import"],
  props: {
    canSave: { type: Boolean, default: false },
    hint: { type: String, default: "" },
  },
  data() {
    return { fileEl: null as HTMLInputElement | null };
  },
  mounted() {
    this.fileEl = this.$refs.fileEl as HTMLInputElement | null;
  },
  methods: {
    triggerImport(){ this.fileEl?.click(); },
    async onImportChange(ev: Event){
      const input = ev.target as HTMLInputElement;
      const file = input.files && input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        this.$emit("import", parsed);
      } catch {
        alert("Failed to import file.");
      } finally {
        if (this.fileEl) this.fileEl.value = "";
      }
    },
  },
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