<template>
  <Drawers class="left-drawers" side="left" @drawer:change="onChange">
    <PanelEdit :drawer="{ icon:'edit', label:'Edit' }" />
    <PanelDiscovery :drawer="{ icon:'visibility', label:'Discovery' }" />
    <PanelFilters :drawer="{ icon:'filter', label:'Filters' }" />
    <PanelBonus :drawer="{ icon:'star', label:'Bonuses' }" />
    <PanelSettings :drawer="{ icon:'settings', label:'Settings' }" />
  </Drawers>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelEdit from "./PanelEdit.vue";
import PanelDiscovery from "./PanelDiscovery.vue";
import PanelFilters from "./PanelFilters.vue";
import PanelBonus from "./PanelBonus.vue";
import PanelSettings from "./PanelSettings.vue";
import type { InvestigationRuntime } from "../../context/runtime";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "DrawersLeft",
  components: { Drawers, PanelEdit, PanelDiscovery, PanelFilters, PanelBonus, PanelSettings },
  emits: ["mode:edit","mode:discovery"],
  data(){ return { runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null }; },
  methods:{
    onChange(p:{ index:number|null }){
      const isEdit = p.index === 0;
      const isDisc = p.index === 1;
      this.$emit("mode:edit", isEdit);
      this.$emit("mode:discovery", isDisc);
      const pol = this.runtime?.policy;
      if (this.runtime && pol) {
        this.runtime.setPolicy({ ...pol, canEditStructure: !!isEdit, canDiscover: !!isDisc });
      }
    }
  }
});
</script>

<style scoped>
.left-drawers { flex:0 0 auto; }
</style>