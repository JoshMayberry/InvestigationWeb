<template>
  <div class="toasts">
    <Toast
      v-for="t in toasts"
      :key="t.id"
      :toast="t"
      @dismiss="dismiss"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toastStore } from "@shared/stores/toastStore";
import Toast from "./Toast.vue";

export default defineComponent({
  name: "Toaster",
  components: { Toast },
  computed: {
    toasts() {
      return toastStore.active;
    },
  },
  methods: {
    dismiss(id: number) {
      toastStore.dismiss(id);
    },
  },
});
</script>

<style scoped>
.toasts {
  position: fixed;
  right: 16px;
  bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 3000;
  pointer-events: none; /* container ignores pointer; items accept */
}
</style>