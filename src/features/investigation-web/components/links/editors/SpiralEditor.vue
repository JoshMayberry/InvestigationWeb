<template>
  <!-- Reuse the Corkscrew editor UI/logic for Spiral -->
  <CorkscrewEditor :mode="mode" :link="link" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CorkscrewEditor from "./CorkscrewEditor.vue";

export default defineComponent({
  name: "SpiralEditor",
  components: { CorkscrewEditor },
  props: {
    mode: { type: String as () => "draft" | "selected", required: true },
    link: { type: Object, required: false }
  }
});
</script>