<template>
  <div class="add-panel">
    <h3 class="title">Add</h3>
    <div class="row">
      <button class="btn" :class="{ active: store.tools.addFreeNode }" @click="toggleFree">Add Free Node</button>
      <button class="btn" :class="{ active: store.tools.addSimNode }" @click="toggleSim">Add Simulation Node</button>
      <button class="btn" :class="{ active: store.tools.addSnapNode }" @click="toggleSnap">Add Snap Node</button>
      <button class="btn" :class="{ active: store.tools.addLink }" @click="toggleLink">Add Link</button>
      <button class="btn" :class="{ active: store.tools.addTrack }" @click="toggleTrack">Add Track</button>
      <button class="btn" :class="{ active: store.tools.addCalcGroup }" @click="toggleCalcGroup">Add Calculated Tracks</button>
      <button class="btn" :class="{ active: store.tools.linkLasso }" @click="toggleLinkLasso">Link Lasso</button>
      <button class="btn" :class="{ active: store.tools.linkCutter }" @click="toggleLinkCutter">Link Cutter</button> <!-- NEW -->
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
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setAddFreeNode(on);
      if (on){
        this.store.setAddSnapNode(false);
        this.store.setAddLink(false);
        this.store.setAddTrack(false);
        this.store.setAddCalcGroup(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleSim(){
      const on = !this.store.tools.addSimNode;
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setAddSimNode(on);
      if (on){
        this.store.setAddFreeNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddLink(false);
        this.store.setAddTrack(false);
        this.store.setAddCalcGroup(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleSnap(){
      const on = !this.store.tools.addSnapNode;
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setAddSnapNode(on);
      if (on){
        this.store.setAddFreeNode(false);
        this.store.setAddLink(false);
        this.store.setAddTrack(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null); // resets staged snap toggle first
      }
    },
    toggleLink(){
      const on = !this.store.tools.addLink;
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setAddLink(on);
      if (on){
        this.store.setAddFreeNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddTrack(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleTrack(){
      const on = !this.store.tools.addTrack;
      this.store.setAddTrack(on);
      if (on){
        this.runtime?.controllers.linkPlacement.cancel();
        this.store.setAddFreeNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddLink(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleCalcGroup(){
      const on = !this.store.tools.addCalcGroup;
      this.store.setAddCalcGroup(on);
      if (on){
        this.store.setAddFreeNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddLink(false);
        this.store.setAddTrack(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleLinkLasso(){
      const on = !this.store.tools.linkLasso;
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setLinkLasso(on);
      if (on){
        this.store.setLinkCutter(false);
        this.store.setAddLink(false);
        this.store.setAddFreeNode(false);
        this.store.setAddSimNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddTrack(false);
        this.store.setAddCalcGroup(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
    toggleLinkCutter(){              // NEW
      const on = !this.store.tools.linkCutter;
      this.runtime?.controllers?.linkPlacement?.cancel();
      this.store.setLinkCutter(on);
      if (on){
        this.store.setLinkLasso(false);
        this.store.setAddLink(false);
        this.store.setAddFreeNode(false);
        this.store.setAddSimNode(false);
        this.store.setAddSnapNode(false);
        this.store.setAddTrack(false);
        this.store.setAddCalcGroup(false);
        this.store.setPlaceStaged(null);
        this.store.setPlaceStagedSnap(null);
      }
    },
  }
});
</script>

<style scoped>
.title { margin:0 0 8px; font-size:13px; letter-spacing:.5px; color: var(--accent); }
.row { display:flex; flex-wrap: wrap; align-items:center; gap:8px; margin-bottom:6px; }
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
.sel {
  flex: 1;
  min-width: 180px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: background .18s, border-color .18s, color .18s, box-shadow .18s;
}
.sel:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); }
</style>