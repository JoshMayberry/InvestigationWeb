<template>
  <div class="iw-page" v-if="store">
    <Toolbar />
    <div class="layout">
      <DrawersLeft />
      <InvestigationWeb class="canvas" />
      <DrawersRight />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import InvestigationWeb from "../components/web/InvestigationWeb.vue";
import DrawersLeft from "../components/layout/DrawersLeft.vue";
import DrawersRight from "../components/layout/DrawersRight.vue";
import Toolbar from "../components/layout/Toolbar.vue";
import { useInvestigationWebStore } from "../stores/web";
import { createInvestigationRuntime, RUNTIME_KEY } from "../context/runtime";

export default defineComponent({
  name: "InvestigationWebPage",
  components: { InvestigationWeb, DrawersLeft, DrawersRight, Toolbar },
  data() {
    const runtime = createInvestigationRuntime(null);
    return {
      store: null as ReturnType<typeof useInvestigationWebStore> | null,
      runtime,
      isDirty: false,
    };
  },
  provide() { return { [RUNTIME_KEY]: this.runtime }; },
  created() {
    const store = useInvestigationWebStore();
    this.store = store;
    this.runtime.setStore(this.store);
    this.store.initSettingsFromLocal();
    this.store.$subscribe((_m, state) => { this.isDirty = state.dirty; });
    this.store.setMode?.("view");
  },
  mounted() { this.store?.load(); },
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
.canvas {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  display: flex;
  position: relative;
}
</style>