<template>
  <div class="edit-main">
    <h3 class="title">Edit</h3>

    <div v-if="!selectedNode" class="empty">
      <em>No node selected.</em>
    </div>

    <div v-else class="form">
      <label>
        <span>ID</span>
        <input :value="selectedNode.id" />
      </label>

      <label>
        <span>Label</span>
        <input :value="selectedNode.label || ''" @input="onChange('label', ($event.target as HTMLInputElement).value)" />
      </label>

      <label>
        <span>Color</span>
        <input type="color" :value="selectedNode.color || '#34d399'" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
      </label>

      <label>
        <span>Radius</span>
        <input type="range" min="6" max="36" :value="selectedNode.r" @input="onChange('r', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ selectedNode.r }}</span>
      </label>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { NodeAny } from "../../types/node";
import type { DrawerMeta } from "@shared/types";

export default defineComponent({
  name: "PanelEdit",
  props: {
    drawer: { type: Object as PropType<DrawerMeta>, default: () => ({}) },
    selectedNode: { type: Object as PropType<NodeAny | null>, default: null },
  },
  emits: ["node:update"],
  methods: {
    onChange(key: "label" | "color" | "r", value: any) {
      if (!this.selectedNode) return;
      this.$emit("node:update", { id: this.selectedNode.id, patch: { [key]: value } });
    },
  },
});
</script>

<style scoped>
.edit-main { display: flex; flex-direction: column; gap: 12px; color: var(--text); }
.title { margin: 0 0 6px; color: var(--text); }
.empty { color: var(--muted); }
.form label { display: flex; flex-direction: column; gap: 6px; }
.form input[type="text"], .form input[type="color"], .form input[type="range"] {
  padding: 6px 10px; border-radius: 6px; border: 1px solid var(--accent); background: rgba(255,255,255,0.07); color: var(--text);
}
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); font-size: 12px; color: var(--muted); margin-left: 0.5em; }
</style>