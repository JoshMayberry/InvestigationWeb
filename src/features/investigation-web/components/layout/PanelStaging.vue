<template>
  <div class="staging-root staging-panel">
    <div class="head">
      <h3>Staging ({{ store.staging.length }})</h3>
      <button class="mini" @click="add">+ Node</button>
    </div>
    <p v-if="!store.staging.length" class="muted small">Drag nodes here to stash them.</p>
    <ul class="list">
      <li v-for="n in store.staging" :key="n.id" class="item" :class="{ active: store.tools.placeStagedId === n.id }"
          :data-id="n.id"
          @mouseenter="onEnterStage(n, $event)" @mouseleave="onLeaveStage"
      >
        <div class="row">
          <span class="dot" :style="{ background: n.color || 'var(--ok)' }"></span>
          <span class="lbl">{{ n.label || n.id }}</span>
          <label class="sim-flag">
            <input type="checkbox" :checked="!!n.sim?.enabled"
                   @change="toggleSim(n.id, $event.target.checked)" />
            <span>Sim</span>
          </label>
          <button
            class="place"
            :class="{ on: store.tools.placeStagedId === n.id }"
            @click="togglePlace(n.id)"
          >{{ store.tools.placeStagedId === n.id ? 'Cancel' : 'Place Free' }}</button>
          <button
            class="place"
            :class="{ on: store.tools.placeStagedSnapId === n.id }"
            @click="togglePlaceSnap(n.id)"
          >{{ store.tools.placeStagedSnapId === n.id ? 'Cancel' : 'Place Snap' }}</button>
          <button class="del" @click="del(n.id)">×</button>
        </div>
      </li>
    </ul>
    <p v-if="store.tools.placeStagedId" class="hint small muted">Click on the web to place staged node...</p>

    <!-- Tooltip anchored to the hovered list item's dot -->
    <!-- <NodeTooltip
      :node="hoveredNode"
      :active="!!hoveredNode"
      placement="right"
      :anchorEl="anchorEl"
    /> -->
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";
import NodeTooltip from "../../components/web/NodeTooltip.vue";

export default defineComponent({
  name: "PanelStaging",
  components: { NodeTooltip },
  data(){ return {
    store: useInvestigationWebStore(),
    runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null,
    hoveredNode: null as any | null,
    anchorEl: null as HTMLElement | null,
  }; },
  methods:{
    add(){ this.store.addStaged(); },
    onEnterStage(n:any, e: MouseEvent){
      try { this.runtime?.controllers?.hover?.set?.(n.id); } catch(e){}
      this.hoveredNode = n;
      // Prefer the .dot element as anchor; fall back to the list item
      const li = e.currentTarget as HTMLElement;
      const dot = li?.querySelector?.(".dot") as HTMLElement | null;
      this.anchorEl = dot || li || null;
    },
    onLeaveStage(){
      try { this.runtime?.controllers?.hover?.clear?.(); } catch(e){}
      this.hoveredNode = null;
      this.anchorEl = null;
    },
    del(id:string){
      if (this.store.settings.confirmDeleteStaging && !confirm("Delete staged node?")) return;
      this.store.deleteNode(id);
      if (this.store.tools.placeStagedId === id) this.store.setPlaceStaged(null);
    },
    togglePlace(id:string){
      if (this.store.tools.placeStagedId === id) this.store.setPlaceStaged(null);
      else this.store.setPlaceStaged(id);
    },
    togglePlaceSnap(id:string){
      if (this.store.tools.placeStagedSnapId === id) this.store.setPlaceStagedSnap(null);
      else this.store.setPlaceStagedSnap(id);
    },
    toggleSim(id:string, on:boolean){
      const n = this.store.staging.find((x:any)=> x.id===id);
      if (!n) return;
      if (on){ n.sim = { ...(n.sim||{}), enabled:true }; }
      else if (n.sim){ n.sim.enabled = false; }
    },
    changeKind(id:string, kind:string){
      const n = this.store.staging.find((x:any)=> x.id===id);
      if (!n) return;
      if (kind === 'sim') n.kind = 'sim';
      else n.kind = 'free';
    }
  }
});
</script>

<style scoped>
.staging-root { display:flex; flex-direction:column; gap:10px; color:var(--text); }
.head { display:flex; align-items:center; justify-content:space-between; }
h3 { margin:0; font-size:14px; }
.mini {
  background: rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.18);
  color: var(--text);
  font-size:11px;
  padding:4px 8px;
  border-radius:6px;
  cursor:pointer;
}
.list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:6px; }
.item { background: rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:6px; padding:6px 8px; }
.item.active { outline: 1px solid var(--accent); }
.row { display:flex; align-items:center; gap:8px; }
.dot { width:14px; height:14px; border-radius:50%; box-shadow:0 0 4px rgba(0,0,0,.4); }
.lbl { flex:1; font-size:12px; }
.place, .del {
  background: rgba(255,255,255,0.10);
  border:1px solid rgba(255,255,255,0.18);
  color: var(--text);
  font-size:11px;
  padding:3px 6px;
  border-radius:5px;
  cursor:pointer;
}
.place.on {
  background: var(--accent);
  color: #0b1020;
  border-color: var(--accent);
  font-weight:600;
}
.del { background: rgba(255,60,60,0.15); border-color: rgba(255,60,60,0.35); }
.small { font-size:11px; }
.muted { color: var(--muted); }
.hint { margin-top:6px; }
.kind {
  background: rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.18);
  color:var(--text);
  font-size:11px;
  padding:2px 4px;
  border-radius:4px;
}
.sim-flag { display:inline-flex; align-items:center; gap:4px; font-size:11px; }
</style>