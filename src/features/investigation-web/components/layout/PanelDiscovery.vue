<template>
  <div class="panel-discovery">
    <h3>Discovery</h3>

    <div class="group">
      <label class="inline">
        <span>Mode</span>
        <select class="sel" :value="s.mode" @change="setMode(($event.target as HTMLSelectElement).value as any)">
          <option value="free">Free discovery</option>
          <option value="connected">Connected (require all prerequisites)</option>
        </select>
      </label>

      <label class="row">
        <input type="checkbox" :checked="allowUndiscover" @change="setAllow(($event.target as HTMLInputElement).checked)" />
        <span>Allow un-discover</span>
      </label>
    </div>

    <div class="group">
      <label class="inline">
        <span>Visibility</span>
        <select class="sel" :value="s.visibility.mode" @change="setVis(($event.target as HTMLSelectElement).value as any)">
          <option value="hide">Hide undiscovered</option>
          <option value="frontier">Show frontier</option>
          <option value="all">Show all</option>
        </select>
      </label>
      <label class="inline" v-if="s.visibility.mode === 'frontier'">
        <span>Frontier depth</span>
        <input class="rng" type="range" min="0" max="5" step="1" :value="s.visibility.depth" @input="setDepth(Number(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" min="0" step="1" :value="s.visibility.depth" @change="setDepth(Number(($event.target as HTMLInputElement).value))" />
      </label>
    </div>

    <div class="group">
      <div class="row stats">
        <span>Discovered</span><b>{{ discovered.size }}</b>
        <span>Discoverable</span><b>{{ discoverable.size }}</b>
      </div>
      <div class="row">
        <button class="btn" @click="discoverAll">Discover all</button>
        <button class="btn" @click="clearAll" :disabled="discovered.size===0">Clear</button>
      </div>
    </div>

    <p class="hint muted">
      When this drawer is open, undiscovered nodes are dimmed here (GM preview).
      Players will see only nodes allowed by the visibility setting.
    </p>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import type { InvestigationRuntime } from "../../context/runtime";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "PanelDiscovery",
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    s(): any { return this.store.discovery; },
    discovered(): Set<string> { return this.store.discoveredIdSet; },
    discoverable(): Set<string> { return this.store.discoverableIdSet; },
    allowUndiscover(): boolean { return !!this.store.discovery.allowUndiscover; },
  },
  methods:{
    setMode(m: "free"|"connected"){ this.store.setDiscoveryMode(m); },
    setAllow(on:boolean){ this.store.setAllowUndiscover(on); },
    setVis(m: "hide"|"frontier"|"all"){ this.store.setDiscoveryVisibilityMode(m); },
    setDepth(d:number){ this.store.setDiscoveryDepth(d); },
    discoverAll(){ this.store.setDiscovered(this.store.nodes.map((n:any)=>n.id)); },
    clearAll(){ this.store.clearDiscovered(); },
  }
});
</script>

<style scoped>
.panel-discovery { display:flex; flex-direction:column; gap:14px; color:var(--text); font-size:13px; color-scheme: dark; }
/* Ensures system dropdown uses dark popup on supported browsers */
.inline .sel { color-scheme: dark; }
h3 { margin:0; font-size:14px; font-weight:600; color: var(--accent); }
.group { display:flex; flex-direction:column; gap:10px; }
.row { display:flex; align-items:center; gap:10px; }
.inline { display:flex; align-items:center; gap:8px; justify-content:space-between; flex-wrap:wrap; }
.sel, .num, .rng {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.2);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
}
.num { width: 80px; }
.stats { justify-content:space-between; }
.btn {
  background: rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.2);
  color: var(--text);
  padding:6px 12px;
  border-radius:6px;
  font-size:12px;
  cursor:pointer;
}
.btn:hover { background: var(--accent); color:#0b1226; border-color: var(--accent); }
.hint { font-size:11px; margin:0; }
.muted { color: var(--muted); }
</style>