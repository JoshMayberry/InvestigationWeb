<template>
  <div class="player-page">
    <Drawers>
      <EditPanel
        :drawer="{ icon: 'edit', label: 'Edit Node' }"
        :node="selectedNode"
        @update="onNodeUpdate"
        @delete="onNodeDelete"
      />
    </Drawers>
    <InvestigationWeb
      class="investigation-web"
      :layout="layout"
      :policy="policy"
      :discoveredIds="discovered"
      :nodeColor="nodeColor"
      @update:nodes="nodes = $event"
      @update:discovered="onDiscover"
      v-model:nodes="nodes"
      @select:node="onNodeSelect"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import InvestigationWeb from "../components/InvestigationWeb.vue";
import { LayoutGroup } from "../types/layout";
import { NodeAny } from "../types/node";
import EditPanel from "../components/EditPanel.vue";
import Drawers from "@shared/components/layout/Drawers.vue"; // <-- import Drawers

export default defineComponent({
  name: "InvestigationWebPage",
  components: { InvestigationWeb, EditPanel, Drawers }, // <-- add Drawers
  data() {
    return {
      layout: {
        type: "group",
        kind: "row",
        props: { gap: "40px" },
        children: [
          { type: "track", id: "tA", kind: "vline", props: { x: "50%", color: "red" } },
          { type: "track", id: "tB", kind: "vline", props: { x: "50%", color: "gold" } },
          { type: "track", id: "tC", kind: "vline", props: { x: "50%", color: "deepskyblue" } },
        ]
      } as LayoutGroup,
      nodes: [
      { id: "n1", kind: "free", x: 100, y: 100, r: 14, color: "#10b981" },
      { id: "n2", kind: "free", x: 200, y: 200, r: 14, color: "#8b5cf6" },
    ] as NodeAny[],
      selectedNode: null as NodeAny | null,
    };
  },
  computed: {
    policy() {
      return {
        canEditStructure: this.$refs?.editPanel.isOpen,
        canMoveNodes: this.$refs?.editPanel.isOpen,
        canDiscover: true,
        canInteract: true
      };
    },
  },
  methods: {
    nodeColor(n: NodeAny, ctx){ return n.color || '#10b981'; },
    onNodeSelect(node: NodeAny) {
      this.selectedNode = node;
    },
    onNodeUpdate(updatedNode: NodeAny) {
      const idx = this.nodes.findIndex(n => n.id === updatedNode.id);
      if (idx !== -1) this.nodes.splice(idx, 1, updatedNode);
      this.selectedNode = updatedNode;
    },
    onNodeDelete(nodeId: string) {
      this.nodes = this.nodes.filter(n => n.id !== nodeId);
      this.selectedNode = null;
    },
  },
});
</script>

<style scoped>
.player-page {
  flex: 1;
  display: flex;
  flex-direction: row;
}

.edit-panel {
  flex: 0;
  min-width: calc(max(300px, 10vh));
}

.investigation-web {
  flex: 1;
}

</style>