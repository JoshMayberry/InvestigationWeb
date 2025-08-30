<template>
  <div class="item" :class="{ playing: isPlaying }">
    <div class="meta">
      <div class="title"><span class="dot"></span>{{ item.title }}</div>
      <div class="urlVol">
        <input type="text" v-model="url" @change="onUrlChange">
        <label class="volWrap">
          <input type="checkbox" v-model="isOver" @change="onOverrideChange"> Override
          <input type="range" class="slider vol" min="0" max="100" step="1" :value="vol" :disabled="!isOver" @input="onVolInput" @change="onVolChange">
          <span class="pill pct">{{ vol }}</span>
        </label>
      </div>
    </div>
    <div class="actions">
      <button class="btn small playNow" @click="onPlay">▶</button>
      <button class="btn small loopBtn" :class="{ toggled: isLoop }" @click="onLoopToggle">{{ isLoop ? "Looping" : "Loop" }}</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "Track",
  props: {
    item: { type: Object as PropType<{ title: string; url: string }>, required: true },
    isPlaying: { type: Boolean, required: true },
    sectionIdx: { type: [Number, String], required: true },
    subGroupIdx: { type: [Number, String], required: true },
    itemIdx: { type: [Number, String], required: true },
    trackVol: { type: Object as PropType<Record<string, number>>, required: true },
    override: { type: Object as PropType<Record<string, boolean>>, required: true },
    loopOne: { type: Object as PropType<Record<string, boolean>>, required: true }
  },
  emits: ["play", "update:url", "update:trackVol", "update:override", "update:loopOne"],
  data() {
    return {
      url: this.item.url,
      isOver: false,
      vol: 50,
      isLoop: false,
    }
  },
  computed: {
    key(): string {
      // Use all indices for uniqueness
      return `${this.sectionIdx}:${this.subGroupIdx}:${this.itemIdx}`;
    }
  },
  watch: {
    override: { handler() { this.isOver = !!this.override[this.key] }, deep: true },
    trackVol: { handler() { this.vol = this.trackVol[this.key] ?? 50 }, deep: true },
    loopOne: { handler() { this.isLoop = !!this.loopOne[this.key] }, deep: true },
    "item.url"(val) { this.url = val }
  },
  methods: {
    onPlay() { this.$emit("play", { sectionIdx: this.sectionIdx, subGroupIdx: this.subGroupIdx, itemIdx: this.itemIdx }) },
    onUrlChange() { this.$emit("update:url", { sectionIdx: this.sectionIdx, subGroupIdx: this.subGroupIdx, itemIdx: this.itemIdx, url: this.url }) },
    onOverrideChange() { this.$emit("update:override", { key: this.key, value: this.isOver }) },
    onVolInput(e: Event) { this.vol = +(e.target as HTMLInputElement).value },
    onVolChange(e: Event) { this.$emit("update:trackVol", { key: this.key, value: +(e.target as HTMLInputElement).value }) },
    onLoopToggle() {
      this.isLoop = !this.isLoop
      this.$emit("update:loopOne", { key: this.key, value: this.isLoop })
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
</style>