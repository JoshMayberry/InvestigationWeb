<template>
  <draggable
    class="track-list"
    :list="tracks"
    :group="{ name: 'tracks', pull: true, put: true }"
    item-key="id"
    @end="onDragEnd"
    :data-group-index="groupIndex"
    :data-sub-group-index="subGroupIndex"
  >
    <template #item="{ element: track, index: thisTrackIndex }">
      <TrackItem
        :item="track"
        :groupIndex="groupIndex"
        :subGroupIndex="subGroupIndex"
        :trackIndex="thisTrackIndex"
        :trackState="getTrackState(thisTrackIndex)"
        :currentMode="currentMode"
        @track:state="$emit('track:state', $event)"
        @track:update="$emit('track:update', $event)"
        @track:select="$emit('track:select', $event)"
      />
    </template>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import draggable from "vuedraggable";
import TrackItem from "./TrackItem.vue";
import { Track, TrackState, SoundboardMode } from "../types";

export default defineComponent({
  name: "TrackList",
  components: { TrackItem, draggable },
  props: {
    tracks: { type: Array as PropType<Array<Track>>, required: true },
    groupIndex: { type: [Number, String], required: true },
    subGroupIndex: { type: [Number, String], required: true },
    trackIndex: { type: [Number, null], required: true },
    trackState: { type: String as PropType<TrackState>, required: true },
    currentMode: { type: String as PropType<SoundboardMode>, required: true }
  },
  emits: [
    "track:state",
    "track:update",
    "track:select",
    "track:drag"
  ],
  methods: {
    getTrackState(trackIndex: number) {
      if (this.trackIndex === trackIndex) return this.trackState;
      return "stopped";
    },
    onDragEnd(evt: any) {
      // Notify parent of drag event (for cross-subgroup moves)
      this.$emit("track:drag", {
        from: evt.from,
        to: evt.to,
        oldIndex: evt.oldIndex,
        newIndex: evt.newIndex,
        item: evt.item,
        groupIndex: this.groupIndex,
        subGroupIndex: this.subGroupIndex
      });
    }
  }
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