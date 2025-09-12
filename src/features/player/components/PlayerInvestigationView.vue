<template>
  <div class="player-web">
    <InvestigationWeb :playerView="true" />
  </div>
</template>

<script lang="ts">
import { defineComponent, provide } from "vue";
import InvestigationWeb from "@features/investigation-web/components/web/InvestigationWeb.vue";
import { useInvestigationWebStore } from "@features/investigation-web/stores/web";
import { RUNTIME_KEY, createInvestigationRuntime } from "@features/investigation-web/context/runtime";
import { createChannel } from "@shared/utils/broadcast";  // ADD

export default defineComponent({
  name: "PlayerInvestigationView",
  components: { InvestigationWeb },
  data(){
    const store = useInvestigationWebStore();
    // Do NOT load snapshot from server here — player relies on GM broadcasts only.
    // Subscribe to GM broadcasts in created()
    const runtime = createInvestigationRuntime?.(store) || null;
    return {
      store,
      runtime,
      _unsub: null as null | (() => void),           // NEW
      _ch: null as any,                               // NEW
    };
  },
  created(){
    // Subscribe to GM broadcasts (GM is authoritative)
    this._ch = createChannel("iw-snapshot");
    this._unsub = this._ch.onMessage((doc:any) => {
      // DEBUG: log incoming snapshot summary
      try {
        console.debug("[PlayerInvestigationView] received snapshot:", { nodes: (doc?.nodes?.length ?? 0), links: (doc?.links?.length ?? 0), discovery: doc?.discovery, currentMode: doc?.currentMode });
      } catch (e) {}
      if (!doc || typeof doc !== "object") return;
      // Hardened loader fills defaults
      this.store.setRawSnapshot?.(doc);
      console.debug("[PlayerInvestigationView] applied snapshot -> store.nodes:", this.store.nodes?.length, "discovery.mode:", this.store.discovery?.mode);
    });
  },
  beforeUnmount(){
    if (this._unsub) this._unsub();
    if (this._ch?.stop) this._ch.stop();
  },
  provide(){
    return { [RUNTIME_KEY as any]: this.runtime };
  },
});
</script>

<style scoped>
.player-web {
  /* Let InvestigationWeb fill its slot */
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>