<template>
  <div class="full-image" :class="{ fillRoot: fill }">
    <div v-if="photo" class="image-wrap" :class="{ fill: fill }">
      <img :src="photo.url" :alt="photo.name" />
    </div>
    <div v-else class="no-image">No image selected.</div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import type { PhotoFile } from "@shared/stores/playerMessage";

export default defineComponent({
  name: "FullImage",
  props: {
    photo: { type: Object as PropType<PhotoFile | null>, default: null },
    fill: { type: Boolean, default: false }, // when true: contain image within all available space
  },
});
</script>

<style scoped>
.full-image {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: var(--text);
}
.full-image.fillRoot { flex: 1 1 auto; min-height: 0; }

/* Default image box (no headers/notes/actions here) */
.image-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--panel);
  border-radius: 10px;
  padding: 8px;
}
.image-wrap img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

/* Fill mode: occupy all space and contain image without scrollbars (good for PlayerPage) */
.image-wrap.fill {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  height: 100%;
  overflow: hidden;
}
.image-wrap.fill img {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 8px;
}

.no-image {
  background: var(--panel);
  color: var(--muted);
  border-radius: 10px;
  padding: 16px;
  text-align: center;
}
</style>