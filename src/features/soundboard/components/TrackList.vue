<template>
  <div class="track-list">
    <Track
      v-for="(track, trackIdx) in tracks"
      :key="track.title"
      :item="track"
      :sectionIdx="sectionIdx"
      :subGroupIdx="subGroupIdx"
      :itemIdx="trackIdx"
      :isPlaying="playingItemIdx === trackIdx"
      :trackVol="trackVol"
      :override="override"
      :loopOne="loopOne"
      @play="$emit('play', $event)"
      @update:url="$emit('update:url', $event)"
      @update:trackVol="$emit('update:trackVol', $event)"
      @update:override="$emit('update:override', $event)"
      @update:loopOne="$emit('update:loopOne', $event)"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import Track from "./Track.vue";

export default defineComponent({
  name: "TrackList",
  components: { Track },
  props: {
    tracks: { type: Array as PropType<Array<{ title: string; url: string }>>, required: true },
    trackVol: { type: Object as PropType<Record<string, number>>, required: true },
    override: { type: Object as PropType<Record<string, boolean>>, required: true },
    loopOne: { type: Object as PropType<Record<string, boolean>>, required: true },
    sectionIdx: { type: [Number, String], required: true },
    subGroupIdx: { type: [Number, String], required: true },
    playingItemIdx: { type: [Number, null], required: true },
  },
  emits: ["play", "update:url", "update:trackVol", "update:override", "update:loopOne"],
});
</script>

<style scoped>
.track-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 0.5rem;
}
</style>