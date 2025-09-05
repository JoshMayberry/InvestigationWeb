<template>
  <div class="settings-panel">
    <h3>Settings</h3>
    <div class="group">
      <label class="row">
        <input type="checkbox" :checked="confirmDeleteNode" @change="$emit('setting:change', { key: 'confirmDeleteNode', value: ($event.target as HTMLInputElement).checked })" />
        <span>Confirm before deleting node</span>
      </label>
      <label class="row">
        <input type="checkbox" :checked="confirmDeleteStaging" @change="$emit('setting:change', { key: 'confirmDeleteStaging', value: ($event.target as HTMLInputElement).checked })" />
        <span>Confirm before deleting staged node</span>
      </label>
      <label class="row">
        <input type="checkbox" :checked="enforceNoOverlap" @change="$emit('setting:change', { key: 'enforceNoOverlap', value: ($event.target as HTMLInputElement).checked })" />
        <span>Prevent node overlap</span>
      </label>
      <div class="row sub" v-if="enforceNoOverlap">
        <label class="inline">
          <span>Node padding</span>
          <input
            class="num"
            type="number"
            :value="nodePadding"
            step="1"
            @change="$emit('setting:change', { key: 'nodePadding', value: Number(($event.target as HTMLInputElement).value) })"
          />
        </label>
      </div>
      <label class="row" v-if="enforceNoOverlap">
        <input type="checkbox" :checked="showPadPreview" @change="$emit('setting:change', { key: 'showPadPreview', value: ($event.target as HTMLInputElement).checked })" />
        <span>Show padding areas</span>
      </label>
    </div>
    <p class="hint muted">Overlap prevention uses padding added to combined radii. Negative padding allows slight overlap.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  name: "PanelSettings",
  props: {
    confirmDeleteNode: { type: Boolean, default: true },
    confirmDeleteStaging: { type: Boolean, default: true },
    enforceNoOverlap: { type: Boolean, default: false },
    nodePadding: { type: Number, default: 0 },
    showPadPreview: { type: Boolean, default: false },
    drawer: { type: Object, default: () => ({}) },
  },
  emits: ["setting:change"],
});
</script>

<style scoped>
.settings-panel { display:flex; flex-direction:column; gap:14px; color:var(--text); font-size:13px; }
h3 { margin:0; font-size:14px; font-weight:600; color: var(--accent); }
.group { display:flex; flex-direction:column; gap:10px; }
.row { display:flex; align-items:center; gap:10px; font-size:12px; }
.row input { cursor:pointer; }
.hint { font-size:11px; line-height:1.3; margin:0; }
.muted { color: var(--muted); }
.sub { padding-left:18px; }
.inline { display:flex; align-items:center; gap:6px; }
.num {
  width:80px;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.2);
  color:var(--text);
  padding:2px 6px;
  border-radius:4px;
  font-size:12px;
}
</style>