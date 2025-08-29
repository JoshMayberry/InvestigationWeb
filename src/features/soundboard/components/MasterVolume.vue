<template>
  <div class="masterVol">
    <strong>Master Volume</strong>
    <input class="slider" type="range" min="0" max="100" step="1" :value="masterVol" @input="onInput">
    <span class="pill">{{ masterVol }}</span>
  </div>
</template>

<script>
export default {
  name: "MasterVolume",
  props: { masterVol: { type: Number, required: true } },
  methods: {
    onInput(e) {
      this.$emit("update:masterVol", +e.target.value)
    }
  }
}
</script>

<style scoped>
.masterVol{grid-column:1/-1;display:flex;gap:10px;align-items:center;padding:8px 10px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:10px}
.masterVol .slider{width:220px}
</style>