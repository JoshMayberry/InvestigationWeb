<template>
  <!-- Reuse the Corkscrew editor UI/logic for Spiral -->
  <CorkscrewEditor :mode="mode" :link="link" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import CorkscrewEditor from "./CorkscrewEditor.vue";
export default defineComponent({
  name: "SpiralEditor",
  components:{ CorkscrewEditor },
  props:{ mode:{type:String,required:true}, link:{type:Object,required:false}, track:{type:Object,required:false} }
});
</script>