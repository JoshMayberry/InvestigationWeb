<template>
  <ul class="expandable-tree">
    <TreeNode
      v-for="(node, i) in nodes"
      :key="nodeKey(node)"
      :node="node"
      :get-children="getChildren"
      :render-label="renderLabel"
      :selected-node="selectedNode"
      :node-key="nodeKey"
      :index-path="[i]"
      @select="onSelect"
    />
  </ul>
</template>

<script lang="ts">
import TreeNode from "./TreeNode.vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "ExpandableTree",
  components: { TreeNode },
  props: {
    nodes: { type: Array as PropType<any[]>, required: true },
    nodeKey: { type: Function as PropType<(node: any) => string | number>, required: true },
    getChildren: { type: Function as PropType<(node: any) => any[]>, default: (node: any) => node.subGroups || node.children || [] },
    renderLabel: { type: Function as PropType<(node: any) => string>, default: (node: any) => node.title || node.name },
    selectedNode: { type: Object as PropType<any | null>, default: null },
  },
  emits: ["select"],
  methods: {
    onSelect(payload: { node: any; indexList: number[] }) {
      this.$emit("select", payload);
    },
  },
});
</script>

<style scoped>
.expandable-tree {
  list-style: none;
  padding-left: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 100%;
}
</style>