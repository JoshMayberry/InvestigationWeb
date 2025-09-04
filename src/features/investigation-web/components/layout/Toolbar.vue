<template>
  <div class="toolbar">
    <button @click="$emit('save')" :disabled="!canSave">Save</button>
    <button @click="$emit('load')">Load</button>
    <button @click="$emit('export')">Export</button>
    <button @click="triggerImport">Import</button>
    <input ref="fileEl" type="file" accept=".json,.js,application/json" style="display:none" @change="onImportChange" />
    <span v-if="hint" class="hint">{{ hint }}</span>
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
      } catch (e) {
        console.error(e);
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
  display: flex;
  gap: 8px;
  align-items: center;
}
.hint { color: var(--muted); font-size: 12px; }
</style>