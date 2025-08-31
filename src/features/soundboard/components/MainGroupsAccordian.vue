<template>
  <div class="main-groups">
    <div
      v-for="(group, thisGroupIndex) in groups"
      :key="group.id"
      class="main-group"
      :class="{
        expanded: expandedGroupIndex === thisGroupIndex,
        playing: groupIndex === thisGroupIndex && trackState === 'playing',
        paused: groupIndex === thisGroupIndex && trackState === 'paused'
      }"
      @click="expandGroup(thisGroupIndex)"
      tabindex="0"
    >
      <div class="main-group-title" :title="group.title">
        {{ group.title }}
        <button
          v-if="currentMode === 'edit' && expandedGroupIndex === thisGroupIndex"
          class="edit-btn"
          @click.stop="$emit('group:select', { groupIndex: thisGroupIndex })"
          title="Edit Group"
        >✎</button>
      </div>
      <transition name="fade">
        <div v-if="expandedGroupIndex === thisGroupIndex" class="main-group-content">
          <SubGroupsAccordion
            :subGroups="group.subGroups"
            :expandedSubGroupIndex="expandedSubGroupIndex"
            :groupIndex="thisGroupIndex"
            :subGroupIndex="groupIndex === thisGroupIndex ? subGroupIndex : null"
            :trackIndex="groupIndex === thisGroupIndex ? trackIndex : null"
            :trackState="groupIndex === thisGroupIndex ? trackState : 'stopped'"
            :currentMode="currentMode"
            @track:state="$emit('track:state', $event)"
            @track:update="$emit('track:update', $event)"
            @track:select="$emit('track:select', $event)"
            @subgroup:select="$emit('subgroup:select', $event)"
            @subgroup:expand="$emit('subgroup:expand', $event)"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import SubGroupsAccordion from "./SubGroupsAccordian.vue";
import { TrackState, SoundboardMode } from "../types";

export default defineComponent({
  name: "MainGroupsAccordion",
  components: { SubGroupsAccordion },
  props: {
    groups: { type: Array as PropType<Array<any>>, required: true },
    expandedGroupIndex: { type: [Number, null], required: true },
    expandedSubGroupIndex: { type: [Number, null], required: true },
    groupIndex: { type: [Number, null], required: true },
    subGroupIndex: { type: [Number, null], required: true },
    trackIndex: { type: [Number, null], required: true },
    trackState: { type: String as PropType<TrackState>, required: true },
    currentMode: { type: String as PropType<SoundboardMode>, required: true },
  },
  emits: [
    "group:expand",
    "group:select",
    "subgroup:expand",
    "subgroup:select",
    "track:state",
    "track:update",
    "track:select",
  ],
  methods: {
    expandGroup(index: Number) {
      if (this.expandedGroupIndex === index) {
        return; // Already expanded
      }
      this.$emit("group:expand", index)
    },
  }
});
</script>

<style scoped>
.main-groups {
  display: flex;
  height: 100%;
  min-height: 0;
  gap: 0;
  background: transparent;
  overflow-x: auto;
  border-radius: 12px;
}

.main-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  background: var(--panel);
  border-radius: 12px 0 0 12px;
  min-width: 48px;
  max-width: 48px;
  cursor: pointer;
  transition: max-width 0.35s cubic-bezier(.4,0,.2,1), min-width 0.35s cubic-bezier(.4,0,.2,1), box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  overflow: hidden;
  margin-right: 2px;
  flex-shrink: 0;
  height: 100%;
  outline: none;
}

.main-group-title {
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 1rem;
  font-weight: bold;
  letter-spacing: 0.04em;
  color: var(--muted);
  padding: 1rem 0.5rem;
  text-align: center;
  white-space: nowrap;
  user-select: none;
}

.main-group.expanded {
  min-width: 340px;
  max-width: 540px;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.18);
  outline: 2px solid var(--accent);
  background: var(--panel);
  z-index: 1;
}

.main-group.expanded .main-group-title {
  writing-mode: horizontal-tb;
  transform: none;
  color: var(--text);
  font-size: 1.2rem;
  padding: 1rem 1.5rem 0.5rem 1.5rem;
  text-align: left;
}

.main-group.playing {
  border-left: 4px solid var(--ok);
  background: rgba(52,211,153,0.08);
}

.main-group.paused {
  border-left: 4px solid var(--accent);
  background: rgba(96,165,250,0.08);
}

.main-group-content {
  width: 100%;
  padding: 0 1.5rem 1rem 1.5rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.edit-btn {
  background: var(--accent);
  border: none;
  color: #0b1220;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 6px;
  padding: 2px 10px;
  margin-left: 0.5rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  outline: none;
}
.edit-btn:hover, .edit-btn:focus {
  background: var(--ok);
  color: #0b1220;
  box-shadow: 0 2px 8px rgba(52,211,153,0.15);
}
</style>