<template>
  <Drawers class="left-drawers" side="left" @drawer:change="onChange">
    <PanelEdit :drawer="{ icon:'edit', label:'Edit' }" />
    <PanelFilters :drawer="{ icon:'filter', label:'Filters' }" />
    <PanelBonus :drawer="{ icon:'star', label:'Bonuses' }" />
    <PanelSettings :drawer="{ icon:'settings', label:'Settings' }" />
  </Drawers>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelEdit from "./PanelEdit.vue";
import PanelFilters from "./PanelFilters.vue";
import PanelBonus from "./PanelBonus.vue";
import PanelSettings from "./PanelSettings.vue";

export default defineComponent({
  name: "DrawersLeft",
  components: { Drawers, PanelEdit, PanelFilters, PanelBonus, PanelSettings },
  emits: ["mode:edit"],
  methods:{
    onChange(p:{ index:number|null }){ this.$emit("mode:edit", p.index === 0); }
  }
});
</script>

<style scoped>
.left-drawers { flex:0 0 auto; }
</style>