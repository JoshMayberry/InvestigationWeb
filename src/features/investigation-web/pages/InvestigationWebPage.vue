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
import { createChannel } from "@shared/utils/broadcast"; // ADD

export default defineComponent({
  name: "InvestigationWebPage",
  components: { InvestigationWeb, DrawersLeft, DrawersRight, Toolbar },
  data() {
    const runtime = createInvestigationRuntime(null);
    return {
      store: null as ReturnType<typeof useInvestigationWebStore> | null,
      runtime,
      isDirty: false,
      _bc: null as any,        // ADD
      _timer: 0 as any,        // ADD
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

    // BroadcastChannel publisher (GM is authority)
    this._bc = createChannel("iw-snapshot");
    const publish = () => {
      // Build a plain snapshot (no proxies)
      const doc = {
        version: 4,
        nodes: this.store!.nodes,
        staging: this.store!.staging,
        bonuses: this.store!.bonuses,
        tracks: this.store!.tracks,
        links: this.store!.links,
        calcGroups: this.store!.calcGroups,
        trackSeq: this.store!.trackSeq,
        linkSeq: this.store!.linkSeq,
        trackDraft: this.store!.trackDraft,
        linkDraft: this.store!.linkDraft,
        groupDraft: this.store!.groupDraft,
        customFields: this.store!.customFields,
        discovery: this.store!.discovery,
        // include UI/policy/config so players match GM view exactly
        currentMode: this.store!.currentMode,
        policy: this.store!.policy,
        filters: this.store!.filters,
        settings: this.store!.settings,
        meta: { savedAt: this.store!.savedAt || null },
      };
      // debug published snapshot summary
      try { console.debug("[GM publish snapshot] mode:", doc.currentMode, "discovery:", doc.discovery, "filters:", { q: doc.filters?.query, colors: (doc.filters?.colors||[]).length }); } catch {}
      this._bc.post(doc);
    };

    // Throttle broadcasts on relevant changes
    this.$watch(
      () => [ this.store!.nodes, this.store!.links, this.store!.tracks, this.store!.calcGroups, this.store!.discovery,
              this.store!.filters, this.store!.settings, this.store!.currentMode, this.store!.policy, this.store!.customFields ],
      () => {
        if (this._timer) return;
        this._timer = window.setTimeout(() => { this._timer = 0; publish(); }, 150);
      },
      { deep: true, immediate: true }
    );
  },
  mounted() { this.store?.load(); },
  beforeUnmount(){
    if (this._timer) { clearTimeout(this._timer); this._timer = 0; }
    this._bc?.stop?.();
  },
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