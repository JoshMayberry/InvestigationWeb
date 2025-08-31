<template>
  <div class="navigation-panel">
    <ExpandableTree
      :nodes="groups"
      :nodeKey="node => node.id"
      :getChildren="getChildren"
      :renderLabel="renderLabel"
      @select="$emit('select', $event)"
    />
  </div>
</template>

<script lang="ts">
import ExpandableTree from "@shared/components/layout/ExpandableTree.vue";
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "NavigationPanel",
  components: { ExpandableTree },
  props: {
    groups: { type: Array as PropType<any[]>, required: true },
  },
  emits: ["select"],
  methods: {
    getChildren(node: any) {
      return node.subGroups || [];
    },
    renderLabel(node: any) {
      return node.title as string;
    },
  },
});
</script>

<style scoped>
.navigation-panel {
  width: 100%;
  height: 100%;
}
</style>