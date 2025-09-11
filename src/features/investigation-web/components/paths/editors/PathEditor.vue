<template>
  <StraightEditor :mode="mode" :link="link" />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import StraightEditor from "./StraightEditor.vue";
export default defineComponent({
  name: "PathEditor",
  components:{ StraightEditor },
  props:{ mode:{type:String,required:true}, link:{type:Object,required:false}, track:{type:Object,required:false} }
});
</script>