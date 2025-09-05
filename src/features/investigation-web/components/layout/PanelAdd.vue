<template>
  <div class="add-panel">
    <h3>Add</h3>
    <div class="tools">
      <button
        class="tool-btn"
        :class="{ on: store.tools.addFreeNode }"
        @click="toggleAddFree"
      >Add Free Node</button>

      <button
        class="tool-btn"
        :class="{ on: store.tools.editDefaults }"
        @click="toggleEditDefaults"
      >Customize New Node Defaults</button>
    </div>
    <p class="muted small" v-if="store.tools.addFreeNode">Click on empty space to place a new node.</p>
    <p class="muted small" v-else-if="store.tools.editDefaults">Edit panel shows default node template.</p>
    <p class="muted small" v-else>Select a tool.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "PanelAdd",
  data(){ return { store: useInvestigationWebStore() }; },
  methods:{
    toggleAddFree(){ this.store.setAddFreeNode(!this.store.tools.addFreeNode); },
    toggleEditDefaults(){ this.store.setEditDefaults(!this.store.tools.editDefaults); }
  }
});
</script>

<style scoped>
.add-panel { display:flex; flex-direction:column; gap:12px; color:var(--text); }
h3 { margin:0 0 4px; font-size:14px; }
.tools { display:flex; flex-wrap:wrap; gap:8px; }
.tool-btn {
  background: rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.14);
  color: var(--text);
  padding:6px 12px;
  font-size:12px;
  border-radius:6px;
  cursor:pointer;
  transition: background .18s, border-color .18s;
}
.tool-btn.on {
  background: var(--accent);
  border-color: var(--accent);
  color:#0b1020;
  font-weight:600;
  box-shadow:0 0 0 1px var(--accent) inset;
}
.muted { color: var(--muted); }
.small { font-size:11px; line-height:1.3; }
</style>