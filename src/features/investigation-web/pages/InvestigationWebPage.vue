<template>
  <div class="iw-page" v-if="store">
    <Toolbar
      :canSave="isDirty"
      :hint="hintText"
      @save="save"
      @load="load"
      @export="onExport"
      @import="onImport"
    />
    <div class="layout">
      <DrawersLeft
        :selectedNode="selectedNode"
        :bonuses="store.bonuses"
        :filters="store.filters"
        :filtersActive="store.filtersActive"
        :palette="store.colorPalette"
        :matchCount="store.filteredIdSet.size"
        :totalNodes="store.nodeCount"
        :confirmDeleteNode="store.settings.confirmDeleteNode"
        :confirmDeleteStaging="store.settings.confirmDeleteStaging"
        :enforceNoOverlap="store.settings.enforceNoOverlap"
        :nodePadding="store.settings.nodePadding"
        :showPadPreview="store.settings.showPadPreview"
        :editDefaults="store.tools.editDefaults"
        :defaultNode="store.settings.defaultNode"
        @node:update="onNodePatch"
        @node:delete="onNodeDelete"
        @node:duplicate="onNodeDuplicate"
        @filter:query="store.setFilterQuery($event)"
        @filter:toggleColor="store.toggleFilterColor($event)"
        @filter:clear="store.clearFilters()"
        @setting:change="onSettingChange"
        @defaults:update="onDefaultsUpdate"
        @defaults:setFromNode="onDefaultsSetFromNode"
        @mode:edit="onEditMode"
      />
      <InvestigationWeb
        class="canvas"
        :nodes="store.nodes"
        :stagedNodes="store.staging"
        :policy="policy"
        :selectedId="selectedNode?.id || null"
        :filteredIds="store.filteredIdSet"
        :filtersActive="store.filtersActive"
        :editMode="policy.canEditStructure"
        :addFreeNode="store.tools.addFreeNode"
        :placeStagedId="store.tools.placeStagedId"
        :enforceNoOverlap="store.settings.enforceNoOverlap"
        :nodePadding="store.settings.nodePadding"
        :showPadPreview="store.settings.showPadPreview"
        @select:node="onNodeSelect"
        @update:nodes="onNodesUpdate"
        @node:add="onNodeAddAt"
        @node:droppedToStaging="onDroppedToStaging"
        @canvas:point="onCanvasPoint"
        @tool:cancel="onToolCancel"
      />
      <DrawersRight
        :staging="store.staging"
        :addFreeNode="store.tools.addFreeNode"
        :placeStagedId="store.tools.placeStagedId"
        :editDefaults="store.tools.editDefaults"
        @staging:add="onStagingQuickAdd"
        @staging:delete="onStagingDelete"
        @staging:placeToggle="onStagingPlaceToggle"
        @tool:addFreeNode="onToolAddFree"
        @tool:editDefaults="onToolEditDefaults"
        @panel:change="onRightPanelChange"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import InvestigationWeb from "../components/web/InvestigationWeb.vue";
