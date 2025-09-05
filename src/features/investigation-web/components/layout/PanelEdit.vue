<template>
  <div class="edit-main">
    <h3 class="title">Edit</h3>

    <div v-if="store.tools.editDefaults" class="form">
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
        <button class="danger" @click="deleteNode">Delete</button>
        <button class="secondary" @click="duplicateNode">Duplicate → Staging</button>
      </div>
    </div>

    <div v-else class="empty"><em>No node selected.</em></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "PanelEdit",
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null)
    };
  },
  computed:{
    selectionCtrl(): any { return this.runtime?.controllers?.selection; },
    undoCtrl(): any { return this.runtime?.controllers?.undo; },
    selectedNode(): any {
      const id = this.selectionCtrl?.get();
      return id ? this.store.nodes.find((n:any) => n.id === id) : null;
    },
    defaultNode(): any { return this.store.settings.defaultNode; }
  },
  methods:{
    onChange(key:"label"|"color"|"r", value:any){
      if (!this.selectedNode) return;
      const id = this.selectedNode.id;
      const beforeVal = this.selectedNode[key];
      const afterVal = value;
      this.undoCtrl.push({
        label:`edit-node-${key}`,
        _coalesceKey:`node-prop:${id}:${key}`,
        key,
        nodeId:id,
        before: { [key]: beforeVal },
        after: { [key]: afterVal },
        do: ()=> this.store.patchNode(id, { [key]: afterVal }),
        undo: ()=> this.store.patchNode(id, { [key]: beforeVal })
      });
    },
    onDefaultChange(key:"label"|"color"|"r", value:any){
      const beforeVal = this.defaultNode[key];
      const afterVal = value;
      this.undoCtrl.push({
        label:`default-${key}`,
        _coalesceKey:`default-prop:${key}`,
        key,
        before: { [key]: beforeVal },
        after: { [key]: afterVal },
        do: ()=> this.store.updateDefaultNode({ [key]: afterVal }),
        undo: ()=> this.store.updateDefaultNode({ [key]: beforeVal })
      });
    },
    setAsDefaults(){
      if (!this.selectedNode) return;
      const snapshotBefore = { ...this.defaultNode };
      const src = this.selectedNode;
      this.undoCtrl.push({
        label:"set-defaults-from-node",
        do: ()=> this.store.setDefaultsFromNode(src.id),
        undo: ()=> this.store.updateDefaultNode(snapshotBefore)
      });
    },
    deleteNode(){
      if (!this.selectedNode) return;
      if (this.store.settings.confirmDeleteNode && !confirm("Delete node?")) return;
      const node = { ...this.selectedNode };
      const id = node.id;
      this.undoCtrl.push({
        label:"delete-node",
        do: ()=> { this.store.deleteNode(id); if (this.selectionCtrl?.get()===id) this.selectionCtrl.clear(); },
        undo: ()=> {
          // Assuming store.addNode can accept full node; adjust if not
          this.store.restoreNode?.(node) || this.store.addNode(node);
        }
      });
    },
    duplicateNode(){
      if (!this.selectedNode) return;
      const origId = this.selectedNode.id;
      let newId:string|undefined;
      this.undoCtrl.push({
        label:"duplicate-to-staging",
        do: ()=> { newId = this.store.duplicateNodeToStaging(origId); },
        undo: ()=> { if (newId) this.store.deleteNode(newId); }
      });
    }
  }
});
</script>

<style scoped>
.edit-main { display:flex; flex-direction:column; gap:12px; color: var(--text); }
.title { margin:0 0 6px; color: var(--text); }
.empty { color: var(--muted); }
.form { display:flex; flex-direction:column; gap:10px; }
.form label { display:flex; flex-direction:column; gap:6px; }
.block-title { font-size:12px; font-weight:600; letter-spacing:.5px; color: var(--accent); }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08); font-size:12px; color:var(--muted); margin-left:.5em; }
.actions { display:flex; gap:8px; margin-top:8px; flex-wrap:wrap; }
.actions button {
  font-size:11px; padding:6px 10px; border-radius:6px; cursor:pointer;
  border:1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.08); color: var(--text);
}
.actions .danger { background: rgba(255,60,60,0.18); border-color: rgba(255,60,60,0.45); }
.actions .secondary { background: rgba(96,165,250,0.15); border-color: rgba(96,165,250,0.4); }
.range { align-items:flex-start; }
.muted.small { font-size:11px; color:var(--muted); }
</style>