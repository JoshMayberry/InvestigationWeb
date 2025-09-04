<template>
  <div
    class="item"
    :class="{ playing: trackState === 'playing', paused: trackState === 'paused', editing: trackState === 'editing' }"
    @click="onSelectTrack"
    :tabindex="currentMode === 'edit' ? 0 : undefined"
    :style="currentMode === 'edit' ? 'cursor:pointer;' : ''"
  >
    <div class="meta">
      <div class="title"><span class="dot"></span>{{ item.title }}</div>
      <div class="urlVol">
        <label class="volWrap">
          <input
            type="checkbox"
            :checked="item.useVolume"
            @change="onFieldChange('useVolume', ($event?.target as HTMLInputElement)?.checked)"
            :disabled="currentMode === 'edit'"
          />
          <input
            type="range"
            class="slider vol"
            min="0"
            max="100"
            step="1"
            :value="item.volume"
            :disabled="!item.useVolume || currentMode === 'edit'"
            @change="onFieldChange('volume', + ($event?.target as HTMLInputElement).value)"
          />
          <span class="pill pct">{{ item.volume }}</span>
        </label>
      </div>
    </div>
    <div class="actions">
      <button class="btn small playNow" @click.stop="onPlayPause" :disabled="currentMode === 'edit'">
        <span v-if="trackState === 'playing'">⏸</span>
        <span v-else>▶</span>
      </button>
      <button
        class="btn small loopBtn"
        :class="{ toggled: item.isLoop }"
        @click.stop="onFieldChange('isLoop', !item.isLoop)"
        :disabled="currentMode === 'edit'"
      >{{ item.isLoop ? "Looping" : "Loop" }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { TrackState, Track, SoundboardMode } from "../types";

export default defineComponent({
  name: "TrackItem",
  inject: { soundboardCtx: { default: null } },
  props: {
    item: { type: Object as PropType<Track>, required: true },
    trackState: { type: String as PropType<TrackState>, required: true },
    groupIndex: { type: [Number, String], required: true },
    subGroupIndex: { type: [Number, String], required: true },
    trackIndex: { type: [Number, String], required: true },
    currentMode: { type: String as PropType<SoundboardMode>, required: true }
  },
  emits: [
    // keep for backward compatibility during migration
    "track:state",
    "track:update",
    "track:select"
  ],
  methods: {
    onPlayPause() {
      if (this.currentMode === "edit") return;
      const act = (this as any).soundboardCtx?.actions;
      if (act?.setTrackState) {
        const next = this.trackState === "playing" ? "paused" : "playing";
        act.setTrackState({
          state: next as any,
          groupIndex: Number(this.groupIndex),
          subGroupIndex: Number(this.subGroupIndex),
          trackIndex: Number(this.trackIndex),
        });
      } else {
        // fallback if not provided
        this.$emit("track:state", {
          state: this.trackState === "playing" ? "paused" : "playing",
          groupIndex: this.groupIndex,
          subGroupIndex: this.subGroupIndex,
          trackIndex: this.trackIndex
        });
      }
    },
    onFieldChange(key: string, value: any) {
      if (this.currentMode === "edit") return;
      const act = (this as any).soundboardCtx?.actions;
      if (act?.updateTrack) {
        act.updateTrack({
          groupIndex: Number(this.groupIndex),
          subGroupIndex: Number(this.subGroupIndex),
          trackIndex: Number(this.trackIndex),
          key,
          value
        });
      } else {
        this.$emit("track:update", {
          groupIndex: this.groupIndex,
          subGroupIndex: this.subGroupIndex,
          trackIndex: this.trackIndex,
          key,
          value
        });
      }
    },
    onSelectTrack() {
      if (this.currentMode !== "edit") return;
      const act = (this as any).soundboardCtx?.actions;
      if (act?.selectTrack) {
        act.selectTrack({
          groupIndex: Number(this.groupIndex),
          subGroupIndex: Number(this.subGroupIndex),
          trackIndex: Number(this.trackIndex),
        });
      } else {
        this.$emit("track:select", {
          groupIndex: this.groupIndex,
          subGroupIndex: this.subGroupIndex,
          trackIndex: this.trackIndex
        });
      }
    }
  }
});
</script>

<style scoped>
.item {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 10px;
  padding: 12px 10px;
  min-width: 0;
  transition: box-shadow 0.2s;
}
.item.playing {
  outline: 2px solid var(--ok);
  box-shadow: 0 0 0 4px var(--ring);
  background: rgba(52,211,153,0.08);
}
.item.editing {
  outline: 2px solid var(--accent);
  background: rgba(96,165,250,0.08);
}
.meta {
  flex: 1 1 220px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  min-width: 0;
  font-size: 16px;
  color: var(--text);
}
.title .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: transparent;
  border: 1.5px solid rgba(255,255,255,.3);
  flex: 0 0 auto;
  transition: background 0.2s, border-color 0.2s;
}
.item.playing .title .dot {
  background: var(--ok);
  border-color: var(--ok);
}
.item.editing {
  outline: 2px solid var(--accent);
  background: rgba(96,165,250,0.08);
}
.urlVol {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  margin-top: 2px;
}
.urlVol input[type="text"] {
  flex: 1 1 180px;
  min-width: 120px;
  border: 1px solid rgba(255,255,255,.08);
  background: #0b1220;
  color: var(--text);
  padding: 6px 8px;
  border-radius: 8px;
  font-size: 13px;
}
.volWrap {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}
.pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.08);
  font-size: 12px;
  color: var(--muted);
}
.slider {
  width: 100px;
  accent-color: var(--accent);
}
.actions {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: flex-end;
  align-items: flex-end;
  margin-left: 8px;
}
.btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.08);
  color: #0b1220;
  background: var(--accent);
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s, color 0.2s;
}
.btn.secondary {
  background: transparent;
  color: var(--text);
}
.btn.current {
  background: var(--accent-2);
  color: #0b1220;
}
.btn.toggled {
  background: var(--ok);
  color: #0b1220;
}
.btn:disabled {
  opacity: .6;
  cursor: not-allowed;
}
.sub-group-content {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.5rem 1.5rem 1rem 1.5rem;
  min-width: 0;
  min-height: 0;
  align-items: flex-start;
  box-sizing: border-box;
}
.track-list {
  flex: 1 1 320px;
  min-width: 220px;
  max-width: 100%;
}
</style>