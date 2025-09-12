<template>
  <div class="player-grid">
    <!-- Top row: Web (left 2/3) -->
    <div class="cell web">
      <PlayerInvestigationView />
    </div>

    <!-- Top row: Photo (right 1/3) -->
    <div class="cell photo">
      <FullImage :photo="selectedPhoto" :fill="true" />
    </div>

    <!-- Bottom row: Bonuses (span both columns) -->
    <div class="cell bonuses">
      <PanelBonus />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { usePlayerPhotoStore } from "@shared/stores/photos";
import PlayerInvestigationView from "@features/player/components/PlayerInvestigationView.vue";
import FullImage from "@features/player/components/FullImage.vue";
import PanelBonus from "@features/investigation-web/components/layout/PanelBonus.vue";

export default defineComponent({
  name: "PlayerPage",
  components: { PlayerInvestigationView, FullImage, PanelBonus },
  data() {
    const store = usePlayerPhotoStore();
    store.loadFromStorage();
    return { store };
  },
  computed: {
    selectedPhoto(): { name: string; url: string } | null {
      return this.store.selectedPhoto;
    },
  },
});
</script>

<style scoped>
.player-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;  /* 2/3 : 1/3 */
  grid-template-rows: 1fr auto;    /* web+photo take remaining; bonuses auto height */
  grid-template-areas:
    "web photo"
    "bonuses bonuses";
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 10px;
  background: var(--bg);
  color: var(--text);
}
.cell { background: var(--panel); border-radius: 10px; min-height: 0; overflow: hidden; }
.web   { grid-area: web; padding: 0; }
.photo { grid-area: photo; display: flex; min-height: 0; }
.bonuses { grid-area: bonuses; padding: 10px; background: transparent; }
</style>