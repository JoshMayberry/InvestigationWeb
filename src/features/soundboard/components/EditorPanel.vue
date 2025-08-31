<template>
  <div class="edit-panel-content">
    <button
      class="save-btn"
      :class="{ dirty: isDirty }"
      @click="$emit('save')"
      :disabled="!isDirty"
      title="Save changes"
    >
      💾 Save
    </button>
    <h3>Edit Mode</h3>
    <!-- Track Edit -->
    <div v-if="editSelection && editSelection.type === 'track'">
      <label>
        <span>Id:</span>
        <input v-model="editSelection.data.id" />
      </label>
      <label>
        <span>Title:</span>
        <input v-model="editSelection.data.title" />
      </label>
      <label>
        <span>YouTube Link:</span>
        <input v-model="editSelection.data.url" />
      </label>
      <label>
        <span>Loop Preset:</span>
        <input type="checkbox" v-model="editSelection.data.isLoop" />
      </label>
      <label>
        <span>Apply Volume Override:</span>
        <input type="checkbox" v-model="editSelection.data.useVolume" />
      </label>
      <label>
        <span>Volume Override:</span>
        <input type="range" min="0" max="100" v-model.number="editSelection.data.volume" />
        <span class="pill">{{ editSelection.data.volume }}</span>
      </label>
      <label>
        <span>Move to Group:</span>
        <select v-model="trackMoveGroupId">
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.title }}</option>
        </select>
      </label>
      <label>
        <span>Move to Sub-Group:</span>
        <select v-model="trackMoveSubGroupId">
          <option v-for="sg in availableSubGroups" :key="sg.id" :value="sg.id">{{ sg.title }}</option>
        </select>
      </label>
      <div class="edit-actions">
        <button class="danger" @click="$emit('track:remove', editSelection)">Remove Track</button>
        <button @click="$emit('track:move:up', editSelection)">Move Up</button>
        <button @click="$emit('track:move:down', editSelection)">Move Down</button>
        <button class="primary" @click="moveTrack" :disabled="!canMoveTrack">Move Track</button>
      </div>
    </div>
    <!-- SubGroup Edit -->
    <div v-else-if="editSelection && editSelection.type === 'subgroup'">
      <label>
        <span>Sub-Group Title:</span>
        <input v-model="editSelection.data.title" />
      </label>
      <label>
        <span>Move to Group:</span>
        <select v-model="subGroupMoveGroupId">
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.title }}</option>
        </select>
      </label>
      <div class="edit-actions">
        <button class="primary" @click="moveSubGroup" :disabled="!canMoveSubGroup">Move Sub-Group</button>
        <button @click="$emit('track:add', editSelection)">Add Track</button>
        <button class="danger" @click="$emit('subgroup:remove', editSelection)">Remove Sub-Group</button>
        <button @click="$emit('subgroup:move:up', editSelection)">Move Up</button>
        <button @click="$emit('subgroup:move:down', editSelection)">Move Down</button>
      </div>
    </div>
    <!-- Group Edit -->
    <div v-else-if="editSelection && editSelection.type === 'group'">
      <label>
        <span>Group Title:</span>
        <input v-model="editSelection.data.title" />
      </label>
      <div class="edit-actions">
        <button @click="$emit('subgroup:add', editSelection)">Add Sub-Group</button>
        <button @click="$emit('group:add', editSelection)">Add Group</button>
        <button class="danger" @click="$emit('group:remove', editSelection)">Remove Group</button>
        <button @click="$emit('group:move:up', editSelection)">Move Up</button>
        <button @click="$emit('group:move:down', editSelection)">Move Down</button>
      </div>
    </div>
    <div v-else>
      <em>Select a track, sub-group, or group to edit.</em>
      <div class="edit-actions">
        <button @click="$emit('group:add', editSelection)">Add Group</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { EditSelection, Group } from "../types";
import { PropType } from "vue";

