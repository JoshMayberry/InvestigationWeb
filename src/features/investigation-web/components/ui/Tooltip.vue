<template>
  <span class="tt-wrap" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />
    <transition name="fade">
      <span
        v-if="open && text"
        class="tt"
        role="tooltip"
      >{{ text }}</span>
    </transition>
  </span>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
export default defineComponent({
  name: "UiTooltip",
  props: {
    text: { type:String, default:"" },
    delay: { type:Number, default:250 },
    placement: { type:String, default:"top" }
  },
  setup(props){
    const open = ref(false);
    let timer:number|undefined;
    function onEnter(){
      if (timer) clearTimeout(timer);
      timer = window.setTimeout(()=> open.value = true, props.delay);
    }
    function onLeave(){
      if (timer) clearTimeout(timer);
      open.value = false;
    }
    return { open, onEnter, onLeave };
  }
});
</script>

<style scoped>
.tt-wrap { position:relative; display:inline-flex; }
.tt {
  position:absolute;
  bottom:100%;
  left:50%;
  transform: translate(-50%, -6px);
  background: rgba(15,23,42,0.92);
  color: #e2e8f0;
  font-size:11px;
  padding:4px 8px;
  border-radius:5px;
  white-space:nowrap;
  box-shadow:0 4px 14px -4px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,0.07);
  pointer-events:none;
  z-index:1000;
}
.fade-enter-active, .fade-leave-active { transition: opacity .15s; }
.fade-enter-from, .fade-leave-to { opacity:0; }
</style>