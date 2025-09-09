<template>
  <Drawers
    ref="drawers"
    class="left-drawers"
    side="left"
    @drawer:change="onChange"
  >
    <PanelEdit :drawer="{ icon:'edit', label:'Edit' }" />
    <PanelDiscovery :drawer="{ icon:'visibility', label:'Discovery' }" />
    <PanelFilters :drawer="{ icon:'filter', label:'Filters' }" />
    <PanelBonus :drawer="{ icon:'star', label:'Bonuses' }" />
    <PanelSettings :drawer="{ icon:'settings', label:'Settings' }" />
  </Drawers>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import type { UIMode } from "../../types/mode";
import type { InvestigationRuntime } from "../../context/runtime";
import { RUNTIME_KEY } from "../../context/runtime";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelEdit from "./PanelEdit.vue";
import PanelDiscovery from "./PanelDiscovery.vue";
import PanelFilters from "./PanelFilters.vue";
import PanelBonus from "./PanelBonus.vue";
import PanelSettings from "./PanelSettings.vue";

export default defineComponent({
  name: "DrawersLeft",
  components: { Drawers, PanelEdit, PanelDiscovery, PanelFilters, PanelBonus, PanelSettings },
  data() {
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null,
    };
  },
  mounted() {
    this.$watch(() => this.store.currentMode as UIMode, (m) => {
      const d = this.$refs.drawers as any;
      if (!d) return;
      const mode = this.indexToMode(m);
      if (mode === null) d.close?.() ?? d.activate?.(null);
      else d.activate?.(mode);
      
      this.store.setCanEditStructure(m === "edit");
    }, { immediate: true });
  },
  methods:{
    onChange(p:{ index:number|null }){
      const idx = p.index;
      const mode = this.indexToMode(idx);
      this.store.setMode(mode);
      this.store.setCanEditStructure(mode === "edit");
    },
    indexToMode(idx:number|null):UIMode{
      return idx === 0 ? "edit"
        : idx === 1 ? "discovery"
        : idx === 2 ? "filter"
        : idx === 3 ? "bonus"
        : idx === 4 ? "setting"
        : "view";
    }
  }
});
</script>

<style scoped>
.left-drawers { flex:0 0 auto; }
</style>