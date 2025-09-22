<template>
  <div class="sim-panel">
    <h3>Simulation</h3>
    <div class="row">
      <button class="btn" :class="{ running: s.running }" @click="toggle">
        {{ s.running ? 'Stop' : 'Start' }}
      </button>
      <button class="btn" @click="nudge">Nudge</button>
      <button class="btn" @click="heat">Reheat</button>
    </div>
    <div class="grid">
      <label>
        <span>Alpha</span>
        <input type="number" step="0.01" min="0" max="1" :value="s.alpha" @change="num('alpha',$event)" />
      </label>
      <label>
        <span>Alpha Decay</span>
        <input type="number" step="0.001" min="0.000" max="0.05" :value="s.alphaDecay" @change="num('alphaDecay',$event)" />
      </label>
      <label>
        <span>Velocity Decay</span>
        <input type="number" step="0.01" min="0" max="0.9" :value="s.velocityDecay" @change="num('velocityDecay',$event)" />
      </label>
      <label>
        <span>Charge</span>
        <input type="number" step="10" :value="s.chargeStrength" @change="num('chargeStrength',$event)" />
      </label>
      <label>
        <span>Link Dist</span>
        <input type="number" step="5" :value="s.linkDistance" @change="num('linkDistance',$event)" />
      </label>
      <label>
        <span>Link Strength</span>
        <input type="number" step="0.01" min="0" max="1" :value="s.linkStrength" @change="num('linkStrength',$event)" />
      </label>
      <label>
        <span>Collide Radius</span>
        <input type="number" step="5" min="0" :value="s.collideRadius" @change="num('collideRadius',$event)" />
      </label>
      <label>
        <span>Gravity X</span>
        <input type="number" step="5" :value="s.gravityX" @change="num('gravityX',$event)" />
      </label>
      <label>
        <span>Gravity Y</span>
        <input type="number" step="5" :value="s.gravityY" @change="num('gravityY',$event)" />
      </label>
      <label class="row wide">
        <input type="checkbox" :checked="s.center" @change="bool('center',$event)" />
        <span>Center force</span>
      </label>
    </div>
    <div class="presets">
      <div class="row">
        <select @change="applySimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Apply Preset --</option>
          <option v-for="p in store.presets.simulation" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
        <button class="btn" @click="saveSimPreset">Save</button>
      </div>
      <div class="row">
        <select @change="removeSimPreset(($event.target as HTMLSelectElement).value)">
          <option value="">-- Remove Preset --</option>
          <option v-for="p in store.presets.simulation" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
    </div>
    <p class="hint muted small">
      Only Simulation nodes move. Links to non-simulation nodes act as anchors.
    </p>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
export default defineComponent({
  name:"PanelSimulation",
  setup(){
    const store = useInvestigationWebStore();
    return { store };
  },
  computed:{
    s():any { return this.store.simulation; }
  },
  methods:{
    num(k:string, e:Event){ this.store.updateSimSettings({ [k]: Number((e.target as HTMLInputElement).value) }); },
    bool(k:string, e:Event){ this.store.updateSimSettings({ [k]: (e.target as HTMLInputElement).checked }); },
    toggle(){ this.store.toggleSimulation(); },
    nudge(){
      for (const n of this.store.nodes){
        if (n.sim?.enabled){
          n.sim.vx = (n.sim.vx||0) + (Math.random()-0.5)*5;
          n.sim.vy = (n.sim.vy||0) + (Math.random()-0.5)*5;
        }
      }
      this.store.updateSimSettings({ alpha: Math.min(1, this.s.alpha + 0.05) });
      if (!this.s.running) this.store.startSimulation();
    },
    heat(){
      this.store.updateSimSettings({ alpha: 0.9 });
      if (!this.s.running) this.store.startSimulation();
    },
    saveSimPreset(){
      const name = prompt("Preset name?","Simulation");
      if (!name) return;
      const desc = prompt("Description?","Simulation preset") || "";
      this.store.addSimulationPreset(name, desc);
    },
    applySimPreset(id:string){
      if (!id) return;
      this.store.applySimulationPreset(id);
    },
    removeSimPreset(id:string){
      if (!id) return;
      if (confirm("Remove simulation preset?")) this.store.removeSimulationPreset(id);
    },
  }
});
</script>
<style scoped>
.sim-panel { display:flex; flex-direction:column; gap:10px; font-size:12px; color:var(--text); }
h3 { margin:0; font-size:14px; color: var(--accent); }
.row { display:flex; gap:8px; flex-wrap:wrap; }
.btn {
  background: rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.18);
  padding:6px 10px;
  font-size:12px;
  color:var(--text);
  border-radius:6px;
  cursor:pointer;
}
.btn.running { background: var(--accent); color:#0b1020; }
.grid { display:grid; grid-template-columns: repeat(auto-fill,minmax(120px,1fr)); gap:8px; }
label { display:flex; flex-direction:column; gap:4px; font-size:11px; }
input[type=number] {
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.15);
  color:var(--text);
  padding:4px 6px;
  border-radius:4px;
  font-size:11px;
}
.wide { grid-column: 1 / -1; flex-direction:row; align-items:center; }
.hint { margin:4px 0 0; }
.small { font-size:11px; }
.muted { color: var(--muted); }
.presets { border-top: 1px solid rgba(255,255,255,0.1); padding-top:10px; }
</style>