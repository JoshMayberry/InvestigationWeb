<template>
  <AppBar />
  <NavigationBar class="mdc-top-app-bar--fixed-adjust" />
  
  <main class="p-4">
    <router-view />
  </main>
</template>

<script setup lang="ts">
import AppBar from '@shared/components/layout/AppBar.vue';
import NavigationBar from '@shared/components/layout/NavigationBar.vue';
import { onMounted, ref } from 'vue'

onMounted(async () => {
})
</script>

<style scoped>
main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

main > * {
  flex: 1;
}
</style>