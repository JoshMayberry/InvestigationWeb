<template>
  <div class="iw-page">
    <Toolbar
      :canSave="isDirty"
      :hint="selectedNode ? `Selected: ${selectedNode.id}` : (policy.canEditStructure ? 'Click a node to select' : 'View mode')"
      @save="save"
      @load="load"
      @export="onExport"
      @import="onImport"
    />
    <div class="layout">
      <DrawersLeft
        :selectedNode="selectedNode"
        :bonuses="store?.bonuses || []"
        :filters="store!.filters"
        :filtersActive="store!.filtersActive"
        :palette="store!.colorPalette"
        :matchCount="store!.filteredIdSet.size"
        :totalNodes="store!.nodeCount"
        @filter:query="store?.setFilterQuery($event)"
        @filter:toggleColor="store?.toggleFilterColor($event)"
        @filter:clear="store?.clearFilters()"
        @mode:edit="onEditMode"
        @node:update="onNodePatch"
      />
      <div class="canvas-wrap" @mousedown.self="clearSelection">
        <InvestigationWeb
          class="investigation-web"
          :nodes="store?.nodes || []"
          :policy="policy"
          :selectedId="selectedNode?.id || null"
          :clamp-to-viewport="true"
          :filteredIds="store?.filteredIdSet || new Set()"
          :filtersActive="store?.filtersActive || false"
          :editMode="policy.canEditStructure"
          @select:node="onNodeSelect"
          @update:nodes="onNodesUpdate"
        />
      </div>
      <DrawersRight :open="isEditMode" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import InvestigationWeb from "../components/web/InvestigationWeb.vue";
import DrawersLeft from "../components/layout/DrawersLeft.vue";
import DrawersRight from "../components/layout/DrawersRight.vue";
import Toolbar from "../components/layout/Toolbar.vue";
import type { NodeAny, NodeFree, NodePatch, NodeSnap } from "../types/node";
import { useInvestigationWebStore } from "../stores/web";
import { exportSnapshot, importSnapshotFile } from "../utils/snapshotFiles";
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
    // watch dirty flag
    this.store?.$subscribe((_m, state) => { this.isDirty = state.dirty; });
  },
  mounted() {
    // initial load (will leave blank if nothing persisted)
    this.load();
  },
  methods: {
    clearSelection(){ if (this.policy.canEditStructure) this.selectedNode = null; },
    onEditMode(open: boolean) {
      this.isEditMode = open;
      this.policy = { ...this.policy, canEditStructure: open };
      if (!open) this.selectedNode = null;
    },
    onNodeSelect(node: NodeAny) {
      if (!this.policy.canEditStructure) return;
      this.selectedNode = (this.selectedNode && this.selectedNode.id === node.id) ? null : node;
    },
    onNodesUpdate(nodes: NodeAny[]) {
      this.store?.setNodes(nodes);
    },
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
    onExport(){
      if (!this.store) return;
      const doc: Snapshot = {
        version: 2,
        nodes: this.store.nodes as any,
        bonuses: this.store.bonuses,
        meta: { savedAt: new Date().toISOString() },
      };
      exportSnapshot("investigation-web.json", doc);
    },
    async onImport(raw: any){
      // If user used toolbar file input, 'raw' may be already parsed JSON or a file structure;
      // For safety allow both: if File passed, use helper, else validate.
      if (raw instanceof File) {
        const snap = await importSnapshotFile(raw);
        if (snap) {
          this.store?.setNodes(snap.nodes as any);
          this.store?.setBonuses(snap.bonuses);
        } else {
          alert("Invalid snapshot file (version mismatch).");
        }
        return;
      }
      if (raw && raw.version === 2 && Array.isArray(raw.nodes) && Array.isArray(raw.bonuses)) {
        this.store?.setNodes(raw.nodes as any);
        this.store?.setBonuses(raw.bonuses);
      } else {
        console.warn("[import] invalid snapshot object");
        alert("Invalid snapshot data.");
      }
    },
  },
});
</script>

<style scoped>
.iw-page {
  display: flex;
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