<template>
  <div class="edit-extra">
    <section class="section">
      <h3>Staging Area</h3>
      <p class="muted">Stub: place to temporarily hold nodes out of the way.</p>
    </section>
  </div>
</template>

<script lang="ts">
export default {
  name: "PanelStaging",
};
</script>

<style scoped>
.edit-extra { display: flex; flex-direction: column; gap: 16px; color: var(--text); }
.section h3 { margin: 0 0 6px; color: var(--text); }
.muted { color: var(--muted); }
</style>