<template>
  <div class="edit-main">
    <h3 class="title">Edit</h3>

    <EditPageLink v-if="store.tools.addLink" mode="draft" />
    <EditPageNode v-else-if="store.tools.addFreeNode" mode="defaults" />
    <EditPageTrack v-else-if="store.tools.addTrack" mode="draft" />
    <EditPageTrackGroup v-else-if="store.tools.addCalcGroup" mode="draft" />

    <EditPageNode v-else-if="selectedNode" mode="selected" :node-id="selectedNode.id" />
    <EditPageLink v-else-if="selectedLink" mode="selected" :link-id="selectedLink.id" />
    <EditPageTrack v-else-if="selectedTrack" :track-id="selectedTrack.id" />
    <EditPageTrackGroup v-else-if="selectedGroup" :group-id="selectedGroup.id" />
    <div v-else class="empty"><em>Nothing selected.</em></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";
import EditPageNode from "./pages/EditPageNode.vue";
import EditPageLink from "./pages/EditPageLink.vue";
import EditPageTrack from "./pages/EditPageTrack.vue";
import EditPageTrackGroup from "./pages/EditPageTrackGroup.vue";

export default defineComponent({
  name: "PanelEdit",
  components: { EditPageNode, EditPageLink, EditPageTrack, EditPageTrackGroup },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    selectionCtrl(): any { return this.runtime?.controllers?.selection; },
    selectedNode(): any {
      const id = this.selectionCtrl?.get();
      return id ? this.store.nodes.find((n:any)=>n.id===id) || null : null;
    },
    selectedLink(): any {
      const id = this.selectionCtrl?.get();
      return id ? this.store.links.find((l:any)=>l.id===id) || null : null;
    },
    selectedTrack(): any {
      const id = this.selectionCtrl?.get();
      return id ? this.store.tracks.find((t:any)=>t.id===id) || null : null;
    },
    selectedGroup(): any {
      const id = this.selectionCtrl?.get();
      return id ? this.store.calcGroups.find((g:any)=> g.id===id) || null : null;
    }
  }
});
</script>

<style scoped>
.title { margin:0 0 8px; font-size:13px; letter-spacing:.5px; color: var(--accent); }
.edit-main { display:flex; flex-direction:column; gap:10px; }
.empty { font-size:12px; color: var(--muted); }
</style>