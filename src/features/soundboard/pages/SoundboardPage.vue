<template>
  <div class="soundboard-page">
    <SidebarTree
      :groups="groups"
      @select="onSidebarSelect"
      @show-player="showSidebarPlayer = true; currentMode = 'view'"
      @edit-toggle="currentMode = $event"
    >
      <template #player>
        <Player
          :currentGroup="currentGroup"
          :currentSubGroup="currentSubGroup"
          :currentTrack="currentTrack"
          :trackState="trackState"
          @play="onTrackStateChange({
            state: 'playing',
            groupIndex: currentGroupIndex!,
            subGroupIndex: currentSubGroupIndex!,
            trackIndex: currentTrackIndex!
          })"
          @next="onNext"
        />
      </template>
      <template #edit>
        <EditorPanel
          :editSelection="editSelection"
          :groups="groups"
          :isDirty="isDirty"
          @save="onSaveData"
          @track:update="onTrackUpdate"
          @track:remove="onTrackRemove"
          @track:move:up="onTrackMoveUp"
          @track:move:down="onTrackMoveDown"
          @track:add="onTrackAdd"
          @subgroup:remove="onSubgroupRemove"
          @subgroup:move:up="onSubgroupMoveUp"
          @subgroup:move:down="onSubgroupMoveDown"
          @subgroup:add="onSubgroupAdd"
          @group:remove="onGroupRemove"
          @group:move:up="onGroupMoveUp"
          @group:move:down="onGroupMoveDown"
          @track:move:to="onTrackMoveTo"
          @subgroup:move:to="onSubGroupMoveTo"
        />
      </template>
    </SidebarTree>
    <div class="left-panel">
      <MasterVolume
        :masterVol="masterVol"
        @update:masterVol="onMasterVolChange"
      />
      <MainGroupsAccordian
        :groups="groups"
        :expandedGroupIndex="expandedGroupIndex"
        :expandedSubGroupIndex="expandedSubGroupIndex"
        :groupIndex="currentGroupIndex"
        :subGroupIndex="currentSubGroupIndex"
        :trackIndex="currentTrackIndex"
        :trackState="trackState"
        :currentMode="currentMode"
        @group:expand="onGroupExpand"
        @group:select="onGroupSelect"
        @subgroup:expand="onSubGroupExpand"
        @subgroup:select="onSubGroupSelect"
        @subgroup:drag="onSubGroupDrag"
        @track:state="onTrackStateChange"
        @track:update="onTrackUpdate"
        @track:select="onTrackSelect"
        @track:drag="onTrackDrag"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, watch } from "vue";
import axios from "axios";
import MasterVolume from "../components/MasterVolume.vue"
import MainGroupsAccordian from "../components/MainGroupsAccordian.vue"
import SidebarTree from "../components/SidebarTree.vue"
import Player from "../components/Player.vue"
import EditorPanel from "../components/EditorPanel.vue";
import { EditSelection, Group, SoundboardMode, SubGroup, Track, TrackState } from "../types";

const FOLDER = "soundboard";
const FILENAME = "persona5";

