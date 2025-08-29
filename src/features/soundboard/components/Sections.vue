<template>
  <div class="sections">
    <Section
      v-for="(section, sIdx) in sections"
      :key="section.id"
      :section="section"
      :sectionIdx="sIdx"
      :currentItemIdx="currentSectionIdx === sIdx ? currentItemIdx : null"
      :trackVol="trackVol"
      :override="override"
      :loopOne="loopOne"
      @play="onPlay"
      @update:trackVol="onTrackVolChange"
      @update:override="onOverrideChange"
      @update:loopOne="onLoopOneChange"
    />
  </div>
</template>

<script>
import Section from './Section.vue'
export default {
  name: 'Sections',
  components: { Section },
  props: {
    sections: Array,
    currentSectionIdx: Number,
    currentItemIdx: Number,
    trackVol: Object,
    override: Object,
    loopOne: Object,
  },
  methods: {
    onPlay(payload) { this.$emit('play', payload) },
    onTrackVolChange(payload) { this.$emit('update:trackVol', payload) },
    onOverrideChange(payload) { this.$emit('update:override', payload) },
    onLoopOneChange(payload) { this.$emit('update:loopOne', payload) },
  }
}
</script>

<style scoped>
.sections {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: minmax(300px,1fr);
  gap: 14px;
  padding-bottom: 8px;
  height: 100%;
  min-height: 0;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: auto;
  box-sizing: border-box;

  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--accent) rgba(255,255,255,0.06); /* Firefox */
}

/* Chrome, Edge, Safari */
.sections::-webkit-scrollbar {
  height: 10px;
  width: 10px;
  background: rgba(255,255,255,0.06);
  border-radius: 8px;
}
.sections::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 8px;
  border: 2px solid rgba(0,0,0,0.08);
}
.sections::-webkit-scrollbar-thumb:hover {
  background: var(--accent-2);
}
.sections::-webkit-scrollbar-corner {
  background: transparent;
}
</style>
