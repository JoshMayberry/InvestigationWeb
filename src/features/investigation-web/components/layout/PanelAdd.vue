<template>
  <div class="add-panel">
    <h3 class="title">Add</h3>
    <div class="row">
      <button class="btn" :class="{ active: store.tools.addFreeNode }" @click="toggleFree">Add Node</button>
      <button class="btn" :class="{ active: store.tools.addLink }" @click="toggleLink">Add Link</button>
      <button class="btn" :class="{ active: store.tools.addTrack }" @click="toggleTrack">Add Track</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, onBeforeUnmount } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY, type InvestigationRuntime } from "../../context/runtime";

export default defineComponent({
  name: "PanelAdd",
  setup(){
    const store = useInvestigationWebStore();
    const runtime = inject(RUNTIME_KEY, null) as InvestigationRuntime | null;
    onBeforeUnmount(() => {
      if (store.tools.addLink) runtime?.controllers.linkPlacement.cancel();
      store.closeAddPanel();
    });
    return { store, runtime };
  },
  methods:{
    toggleFree(){
      const on = !this.store.tools.addFreeNode;
      this.store.setAddFreeNode(on);
      if (on) {
        // Cancel any active link ghost when switching tools
        this.runtime?.controllers.linkPlacement.cancel();
        this.store.setAddLink(false);
        this.store.setPlaceStaged(null);
        this.runtime?.controllers.selection.clear();
      }
    },
    toggleLink(){
      const on = !this.store.tools.addLink;
      // Always cancel current ghost so we restart fresh if re-enabled
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setAddLink(on);
      if (on) {
        this.store.setAddFreeNode(false);
        this.store.setAddTrack(false);
        this.store.setPlaceStaged(null);
        this.runtime?.controllers?.selection?.clear?.();
      }
    },
    toggleTrack(){
      const on = !this.store.tools.addTrack;
      this.store.setAddTrack(on);
      if (on) {
        // Cancel any active link ghost when switching tools
        this.runtime?.controllers.linkPlacement.cancel();
        this.store.setAddFreeNode(false);
        this.store.setAddLink(false);
        this.store.setPlaceStaged(null);
        this.runtime?.controllers.selection.clear();
      }
    }
  }
});
</script>

<style scoped>
.title { margin:0 0 8px; font-size:13px; letter-spacing:.5px; color: var(--accent); }
.row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
.btn {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background .18s, border-color .18s, color .18s, box-shadow .18s;
}
.btn:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
.btn.active { background: var(--accent); color: #0b1020; border-color: var(--accent); box-shadow: 0 2px 10px -2px rgba(0,0,0,.5); }
</style>