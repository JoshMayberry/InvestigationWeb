<template>
  <div class="soundboard-page">
    <SidebarTree
      :groups="sections"
      @select="onSidebarSelect"
      @show-player="showSidebarPlayer = true"
    >
      <template #player>
        <Player
          :currentSection="currentSection"
          :currentItem="currentItem"
          @play="onPlay"
          @next="onNext"
        />
      </template>
    </SidebarTree>
    <div class="left-panel">
      <MasterVolume
        :masterVol="masterVol"
        @update:masterVol="onMasterVolChange"
      />
      <MainGroupsAccordian
        :groups="sections"
        :expandedGroupId="expandedGroupId"
        :expandedSubGroupId="expandedSubGroupIds[expandedGroupId] || ''"
        :trackVol="trackVol"
        :override="override"
        :loopOne="loopOne"
        :playingSectionIdx="playingSectionIdx"
        :playingSubGroupIdx="playingSubGroupIdx"
        :playingItemIdx="playingItemIdx"
        @expand:group="onExpandGroup"
        @expand:sub-group="onExpandSubGroup"
        @play="onPlay"
        @update:url="onUpdateUrl"
        @update:override="onUpdateOverride"
        @update:trackVol="onUpdateTrackVol"
        @update:loopOne="onUpdateLoopOne"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MasterVolume from "../components/MasterVolume.vue"
import MainGroupsAccordian from "../components/MainGroupsAccordian.vue"
import SidebarTree from "../components/SidebarTree.vue"
import Player from "../components/Player.vue"
import SCENARIO_DATA from "../assets/persona5.json"

type Track = { title: string; url: string };
type SubGroup = { id: string; title: string; items: Track[] };
type Group = { id: string; title: string; subGroups: SubGroup[] };

export default defineComponent({
  name: "SoundboardPage",
  components: { MasterVolume, MainGroupsAccordian, SidebarTree, Player },
  data() {
    return {
      sections: JSON.parse(JSON.stringify(SCENARIO_DATA)) as Group[],
      expandedGroupId: "" as string,
      expandedSubGroupIds: {} as Record<string, string>, // groupId -> subGroupId
      masterVol: 50,
      trackVol: {} as Record<string, number>,
      override: {} as Record<string, boolean>,
      loopOne: {} as Record<string, boolean>,
      currentSectionIdx: null as number | null,
      currentSubGroupIdx: null as number | null,
      currentItemIdx: null as number | null,
      showSidebarPlayer: false,
    }
  },
  computed: {
    currentSection(): Group | null {
      if (this.currentSectionIdx == null) return null
      return this.sections[this.currentSectionIdx] || null
    },
    currentSubGroup(): SubGroup | null {
      const section = this.currentSection
      if (!section || this.currentSubGroupIdx == null) return null
      return section.subGroups[this.currentSubGroupIdx] || null
    },
    currentItem(): Track | null {
      const subGroup = this.currentSubGroup
      if (!subGroup || this.currentItemIdx == null) return null
      return subGroup.items[this.currentItemIdx] || null
    },
    playingSectionIdx(): number | null {
      return this.currentSectionIdx;
    },
    playingSubGroupIdx(): number | null {
      return this.currentSubGroupIdx;
    },
    playingItemIdx(): number | null {
      return this.currentItemIdx;
    }
  },
  methods: {
    onExpandGroup(id: string): void {
      this.expandedGroupId = id;
      this.expandedSubGroupIds[id] = "";
    },
    onExpandSubGroup(id: string): void {
      if (this.expandedGroupId) {
        this.expandedSubGroupIds[this.expandedGroupId] = id
      }
    },
    onSidebarSelect(payload: { groupId: string, subGroupId: string }): void {
      this.expandedGroupId = payload.groupId
      if (payload.subGroupId) {
        this.expandedSubGroupIds[payload.groupId] = payload.subGroupId
      }
    },
    onPlay(payload: { sectionIdx: number, subGroupIdx: number, itemIdx: number }): void {
      this.currentSectionIdx = payload.sectionIdx
      this.currentSubGroupIdx = payload.subGroupIdx
      this.currentItemIdx = payload.itemIdx
    },
    onNext(): void {
      if (this.currentSectionIdx == null || this.currentSubGroupIdx == null) return
      const subGroups = this.sections[this.currentSectionIdx].subGroups
      const items = subGroups[this.currentSubGroupIdx].items
      if (!items.length) return
      this.currentItemIdx = (this.currentItemIdx! + 1) % items.length
    },
    onMasterVolChange(val: number): void { this.masterVol = val },
    onTrackVolChange(payload: { key: string, value: number }): void { this.trackVol[payload.key] = payload.value },
    onOverrideChange(payload: { key: string, value: boolean }): void { this.override[payload.key] = payload.value },
    onLoopOneChange(payload: { key: string, value: boolean }): void { this.loopOne[payload.key] = payload.value },
    onUpdateUrl(payload: { sectionIdx: number, subGroupIdx: number, itemIdx: number, url: string }): void {
      // TODO: Update it; Needs serialization back to the data source
    },
    onUpdateOverride(payload: { key: string, value: boolean }): void {
      this.override = { ...this.override, [payload.key]: payload.value }
    },
    onUpdateTrackVol(payload: { key: string, value: number }): void {
      this.trackVol = { ...this.trackVol, [payload.key]: payload.value }
    },
    onUpdateLoopOne(payload: { key: string, value: boolean }): void {
      this.loopOne = { ...this.loopOne, [payload.key]: payload.value }
    }
  }
})
</script>

<style scoped>
.soundboard-page {
  display: flex;
  flex-direction: row;
  height: 100%;
  min-height: 0;
  padding: 14px;
  box-sizing: border-box;
  background: linear-gradient(180deg,#0b1220,#0f172a);
  color: var(--text);
}
.left-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  flex: 1 1 0;
  box-sizing: border-box;
}
.left-panel > .masterVol {
  flex: 0 0 auto;
}
.left-panel > .sections {
  flex: 1 1 auto;
  min-height: 0;
}
.sidebar-player-container {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  background: var(--panel);
  z-index: 200;
  box-shadow: 2px 0 24px rgba(0,0,0,0.18);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 1.5rem 1rem 1rem 1rem;
  transform: translateX(-100%);
  opacity: 0;
  pointer-events: none;
  transition: transform 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s;
}
.sidebar-player-container.visible {
  transform: translateX(0);
  opacity: 1;
  pointer-events: auto;
}
.close-btn {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 2rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}
</style>