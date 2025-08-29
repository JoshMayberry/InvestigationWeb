<template>
  <div class="soundboard-page">
    <div class="left-panel">
      <MasterVolume
        :masterVol="masterVol"
        @update:masterVol="onMasterVolChange"
      />
      <Sections
        :sections="sections"
        :currentSectionIdx="currentSectionIdx"
        :currentItemIdx="currentItemIdx"
        :trackVol="trackVol"
        :override="override"
        :loopOne="loopOne"
        @play="onPlay"
        @update:trackVol="onTrackVolChange"
        @update:override="onOverrideChange"
        @update:loopOne="onLoopOneChange"
      />
    </div>
    <Player
      :currentSection="currentSection"
      :currentItem="currentItem"
      @play="onPlay"
      @next="onNext"
    />
  </div>
</template>

<script>
import MasterVolume from "../components/MasterVolume.vue"
import Sections from "../components/Sections.vue"
import Player from "../components/Player.vue"
import { SCENARIO_DATA } from "../assets/scenario-data"

export default {
  name: "SoundboardPage",
  components: { MasterVolume, Sections, Player },
  data() {
    return {
      sections: JSON.parse(JSON.stringify(SCENARIO_DATA)),
      currentSectionIdx: null,
      currentItemIdx: null,
      masterVol: 50,
      trackVol: {},
      override: {},
      loopOne: {},
    }
  },
  computed: {
    currentSection() {
      return this.currentSectionIdx != null ? this.sections[this.currentSectionIdx] : null
    },
    currentItem() {
      if (this.currentSectionIdx == null || this.currentItemIdx == null) return null
      return this.sections[this.currentSectionIdx].items[this.currentItemIdx]
    }
  },
  methods: {
    onPlay({ sectionIdx, itemIdx }) {
      this.currentSectionIdx = sectionIdx
      this.currentItemIdx = itemIdx
    },
    onNext() {
      if (this.currentSectionIdx == null) return
      const items = this.sections[this.currentSectionIdx].items
      if (!items.length) return
      this.currentItemIdx = (this.currentItemIdx + 1) % items.length
    },
    onMasterVolChange(val) { this.masterVol = val },
    onTrackVolChange({ key, value }) { this.$set(this.trackVol, key, value) },
    onOverrideChange({ key, value }) { this.$set(this.override, key, value) },
    onLoopOneChange({ key, value }) { this.$set(this.loopOne, key, value) },
  }
}
</script>

<style scoped>
.soundboard-page {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) 380px; /* Limit left panel growth */
  gap: 18px;
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
  min-height: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
}
.left-panel > .masterVol {
  flex: 0 0 auto;
}
.left-panel > .sections {
  flex: 1 1 auto;
  min-height: 0;
}
</style>