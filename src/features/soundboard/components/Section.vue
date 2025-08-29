<template>
  <div class="col">
    <header><h2>{{ section.title }}</h2></header>
    <div class="items">
      <SoundboardTrack
        v-for="(item, iIdx) in section.items"
        :key="iIdx"
        :item="item"
        :sectionIdx="sectionIdx"
        :itemIdx="iIdx"
        :isPlaying="currentItemIdx === iIdx"
        :trackVol="trackVol"
        :override="override"
        :loopOne="loopOne"
        @play="onPlay"
        @update:trackVol="onTrackVolChange"
        @update:override="onOverrideChange"
        @update:loopOne="onLoopOneChange"
      />
    </div>
  </div>
</template>

<script>
import SoundboardTrack from "./Track.vue"
export default {
  name: "Section",
  components: { SoundboardTrack },
  props: {
    section: Object,
    sectionIdx: Number,
    currentItemIdx: Number,
    trackVol: Object,
    override: Object,
    loopOne: Object,
  },
  methods: {
    onPlay(payload) { this.$emit("play", payload) },
    onTrackVolChange(payload) { this.$emit("update:trackVol", payload) },
    onOverrideChange(payload) { this.$emit("update:override", payload) },
    onLoopOneChange(payload) { this.$emit("update:loopOne", payload) },
  }
}
</script>

<style scoped>
.col {
  background: rgba(255,255,255,.03);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-height: 240px;
}
.col header {
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255,255,255,.06);
  border-radius: 12px 12px 0 0;
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.col header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: var(--muted);
  letter-spacing: 0.5px;
}
.items {
  padding: 10px 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>