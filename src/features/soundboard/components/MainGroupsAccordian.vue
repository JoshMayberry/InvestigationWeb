<template>
  <div class="main-groups">
    <div
      v-for="(group, groupIdx) in groups"
      :key="group.id"
      class="main-group"
      :class="{
        expanded: expandedGroupId === group.id,
        playing: playingSectionIdx === groupIdx
      }"
      @click="expandGroup(group.id)"
      tabindex="0"
    >
      <div class="main-group-title" :title="group.title">
        {{ group.title }}
      </div>
      <transition name="fade">
        <div v-if="expandedGroupId === group.id" class="main-group-content">
          <SubGroupsAccordion
            :subGroups="group.subGroups"
            :expandedSubGroupId="expandedSubGroupId"
            :trackVol="trackVol"
            :override="override"
            :loopOne="loopOne"
            :sectionIdx="groupIdx"
            :playingSubGroupIdx="playingSectionIdx === groupIdx ? playingSubGroupIdx : null"
            :playingItemIdx="playingSectionIdx === groupIdx ? playingItemIdx : null"
            @expand:sub-group="expandSubGroup"
            @play="$emit('play', $event)"
            @update:url="$emit('update:url', $event)"
            @update:trackVol="$emit('update:trackVol', $event)"
            @update:override="$emit('update:override', $event)"
            @update:loopOne="$emit('update:loopOne', $event)"
          />
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import SubGroupsAccordion from "./SubGroupsAccordian.vue";

export default defineComponent({
  name: "MainGroupsAccordion",
  components: { SubGroupsAccordion },
  props: {
    groups: { type: Array as PropType<Array<any>>, required: true },
    expandedGroupId: { type: String, required: true },
    expandedSubGroupId: { type: String, required: true },
    trackVol: { type: Object as PropType<Record<string, number>>, required: true },
    override: { type: Object as PropType<Record<string, boolean>>, required: true },
    loopOne: { type: Object as PropType<Record<string, boolean>>, required: true },
    playingSectionIdx: { type: [Number, null], required: true },
    playingSubGroupIdx: { type: [Number, null], required: true },
    playingItemIdx: { type: [Number, null], required: true }
  },
  emits: ["expand:group", "expand:sub-group", "play", "update:url", "update:trackVol", "update:override", "update:loopOne"],
  methods: {
    expandGroup(id: string) {
      if (this.expandedGroupId === id) {
        return; // Already expanded
      }
      this.$emit("expand:group", id)
    },
    expandSubGroup(id: string) {
      if (this.expandedSubGroupId === id) {
        return; // Already expanded
      }
      this.$emit("expand:sub-group", id)
    }
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
</style>