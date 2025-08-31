<template>
  <div class="file-picker">
    <div class="toolbar">
      <button class="btn pick-root" @click="$emit('pick-root')">Choose Root Folder</button>
      <button class="btn refresh" @click="$emit('refresh')">Refresh</button>
    </div>

    <div v-if="folders && folders.length" class="folders">
      <div
        v-for="(folder, i) in folders"
        :key="folder.name"
        class="folder-row"
        :class="{ active: i === selectedIndex }"
        @click="$emit('select-folder', i)"
      >
        <span class="name">{{ folder.name }}</span>
        <span class="count">{{ folder.count }} images</span>
      </div>
    </div>
    <div v-else class="empty">No folders found. Pick a root folder.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

type DrawerMeta = { icon?: string; label?: string };
type FolderInfo = { name: string; count: number };

export default defineComponent({
  name: "FilePickerPanel",
  props: {
    drawer: { type: Object as PropType<DrawerMeta>, default: () => ({}) },
    folders: { type: Array as PropType<FolderInfo[]>, default: () => [] },
    selectedIndex: { type: Number as PropType<number | null>, default: null },
  },
  emits: ["pick-root", "select-folder", "refresh"],
});
</script>

<style scoped>
.file-picker { display: flex; flex-direction: column; gap: 12px; padding: 0.5rem; color: var(--text); }
.toolbar { display: flex; gap: 8px; }
.btn { border: none; border-radius: 6px; padding: 0.5rem 0.9rem; cursor: pointer; }
.pick-root { background: var(--warn); color: #000; }
.refresh { background: var(--accent); color: #000; }
.folders { display: flex; flex-direction: column; gap: 6px; max-height: 60vh; overflow: auto; }
.folder-row { display: flex; align-items: center; justify-content: space-between; background: var(--panel); padding: 8px 10px; border-radius: 8px; cursor: pointer; color: var(--text); }
.folder-row.active { outline: 2px solid var(--accent); }
.name { color: var(--text); }
.count { color: var(--muted); font-size: 12px; }
.empty { color: var(--muted); }
</style>