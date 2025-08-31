<template>
  <div class="player-page">
    <div class="player-photo" v-if="selectedPhoto">
      <FullImage
        :photo="selectedPhoto"
        :fill="true"
      />
    </div>
    <div v-else class="no-photo">No photo selected.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { usePlayerPhotoStore } from "@shared/stores/playerMessage";
import FullImage from "@features/player/components/FullImage.vue";

export default defineComponent({
  name: "PlayerPage",
  components: { FullImage },
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
.player-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  color: var(--text);
  background: var(--bg);
  padding: 1rem;
  min-height: 0;
}
.player-photo {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.no-photo { color: var(--muted); font-style: italic; margin-top: 2rem; }
</style>