import DrawersLeft from "../components/layout/DrawersLeft.vue";
import DrawersRight from "../components/layout/DrawersRight.vue";
import Toolbar from "../components/layout/Toolbar.vue";
import type { NodeAny, NodePatch } from "../types/node";
import { useInvestigationWebStore } from "../stores/web";
import { exportSnapshot } from "../utils/snapshotFiles";
import type { Snapshot } from "../types/snapshot";
export default defineComponent({
  name: "InvestigationWebPage",
  components: { InvestigationWeb, DrawersLeft, DrawersRight, Toolbar },
  data() {
    return {
      store: null as ReturnType<typeof useInvestigationWebStore> | null,
      selectedNode: null as NodeAny | null,
      policy: { canEditStructure: false, canDiscover: false, canInteract: true },
      isEditMode: false,
      isDirty: false,
    };
  },
  created() {
    this.store = useInvestigationWebStore();
    this.store.initSettingsFromLocal();
    this.store?.$subscribe((_m, state) => { this.isDirty = state.dirty; });
  },
  mounted() { this.load(); },
  computed: {
    hintText(): string {
      if (this.selectedNode) return `Selected: ${this.selectedNode.id}`;
      if (!this.policy.canEditStructure) return "View mode";
      if (this.store?.tools.editDefaults) return "Editing new node defaults";
      if (this.store?.tools.placeStagedId) return "Placing staged node: click to place";
      if (this.store?.tools.addFreeNode) return "Add Free Node: click to place";
      return "Click a node to select";
    }
  },
  methods: {
    clearSelection(){ if (this.policy.canEditStructure) this.selectedNode = null; },
    onNodeSelect(node: NodeAny) {
      if (!this.policy.canEditStructure) return;
      this.selectedNode = (this.selectedNode && this.selectedNode.id === node.id) ? null : node;
    },
    onNodesUpdate(nodes: NodeAny[]) { this.store?.setNodes(nodes); },
    onNodePatch({ id, patch }: NodePatch) {
      this.store?.patchNode(id, patch as any);
      if (this.selectedNode?.id === id) {
        const updated = this.store?.nodes.find(n => n.id === id);
        if (updated) this.selectedNode = { ...updated };
      }
    },
    async save(){ await this.store?.save(); },
    async load(){
      const ok = await this.store?.load();
      if (!ok) {
        // remain blank; optionally seed demo nodes here (commented out)
        // this.store?.setNodes([{ id:"n1", kind:"free", x:160, y:180, r:14, color:"#60a5fa", label:"Alpha"}] as any);
      }
    },
    onNodeDuplicate(id: string) { this.store?.duplicateNodeToStaging(id); },
    onStagingQuickAdd() { this.store?.addStaged({ label: this.store?.settings.defaultNode.label }); },
    onToolAddFree(on: boolean) { this.store?.setAddFreeNode(on); },
    onExport(){
      if (!this.store) return;
      const doc: Snapshot = {
        version: 3,
        nodes: this.store.nodes as any,
        staging: this.store.staging as any,
        bonuses: this.store.bonuses,
        meta: { savedAt: new Date().toISOString() }
      };
      exportSnapshot("investigation-web.json", doc);
    },
    async onImport(raw: any){
      if (!this.store) return;
      const ok = this.store.setRawSnapshot(raw);
      if (!ok) alert("Invalid snapshot data.");
    },
    onNodeAddAt(p:{ x:number; y:number }) {
      if (!this.store) return;
      const n = this.store.addNode({ x: p.x, y: p.y });
      this.selectedNode = n;
    },
    onDroppedToStaging(p:{ id:string }) {
      if (!this.store) return;
      this.store.moveNodeToStaging(p.id);
      if (this.selectedNode?.id === p.id) this.selectedNode = null;
    },
    onSettingChange(p: { key: string; value: any }) { this.store?.setSetting(p.key, p.value); },
    onNodeDelete(id:string){
      if (!this.store) return;
      if (this.store.settings.confirmDeleteNode) {
        if (!confirm("Delete selected node?")) return;
      }
      this.store.deleteNode(id);
      if (this.selectedNode?.id === id) this.selectedNode = null;
    },
    onStagingDelete(id:string){
      if (!this.store) return;
      if (this.store.settings.confirmDeleteStaging) {
        if (!confirm("Delete staged node?")) return;
      }
      this.store.deleteNode(id);
    },
    onCanvasPoint(p:{ x:number; y:number }) {
      if (this.store?.tools.placeStagedId) {
        const id = this.store.tools.placeStagedId;
        this.store.placeFromStaging(id!, p.x, p.y);
      }
    },
    onStagingPlaceToggle(id:string){
      const cur = this.store?.tools.placeStagedId;
      this.store?.setPlaceStaged(cur === id ? null : id);
    },
    onRightPanelChange(p:{ index:number|null }) {
      if (p.index !== 1) this.store?.setAddFreeNode(false);
      if (p.index !== 0) this.store?.setPlaceStaged(null);
      if (p.index !== 1) this.store?.setEditDefaults(false);
    },
    onEditMode(open:boolean){
      this.isEditMode = open;
      this.policy = { ...this.policy, canEditStructure: open };
      if (!open) {
        this.selectedNode = null;
        this.store?.resetTools();
      }
    },
    onToolCancel() { this.store?.resetTools(); },
    // Defaults editing
    onDefaultsUpdate(p:Partial<{r:number;color:string;label:string}>){
      this.store?.updateDefaultNode(p);
    },
    onDefaultsSetFromNode(id:string){
      this.store?.setDefaultsFromNode(id);
    },
    onToolEditDefaults(on:boolean){
      this.store?.setEditDefaults(on);
    },
  }
});
</script>

<style scoped>
.iw-page {
  display: flex;
  background: black;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}
.layout {
  display: flex;
  flex-direction: row;
  min-height: 60vh;
  height: 100%;
  overflow: hidden;
  background: #0b1020;
}
.canvas-wrap {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  position: relative;
}
.investigation-web {
  flex: 1 1 auto;
  min-height: 60vh;
  height: 100%;
}
</style>