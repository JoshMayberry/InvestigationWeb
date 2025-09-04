<template>
  <Drawers
    class="left-drawers"
    side="left"
    @drawer:change="onChange"
  >
    <PanelEdit
      :drawer="{ icon: 'edit', label: 'Edit' }"
      :selectedNode="selectedNode"
      @node:update="e => $emit('node:update', e)"
    />
    <PanelFilters
      :drawer="{ icon: 'filter', label: 'Filters' }"
      :query="filters.query"
      :colors="filters.colors"
      :palette="palette"
      :matchCount="matchCount"
      :total="totalNodes"
      :active="filtersActive"
      @filter:query="$emit('filter:query', $event)"
      @filter:toggleColor="$emit('filter:toggleColor', $event)"
      @filter:clear="$emit('filter:clear')"
    />
    <PanelBonus
      :drawer="{ icon: 'star', label: 'Bonuses' }"
      :bonuses="bonuses"
    />
  </Drawers>
</template>

<script lang="ts">
import type { NodeAny } from "../../types/node";
import type { Bonus } from "../../types/bonus";
import { defineComponent, PropType } from "vue";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelEdit from "./PanelEdit.vue";
import PanelBonus from "./PanelBonus.vue";
import PanelFilters from "./PanelFilters.vue";

export default defineComponent({
  name: "DrawersLeft",
  components: { Drawers, PanelEdit, PanelBonus, PanelFilters },
  props: {
    selectedNode: { type: Object as PropType<NodeAny | null>, default: null },
    bonuses: { type: Array as PropType<Bonus[]>, default: () => [] },
    filters: { type: Object as PropType<{ query:string; colors:string[] }>, required: true },
    filtersActive: { type: Boolean, default: false },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    matchCount: { type: Number, default: 0 },
    totalNodes: { type: Number, default: 0 },
  },
  emits: ["mode:edit","node:update","filter:query","filter:toggleColor","filter:clear"],
  methods: {
    onChange(p: { index: number | null }) {
      // Edit panel still index 0
      this.$emit("mode:edit", p.index === 0);
    },
  },
});
</script>

<style scoped>
.left-drawers { flex: 0 0 auto; }
</style>