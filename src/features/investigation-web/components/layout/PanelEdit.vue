<template>
  <div class="edit-main">
    <h3 class="title">Edit</h3>

    <!-- Default template editing -->
    <div v-if="editDefaultsActive" class="form">
      <div class="block-title">New Node Defaults</div>
      <label>
        <span>Label</span>
        <input :value="defaultNode.label" @input="onDefaultChange('label', ($event.target as HTMLInputElement).value)" />
      </label>
      <label>
        <span>Color</span>
        <input type="color" :value="defaultNode.color" @input="onDefaultChange('color', ($event.target as HTMLInputElement).value)" />
      </label>
      <label class="range">
        <span>Radius</span>
        <input type="range" min="6" max="36" :value="defaultNode.r" @input="onDefaultChange('r', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ defaultNode.r }}</span>
      </label>
      <p class="muted small">Changes save immediately as defaults.</p>
    </div>

    <!-- Normal node editing -->
    <div v-else-if="selectedNode" class="form">
      <label>
        <span>ID</span>
        <input :value="selectedNode.id" disabled />
      </label>

      <label>
        <span>Label</span>
        <input :value="selectedNode.label || ''" @input="onChange('label', ($event.target as HTMLInputElement).value)" />
      </label>

      <label>
        <span>Color</span>
        <input type="color" :value="selectedNode.color || defaultNode.color" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
      </label>

      <label class="range">
        <span>Radius</span>
        <input type="range" min="6" max="36" :value="selectedNode.r" @input="onChange('r', Number(($event.target as HTMLInputElement).value))" />
        <span class="pill">{{ selectedNode.r }}</span>
      </label>

      <div class="actions">
        <button class="secondary" @click="setAsDefaults">Set As Default</button>
        <button class="danger" @click="$emit('node:delete', selectedNode.id)">Delete</button>
        <button class="secondary" @click="$emit('node:duplicate', selectedNode.id)">Duplicate → Staging</button>
      </div>
    </div>

    <div v-else class="empty">
      <em>No node selected.</em>
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
    editDefaultsActive: { type: Boolean, default: false },
    defaultNode: { type: Object as PropType<{ r:number;color:string;label:string }>, default: () => ({ r:14,color:"#10b981",label:"New"}) },
  },
  emits: ["node:update","node:delete","node:duplicate","defaults:update","defaults:setFromNode"],
  methods: {
    onChange(key: "label" | "color" | "r", value: any) {
      if (!this.selectedNode) return;
      this.$emit("node:update", { id: this.selectedNode.id, patch: { [key]: value } });
    },
    onDefaultChange(key: "label" | "color" | "r", value:any){
      this.$emit("defaults:update", { [key]: value });
    },
    setAsDefaults(){
      if (!this.selectedNode) return;
      this.$emit("defaults:setFromNode", this.selectedNode.id);
    }
  },
});
</script>

<style scoped>
.edit-main { display: flex; flex-direction: column; gap: 12px; color: var(--text); }
.title { margin: 0 0 6px; color: var(--text); }
.empty { color: var(--muted); }
.form { display:flex; flex-direction:column; gap:10px; }
.form label { display: flex; flex-direction: column; gap: 6px; }
.form input[type="text"], .form input[type="color"], .form input[type="range"] {
  padding: 6px 10px; border-radius: 6px; border: 1px solid var(--accent); background: rgba(255,255,255,0.07); color: var(--text);
}
.block-title { font-size:12px; font-weight:600; letter-spacing:.5px; color: var(--accent); }
.pill { display: inline-block; padding: 2px 8px; border-radius: 999px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.08); font-size: 12px; color: var(--muted); margin-left: 0.5em; }
.actions { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
.actions button {
  font-size:11px;
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
  border:1px solid rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.08);
  color: var(--text);
}
.actions .danger {
  background: rgba(255,60,60,0.18);
  border-color: rgba(255,60,60,0.45);
}
.actions .secondary {
  background: rgba(96,165,250,0.15);
  border-color: rgba(96,165,250,0.4);
}
.range { align-items:flex-start; }
.muted.small { font-size:11px; color:var(--muted); }
</style>