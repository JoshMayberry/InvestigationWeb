<template>
  <draggable
    class="sub-groups"
    :list="subGroups"
    :group="{ name: 'subgroups', pull: true, put: true }"
    item-key="id"
    @end="onSubGroupDragEnd"
    :data-group-index="groupIndex"
  >
    <template #item="{ element: sub, index: subGroupIndex }">
      <div
        class="sub-group"
        :class="{
          playing: subGroupIndex === subGroupIndex && trackState === 'playing',
          paused: subGroupIndex === subGroupIndex && trackState === 'paused'
        }"
      >
        <button
          class="sub-group-header"
          :aria-expanded="expandedSubGroupIndex === subGroupIndex"
          @click="expandSubGroup(subGroupIndex)"
        >
          <span>{{ sub.title }}</span>
          <button
            v-if="currentMode === 'edit' && expandedSubGroupIndex === subGroupIndex"
            class="edit-btn"
            @click.stop="$emit('subgroup:select', { subGroupIndex, groupIndex })"
            title="Edit Sub-Group"
          >✎</button>
          <span class="material-icons">
            {{ expandedSubGroupIndex === subGroupIndex ? "expand_less" : "expand_more" }}
          </span>
        </button>
        <transition name="expand">
          <div v-show="expandedSubGroupIndex === subGroupIndex" class="sub-group-content">
            <TrackList
              :tracks="sub.items"
              :groupIndex="groupIndex"
              :subGroupIndex="subGroupIndex"
              :trackIndex="subGroupIndex === subGroupIndex ? trackIndex : null"
              :trackState="subGroupIndex === subGroupIndex ? trackState : 'stopped'"
              @track:state="$emit('track:state', $event)"
              @track:update="$emit('track:update', $event)"
              @track:select="$emit('track:select', $event)"
              :currentMode="currentMode"
              @track:drag="onTrackDrag"
            />
          </div>
        </transition>
      </div>
    </template>
  </draggable>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import draggable from "vuedraggable";
import TrackList from "./TrackList.vue";
import { TrackState, SoundboardMode } from "../types";

export default defineComponent({
  name: "SubGroupsAccordion",
  components: { TrackList, draggable },
  props: {
    subGroups: { type: Array as PropType<Array<any>>, required: true },
    expandedSubGroupIndex: { type: [Number, null], required: true },
    groupIndex: { type: [Number, String], required: true },
    subGroupIndex: { type: [Number, null], required: true },
    trackIndex: { type: [Number, null], required: true },
    trackState: { type: String as PropType<TrackState>, required: true },
    currentMode: { type: String as PropType<SoundboardMode>, required: true },
  },
  emits: [
    "subgroup:expand",
    "subgroup:select",
    "track:state",
    "track:update",
    "track:select",
    "subgroup:drag",
    "track:drag"
  ],
  methods: {
    expandSubGroup(index: Number) {
      this.$emit("subgroup:expand", index)
    },
    onSubGroupDragEnd(evt: any) {
      this.$emit("subgroup:drag", {
        from: evt.from,
        to: evt.to,
        oldIndex: evt.oldIndex,
        newIndex: evt.newIndex,
        item: evt.item,
        groupIndex: this.groupIndex
      });
    },
    onTrackDrag(evt: any) {
      this.$emit("track:drag", evt);
    }
  }
});
</script>

<style scoped>
.sub-groups {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sub-group {
  border-radius: 8px;
  background: rgba(255,255,255,.03);
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
  margin-bottom: 4px;
}

.sub-group.playing {
  border-left: 3px solid var(--ok);
  background: rgba(52,211,153,0.06);
}

.sub-group.paused {
  border-left: 3px solid var(--accent);
  background: rgba(96,165,250,0.08);
}

.sub-group-header {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  padding: 0.75rem 1rem;
  cursor: pointer;
  outline: none;
  border-radius: 8px;
  transition: background 0.2s;
}
.sub-group-header[aria-expanded="true"] {
  background: rgba(96,165,250,0.08);
}
.sub-group-content {
  padding: 0.5rem 1.5rem 1rem 1.5rem;
}
.material-icons {
  font-size: 1.5rem;
  vertical-align: middle;
}
.edit-btn {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 1rem;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: color 0.2s;
}
.edit-btn:hover {
  color: var(--ok);
}
.expand:enter-active, .expand:leave-active {
  transition: max-height 0.25s cubic-bezier(.4,0,.2,1), opacity 0.25s;
}
.expand:enter-from, .expand:leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
.expand:enter-to, .expand:leave-from {
  max-height: 500px;
  opacity: 1;
  overflow: hidden;
}
</style>