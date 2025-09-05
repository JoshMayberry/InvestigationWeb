<template>
  <Drawers
    class="left-drawers"
    side="left"
    @drawer:change="onChange"
  >
    <PanelEdit
      :drawer="{ icon: 'edit', label: 'Edit' }"
      :selectedNode="selectedNode"
      :editDefaultsActive="editDefaults"
      :defaultNode="defaultNode"
      @node:update="e => $emit('node:update', e)"
      @node:delete="id => $emit('node:delete', id)"
      @node:duplicate="id => $emit('node:duplicate', id)"
      @defaults:update="$emit('defaults:update',$event)"
      @defaults:setFromNode="$emit('defaults:setFromNode',$event)"
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
    <PanelSettings
      :drawer="{ icon: 'settings', label: 'Settings' }"
      :confirmDeleteNode="confirmDeleteNode"
      :confirmDeleteStaging="confirmDeleteStaging"
      :enforceNoOverlap="enforceNoOverlap"
      :nodePadding="nodePadding"
      :showPadPreview="showPadPreview"
      @setting:change="$emit('setting:change', $event)"
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
import PanelSettings from "./PanelSettings.vue";

export default defineComponent({
  name: "DrawersLeft",
  components: { Drawers, PanelEdit, PanelBonus, PanelFilters, PanelSettings },
  props: {
    selectedNode: { type: Object as PropType<NodeAny | null>, default: null },
    bonuses: { type: Array as PropType<Bonus[]>, default: () => [] },
    filters: { type: Object as PropType<{ query:string; colors:string[] }>, required: true },
    filtersActive: { type: Boolean, default: false },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    matchCount: { type: Number, default: 0 },
    totalNodes: { type: Number, default: 0 },
    confirmDeleteNode: { type: Boolean, default: true },
    confirmDeleteStaging: { type: Boolean, default: true },
    enforceNoOverlap: { type: Boolean, default: false },
    nodePadding: { type: Number, default: 0 },
    showPadPreview: { type: Boolean, default: false },
    editDefaults: { type: Boolean, default: false },
    defaultNode: { type: Object as PropType<{ r:number;color:string;label:string }>, default: () => ({ r:14, color:"#10b981", label:"New" }) },
  },
  emits: [
    "mode:edit","node:update","node:delete","node:duplicate",
    "filter:query","filter:toggleColor","filter:clear",
    "setting:change","defaults:update","defaults:setFromNode"
  ],
  methods: {
    onChange(p: { index: number | null }) {
      this.$emit("mode:edit", p.index === 0);
    },
  },
});
</script>

<style scoped>
.left-drawers { flex: 0 0 auto; }
</style>