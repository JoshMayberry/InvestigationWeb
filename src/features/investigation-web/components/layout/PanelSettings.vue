<template>
  <div class="settings-panel">
    <h3>Settings</h3>
    <div class="group">
      <label class="row">
        <input type="checkbox" :checked="s.confirmDeleteNode" @change="set('confirmDeleteNode', $event)" />
        <span>Confirm before deleting node</span>
      </label>
      <label class="row">
        <input type="checkbox" :checked="s.confirmDeleteStaging" @change="set('confirmDeleteStaging', $event)" />
        <span>Confirm before deleting staged node</span>
      </label>
      <label class="row">
        <input type="checkbox" :checked="s.enforceNoOverlap" @change="set('enforceNoOverlap', $event)" />
        <span>Prevent node overlap</span>
      </label>
      <div class="row sub" v-if="s.enforceNoOverlap">
        <label class="inline">
          <span>Node padding</span>
          <input class="num" type="number" :value="s.nodePadding" step="1" @change="setNum('nodePadding', $event)" />
        </label>
      </div>
      <label class="row" v-if="s.enforceNoOverlap">
        <input type="checkbox" :checked="s.showPadPreview" @change="set('showPadPreview', $event)" />
        <span>Show padding areas</span>
      </label>
      <p class="hint muted">Overlap prevention uses padding added to combined radii.</p>
    </div>

    <label class="row">
      <span style="flex:1">Undo merge window (ms)</span>
      <input class="num" type="number" min="50" max="5000" step="50" :value="s.undoCoalesceMs" @change="setNum('undoCoalesceMs', $event)" />
    </label>

    <label class="row">
      <span style="flex:1">Link hit radius (px)</span>
      <input class="num" type="number" min="0" max="48" step="1" :value="s.linkHitRadius ?? 10" @change="setNum('linkHitRadius', $event)" />
    </label>

    <label class="row">
      <input type="checkbox" :checked="s.preventTrackCrossing" @change="set('preventTrackCrossing', $event)" />
      <span>Prevent track crossing</span>
    </label>

    <div class="group">
      <label class="row">
        <input type="checkbox" :checked="s.enableGrid" @change="set('enableGrid', $event)" />
        <span>Enable grid (snap unless Alt)</span>
      </label>
      <div class="row" v-if="s.enableGrid">
        <span style="flex:1">Grid size</span>
        <input class="num" type="number" min="4" max="200" step="2" :value="s.gridSize" @change="setNum('gridSize', $event)" />
      </div>
      <label class="row" v-if="s.enableGrid">
        <input type="checkbox" :checked="s.gridAlwaysVisible" @change="set('gridAlwaysVisible', $event)" />
        <span>Always show grid in Edit mode</span>
      </label>
    </div>

    <div class="group">
      <label class="row">
        <span style="flex:1">Staging zone width (px)</span>
        <input class="num" type="number" min="40" max="400" step="2" :value="s.stashZoneWidth" @change="setNum('stashZoneWidth', $event)" />
      </label>
      <p class="hint muted">Right-side drop zone for moving nodes into Staging.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount } from "vue";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "PanelSettings",
  data(){ return { store: useInvestigationWebStore() }; },
  computed:{ s():any { return this.store.settings; } },
  setup() {
    const store = useInvestigationWebStore();
    onMounted(()=> store.setPanelOpen("settings", true));
    onBeforeUnmount(()=> store.setPanelOpen("settings", false));
    return {};
  },
  methods:{
    set(key:string, e:Event){
      const v = (e.target as HTMLInputElement).checked;
      this.store.setSetting(key, v);
    },
    setNum(key:string, e:Event){
      const v = Number((e.target as HTMLInputElement).value);
      this.store.setSetting(key, v);
    }
  }
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