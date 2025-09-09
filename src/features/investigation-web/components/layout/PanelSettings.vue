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

  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "PanelSettings",
  data(){ return { store: useInvestigationWebStore() }; },
  computed:{ s():any { return this.store.settings; } },
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