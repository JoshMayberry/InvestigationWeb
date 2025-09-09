<template>
  <p class="muted small">No additional options for Straight links.</p>
</template>
<script lang="ts">
export default { name: "StraightEditor", props: { mode:String, link:Object } };
</script>
<style scoped>
.muted.small { font-size:11px; color: var(--muted); }
</style>