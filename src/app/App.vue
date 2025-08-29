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
:host, main {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
main {
  min-height: 0;
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}
main > * {
  flex: 1 1 auto;
  min-height: 0;
}
</style>