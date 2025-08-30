<template>
  <div class="sub-groups">
    <div
      v-for="(sub, subGroupIdx) in subGroups"
      :key="sub.id"
      class="sub-group"
      :class="{ playing: playingSubGroupIdx === subGroupIdx }"
    >
      <button
        class="sub-group-header"
        :aria-expanded="expandedSubGroupId === sub.id"
        @click="expandSubGroup(sub.id)"
      >
        <span>{{ sub.title }}</span>
        <span class="material-icons">
          {{ expandedSubGroupId === sub.id ? "expand_less" : "expand_more" }}
        </span>
      </button>
      <transition name="expand">
        <div v-show="expandedSubGroupId === sub.id" class="sub-group-content">
          <TrackList
            :tracks="sub.items"
            :trackVol="trackVol"
            :override="override"
            :loopOne="loopOne"
            :sectionIdx="sectionIdx"
            :subGroupIdx="subGroupIdx"
            :playingItemIdx="playingSubGroupIdx === subGroupIdx ? playingItemIdx : null"
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
import TrackList from "./TrackList.vue";

export default defineComponent({
  name: "SubGroupsAccordion",
  components: { TrackList },
  props: {
    subGroups: { type: Array as PropType<Array<any>>, required: true },
    expandedSubGroupId: { type: String, required: true },
    trackVol: { type: Object as PropType<Record<string, number>>, required: true },
    override: { type: Object as PropType<Record<string, boolean>>, required: true },
    loopOne: { type: Object as PropType<Record<string, boolean>>, required: true },
    sectionIdx: { type: [Number, String], required: true },
    playingSubGroupIdx: { type: [Number, null], required: true },
    playingItemIdx: { type: [Number, null], required: true }
  },
  emits: ["expand:sub-group", "play", "update:url", "update:trackVol", "update:override", "update:loopOne"],
  methods: {
    expandSubGroup(id: string) {
      this.$emit("expand:sub-group", id)
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