export default defineComponent({
  name: "SoundboardPage",
  components: { MasterVolume, MainGroupsAccordian, SidebarTree, Player, EditorPanel },
  data() {
    return {
      groups: [] as Group[],
      expandedGroupIndex: null as number | null,
      expandedSubGroupIndex: null as number | null,
      masterVol: 50,
      currentGroupIndex: null as number | null,
      currentSubGroupIndex: null as number | null,
      currentTrackIndex: null as number | null,
      showSidebarPlayer: false,
      trackState: "stopped" as TrackState,
      currentMode: "view" as SoundboardMode,
      isLoaded: false,
      isDirty: false,
    }
  },
  mounted() {
    this.onLoadData();
  },
  watch: {
    groups: {
      handler() {
        if (this.currentMode === "edit") {
          this.isDirty = true;
        }
      },
      deep: true
    }
  },
  computed: {
    currentGroup(): Group | null {
      if (this.currentGroupIndex == null) return null
      return this.groups[this.currentGroupIndex] || null
    },
    currentSubGroup(): SubGroup | null {
      const group = this.currentGroup
      if (!group || this.currentSubGroupIndex == null) return null
      return group.subGroups[this.currentSubGroupIndex] || null
    },
    currentTrack(): Track | null {
      const subGroup = this.currentSubGroup
      if (!subGroup || this.currentTrackIndex == null) return null
      return subGroup.items[this.currentTrackIndex] || null
    },
    editSelection(): EditSelection | null {
      if (this.currentMode !== "edit") {
        return null;
      }

      if (this.currentGroup == null) {
        return null;
      }

      if (this.currentSubGroup == null) {
        return {
          type: "group",
          data: this.currentGroup!
        };
      }

      if (this.currentTrack == null) {
        return {
          type: "subgroup",
          data: this.currentSubGroup!
        };
      }

      return {
        type: "track",
        data: this.currentTrack!
      };
    }
  },
  methods: {
    async onLoadData() {
      console.log("Loading data...")
      try {
        const res = await axios.get("/api/data", {
          params: { folder: FOLDER, filename: FILENAME }
        });
        if (Array.isArray(res.data)) {
          this.groups = res.data;
          console.log("Data Loaded!")
        } else {
          this.groups = [];
          console.error("Unknown Data Format", {res})
        }
        this.isLoaded = true;
      } catch (err) {
        console.error("Failed to load data", err);
        this.groups = [];
        this.isLoaded = true;
      }
    },
    async onSaveData() {
      console.log("Saving data...")
      try {
        await axios.post("/api/data", {
          folder: FOLDER,
          filename: FILENAME,
          data: this.groups
        });
        this.isDirty = false;
        console.log("Data Saved!")
      } catch (err) {
        console.error("Failed to save data", err);
      }
    },
    onTrackUpdate({ groupIndex, subGroupIndex, trackIndex, key, value }: {
      groupIndex: number;
      subGroupIndex: number;
      trackIndex: number;
      key: keyof Track;
      value: any
    }) {
      // TODO: Harden this? We need something better maybe...
      const track = this.groups?.[groupIndex]?.subGroups?.[subGroupIndex]?.items?.[trackIndex];
      if (track && key in track) {
        (track as any)[key] = value;
      } else {
        console.warn(`Invalid track update: ${key}`);
      }
    },
    onGroupExpand(index: number): void {
      if (this.expandedGroupIndex === index) {
        this.expandedGroupIndex = null;
        this.expandedSubGroupIndex = null;
        return; // Collapse if already expanded
      }
      this.expandedGroupIndex = index;
      this.expandedSubGroupIndex = null;
    },
    onSubGroupExpand(index: number): void {
      if (index === this.expandedSubGroupIndex) {
        this.expandedSubGroupIndex = null;
        return; // Collapse if already expanded
      }
      this.expandedSubGroupIndex = index
    },
    onSidebarSelect(payload: { groupIndex: number, subGroupIndex: number }): void {
      this.expandedGroupIndex = payload.groupIndex
      this.expandedSubGroupIndex = payload.subGroupIndex
    },
    onTrackStateChange(payload: {
      state: TrackState,
      groupIndex: number,
      subGroupIndex: number,
      trackIndex: number,
    }): void {
      this.currentGroupIndex = payload.groupIndex
      this.currentSubGroupIndex = payload.subGroupIndex
      this.currentTrackIndex = payload.trackIndex
      this.trackState = payload.state;
    },
    onGroupSelect({ groupIndex }: {
      groupIndex: number,
    }) {
      if (this.currentMode === "edit") {
        this.currentGroupIndex = groupIndex;
        this.currentSubGroupIndex = null;
        this.currentTrackIndex = null;
      }
    },
    onSubGroupSelect({ groupIndex, subGroupIndex }: {
      groupIndex: number,
      subGroupIndex: number
    }) {
      if (this.currentMode === "edit") {
        this.currentGroupIndex = groupIndex;
        this.currentSubGroupIndex = subGroupIndex;
        this.currentTrackIndex = null;
      }
    },
    onTrackSelect({ groupIndex, subGroupIndex, trackIndex }: {
      groupIndex: number,
      subGroupIndex: number,
      trackIndex: number
    }) {
      if (this.currentMode === "edit") {
        this.currentGroupIndex = groupIndex;
        this.currentSubGroupIndex = subGroupIndex;
        this.currentTrackIndex = trackIndex;
      }
    },
    onTrackDrag(evt: any) {
      // evt: { oldIndex, newIndex, from, to, item, groupIndex, subGroupIndex }
      // If moved within the same subgroup, vuedraggable already updates the array.
      // If moved between subgroups, we need to move the track object.
    
      // Find source and target group/subgroup indices
      const fromGroupIndex = Number(evt.from.dataset.groupIndex);
      const fromSubGroupIndex = Number(evt.from.dataset.subGroupIndex);
      const toGroupIndex = Number(evt.to.dataset.groupIndex);
      const toSubGroupIndex = Number(evt.to.dataset.subGroupIndex);
    
      // If moved between subgroups
      if (
        fromGroupIndex !== toGroupIndex ||
        fromSubGroupIndex !== toSubGroupIndex
      ) {
        // Remove from old location (already done by vuedraggable)
        // Insert into new location (already done by vuedraggable)
        // If you want to do anything extra (like update selection), do it here.
        // Optionally, update current selection:
        this.currentGroupIndex = toGroupIndex;
        this.currentSubGroupIndex = toSubGroupIndex;
        this.currentTrackIndex = evt.newIndex;
      } else {
        // Just reordering within the same subgroup
        this.currentGroupIndex = toGroupIndex;
        this.currentSubGroupIndex = toSubGroupIndex;
        this.currentTrackIndex = evt.newIndex;
      }
    },
    onSubGroupDrag(evt: any) {
      // evt: { oldIndex, newIndex, from, to, item, groupIndex }
      // Find source and target group indices
      const fromGroupIndex = Number(evt.from.dataset.groupIndex);
      const toGroupIndex = Number(evt.to.dataset.groupIndex);
    
      // If moved between groups
      if (fromGroupIndex !== toGroupIndex) {
        // Remove from old location (already done by vuedraggable)
        // Insert into new location (already done by vuedraggable)
        // Optionally, update selection:
        this.currentGroupIndex = toGroupIndex;
        this.currentSubGroupIndex = evt.newIndex;
        this.currentTrackIndex = null;
      } else {
        // Just reordering within the same group
        this.currentGroupIndex = toGroupIndex;
        this.currentSubGroupIndex = evt.newIndex;
        this.currentTrackIndex = null;
      }
    },
    onNext(): void {
      if (this.currentGroupIndex == null || this.currentSubGroupIndex == null) return
      const subGroups = this.groups[this.currentGroupIndex].subGroups
      const items = subGroups[this.currentSubGroupIndex].items
      if (!items.length) return
      this.currentTrackIndex = (this.currentTrackIndex! + 1) % items.length
    },
    onMasterVolChange(val: number): void { this.masterVol = val },
    onTrackRemove(sel: EditSelection): void {
      if (!sel || sel.type !== "track") return;
      const { groupIndex, subGroupIndex, trackIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null || trackIndex == null) return;
      this.groups[groupIndex].subGroups[subGroupIndex].items.splice(trackIndex, 1);
      this.clearEditSelection();
    },
    onTrackMoveUp(sel: EditSelection): void {
      if (!sel || sel.type !== "track") return;
      const { groupIndex, subGroupIndex, trackIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null || trackIndex == null || trackIndex === 0) return;
      const items = this.groups[groupIndex].subGroups[subGroupIndex].items;
      [items[trackIndex - 1], items[trackIndex]] = [items[trackIndex], items[trackIndex - 1]];
      this.currentTrackIndex = trackIndex - 1;
    },
    onTrackMoveDown(sel: EditSelection): void {
      if (!sel || sel.type !== "track") return;
      const { groupIndex, subGroupIndex, trackIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null || trackIndex == null) return;
      const items = this.groups[groupIndex].subGroups[subGroupIndex].items;
      if (trackIndex >= items.length - 1) return;
      [items[trackIndex + 1], items[trackIndex]] = [items[trackIndex], items[trackIndex + 1]];
      this.currentTrackIndex = trackIndex + 1;
    },
    onTrackMoveTo({ trackId, targetGroupId, targetSubGroupId }: { trackId: string, targetGroupId: string, targetSubGroupId: string }) {
      // Find and remove the track from its current location
      let foundTrack: Track | null = null;
      let fromGroupIndex: number | null = null;
      let fromSubGroupIndex: number | null = null;
      let fromTrackIndex: number | null = null;

      for (let gi = 0; gi < this.groups.length; gi++) {
        const group = this.groups[gi];
        for (let sgi = 0; sgi < group.subGroups.length; sgi++) {
          const subGroup = group.subGroups[sgi];
          const ti = subGroup.items.findIndex(t => t.id === trackId);
          if (ti !== -1) {
            foundTrack = subGroup.items[ti];
            fromGroupIndex = gi;
            fromSubGroupIndex = sgi;
            fromTrackIndex = ti;
            subGroup.items.splice(ti, 1);
            break;
          }
        }
        if (foundTrack) break;
      }
      if (!foundTrack) return;

      // Find target group and subgroup
      const toGroupIndex = this.groups.findIndex(g => g.id === targetGroupId);
      if (toGroupIndex === -1) return;
      const toSubGroupIndex = this.groups[toGroupIndex].subGroups.findIndex(sg => sg.id === targetSubGroupId);
      if (toSubGroupIndex === -1) return;

      // Add to new location
      this.groups[toGroupIndex].subGroups[toSubGroupIndex].items.push(foundTrack);

      // Update selection to new location
      this.currentGroupIndex = toGroupIndex;
      this.currentSubGroupIndex = toSubGroupIndex;
      this.currentTrackIndex = this.groups[toGroupIndex].subGroups[toSubGroupIndex].items.length - 1;
    },
    onSubGroupMoveTo({ subGroupId, targetGroupId }: { subGroupId: string, targetGroupId: string }) {
      // Find and remove the subgroup from its current group
      let foundSubGroup: SubGroup | null = null;
      let fromGroupIndex: number | null = null;
      let fromSubGroupIndex: number | null = null;

      for (let gi = 0; gi < this.groups.length; gi++) {
        const group = this.groups[gi];
        const sgi = group.subGroups.findIndex(sg => sg.id === subGroupId);
        if (sgi !== -1) {
          foundSubGroup = group.subGroups[sgi];
          fromGroupIndex = gi;
          fromSubGroupIndex = sgi;
          group.subGroups.splice(sgi, 1);
          break;
        }
      }
      if (!foundSubGroup) return;

      // Find target group
      const toGroupIndex = this.groups.findIndex(g => g.id === targetGroupId);
      if (toGroupIndex === -1) return;

      // Add to new group
      this.groups[toGroupIndex].subGroups.push(foundSubGroup);

      // Update selection to new location
      this.currentGroupIndex = toGroupIndex;
      this.currentSubGroupIndex = this.groups[toGroupIndex].subGroups.length - 1;
      this.currentTrackIndex = null;
    },
    onTrackAdd(sel: EditSelection): void {
      const { groupIndex, subGroupIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null) return;
      const newTrack: Track = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
        title: "New Track",
        url: "",
        volume: 50,
        useVolume: false,
        isLoop: false,
      };
      this.groups[groupIndex].subGroups[subGroupIndex].items.push(newTrack);
      this.currentTrackIndex = this.groups[groupIndex].subGroups[subGroupIndex].items.length - 1;
    },
    onSubgroupRemove(sel: EditSelection): void {
      if (!sel || sel.type !== "subgroup") return;
      const { groupIndex, subGroupIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null) return;
      this.groups[groupIndex].subGroups.splice(subGroupIndex, 1);
      this.clearEditSelection();
    },
    onSubgroupMoveUp(sel: EditSelection): void {
      if (!sel || sel.type !== "subgroup") return;
      const { groupIndex, subGroupIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null || subGroupIndex === 0) return;
      const subGroups = this.groups[groupIndex].subGroups;
      [subGroups[subGroupIndex - 1], subGroups[subGroupIndex]] = [subGroups[subGroupIndex], subGroups[subGroupIndex - 1]];
      this.currentSubGroupIndex = subGroupIndex - 1;
    },
    onSubgroupMoveDown(sel: EditSelection): void {
      if (!sel || sel.type !== "subgroup") return;
      const { groupIndex, subGroupIndex } = this.getEditingIndices();
      if (groupIndex == null || subGroupIndex == null) return;
      const subGroups = this.groups[groupIndex].subGroups;
      if (subGroupIndex >= subGroups.length - 1) return;
      [subGroups[subGroupIndex + 1], subGroups[subGroupIndex]] = [subGroups[subGroupIndex], subGroups[subGroupIndex + 1]];
      this.currentSubGroupIndex = subGroupIndex + 1;
    },
    onSubgroupAdd(sel: EditSelection): void {
      const { groupIndex } = this.getEditingIndices();
      if (groupIndex == null) return;
      const newSubGroup: SubGroup = { id: Date.now().toString(), title: "New Sub-Group", items: [] };
      this.groups[groupIndex].subGroups.push(newSubGroup);
      this.currentSubGroupIndex = this.groups[groupIndex].subGroups.length - 1;
    },
    onGroupRemove(sel: EditSelection): void {
      if (!sel || sel.type !== "group") return;
      const { groupIndex } = this.getEditingIndices();
      if (groupIndex == null) return;
      this.groups.splice(groupIndex, 1);
      this.clearEditSelection();
    },
    onGroupMoveUp(sel: EditSelection): void {
      if (!sel || sel.type !== "group") return;
      const { groupIndex } = this.getEditingIndices();
      if (groupIndex == null || groupIndex === 0) return;
      [this.groups[groupIndex - 1], this.groups[groupIndex]] = [this.groups[groupIndex], this.groups[groupIndex - 1]];
      this.currentGroupIndex = groupIndex - 1;
    },
    onGroupMoveDown(sel: EditSelection): void {
      if (!sel || sel.type !== "group") return;
      const { groupIndex } = this.getEditingIndices();
      if (groupIndex == null || groupIndex >= this.groups.length - 1) return;
      [this.groups[groupIndex + 1], this.groups[groupIndex]] = [this.groups[groupIndex], this.groups[groupIndex + 1]];
      this.currentGroupIndex = groupIndex + 1;
    },
    onGroupAdd(sel: EditSelection): void {
      const newGroup: Group = { id: Date.now().toString(), title: "New Group", subGroups: [] };
      this.groups.push(newGroup);
      this.currentGroupIndex = this.groups.length - 1;
    },
    getEditingIndices(): { groupIndex: number | null, subGroupIndex: number | null, trackIndex: number | null } {
      return {
        groupIndex: this.currentGroupIndex,
        subGroupIndex: this.currentSubGroupIndex,
        trackIndex: this.currentTrackIndex
      };
    },
    clearEditSelection(): void {
      this.currentGroupIndex = null;
      this.currentSubGroupIndex = null;
      this.currentTrackIndex = null;
    },
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
.left-panel > .groups {
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