export default {
  name: "EditorPanel",
  props: {
    editSelection: {
      type: Object as PropType<EditSelection>,
      required: false,
      default: null
    },
    groups: {
      type: Array as PropType<Group[]>,
      required: true
    },
    isDirty: {
      type: Boolean,
      required: true
    }
  },
  emits: [
    "save",
    "track:add",
    "track:remove",
    "track:move:up",
    "track:move:down",
    "track:move:to",
    "subgroup:add",
    "subgroup:remove",
    "subgroup:move:up",
    "subgroup:move:down",
    "subgroup:move:to",
    "group:add",
    "group:remove",
    "group:move:up",
    "group:move:down",
  ],
  data() {
    return {
      subGroupMoveGroupId: null as string | null,
      trackMoveGroupId: null as string | null,
      trackMoveSubGroupId: null as string | null,
    };
  },
  watch: {
    editSelection: {
      handler(val) {
        // SubGroup move
        if (val && val.type === "subgroup") {
          const parentGroup = this.groups.find(g =>
            g.subGroups.some(sg => sg.id === val.data.id)
          );
          this.subGroupMoveGroupId = parentGroup?.id ?? null;
        }
        // Track move
        if (val && val.type === "track") {
          let found = false;
          for (const g of this.groups) {
            for (const sg of g.subGroups) {
              if (sg.items.some(t => t.id === val.data.id)) {
                this.trackMoveGroupId = g.id;
                this.trackMoveSubGroupId = sg.id;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      },
      immediate: true
    },
    trackMoveGroupId(newVal) {
      // When group changes, reset subGroup to first available
      if (this.editSelection && this.editSelection.type === "track" && newVal) {
        const group = this.groups.find(g => g.id === newVal);
        if (group && group.subGroups.length > 0) {
          this.trackMoveSubGroupId = group.subGroups[0].id;
        } else {
          this.trackMoveSubGroupId = null;
        }
      }
    }
  },
  computed: {
    availableSubGroups(): any[] {
      const group = this.groups.find(g => g.id === this.trackMoveGroupId);
      return group ? group.subGroups : [];
    },
    canMoveSubGroup(): boolean {
      if (!this.editSelection?.data || this.editSelection.type !== "subgroup") return false;
      const parentGroup = this.groups.find(g =>
        g.subGroups.some(sg => sg.id === this.editSelection!.data.id)
      );
      return !!(this.subGroupMoveGroupId && this.subGroupMoveGroupId !== parentGroup?.id);
    },
    canMoveTrack(): boolean {
      if (!this.editSelection?.data || this.editSelection.type !== "track") return false;
      if (!this.trackMoveGroupId || !this.trackMoveSubGroupId) return false;
      for (const g of this.groups) {
        for (const sg of g.subGroups) {
          if (sg.items.some(t => t.id === this.editSelection!.data.id)) {
            return g.id !== this.trackMoveGroupId || sg.id !== this.trackMoveSubGroupId;
          }
        }
      }
      return false;
    }
  },
  methods: {
    moveSubGroup() {
      if (!this.editSelection || this.editSelection.type !== "subgroup") return;
      this.$emit("subgroup:move:to", {
        subGroupId: this.editSelection.data.id,
        targetGroupId: this.subGroupMoveGroupId
      });
    },
    moveTrack() {
      if (!this.editSelection || this.editSelection.type !== "track") return;
      this.$emit("track:move:to", {
        trackId: this.editSelection.data.id,
        targetGroupId: this.trackMoveGroupId,
        targetSubGroupId: this.trackMoveSubGroupId
      });
    }
  }
};
</script>

<style scoped>
.edit-panel-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}
.edit-panel-content label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text);
}
.edit-panel-content input[type="text"],
.edit-panel-content input[type="range"],
.edit-panel-content select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--accent);
  background: rgba(255,255,255,0.07);
  color: var(--text);
  font-size: 1rem;
  margin-top: 2px;
}
.edit-panel-content input[type="checkbox"] {
  margin-left: 0.5em;
  accent-color: var(--accent);
}
.edit-panel-content .pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  font-size: 12px;
  color: var(--muted);
  margin-left: 0.5em;
}
.edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;
}
.edit-actions button {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--accent);
  background: var(--panel);
  color: var(--text);
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s, color 0.2s;
}
.edit-actions button.primary {
  background: var(--accent);
  color: #0b1220;
  border-color: var(--accent);
}
.edit-actions button.danger {
  background: #e11d48;
  color: #fff;
  border-color: #e11d48;
}
.edit-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.edit-panel-content select {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1.5px solid var(--accent);
  background: rgba(96,165,250,0.08);
  color: var(--text);
  font-size: 1rem;
  margin-top: 2px;
  transition: border-color 0.2s, box-shadow 0.2s;
  outline: none;
  appearance: none;
  min-width: 120px;
}
.edit-panel-content select:focus {
  border-color: var(--ok);
  box-shadow: 0 0 0 2px var(--accent-2);
}
.edit-panel-content option {
  background: var(--panel);
  color: var(--text);
}
.save-btn {
  background: var(--accent, #60a5fa);
  color: #0b1220;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 1.1rem;
  font-weight: bold;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, box-shadow 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.save-btn.dirty {
  background: #eab308; /* yellow for unsaved changes */
  color: #0b1220;
  box-shadow: 0 2px 8px rgba(234,179,8,0.15);
  animation: pulse 1.2s infinite alternate;
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(234,179,8,0.3);}
  100% { box-shadow: 0 0 10px 4px rgba(234,179,8,0.25);}
}
</style>