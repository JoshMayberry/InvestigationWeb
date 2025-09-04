<template>
  <Transition :css="false" @enter="enter" @leave="leave">
    <div v-if="open" class="right-drawer-anim">
      <Drawers class="right-drawers" side="right">
        <PanelStaging :drawer="{ icon: 'chair', label: 'Staging' }" />
        <PanelAdd :drawer="{ icon: 'add', label: 'Add' }" />
      </Drawers>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { gsap } from "gsap";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelStaging from "./PanelStaging.vue";
import PanelAdd from "./PanelAdd.vue";

export default defineComponent({
  name: "DrawersRight",
  components: { Drawers, PanelStaging, PanelAdd },
  props: {
    open: { type: Boolean, default: false },
  },
  methods: {
    enter(el: Element, done: () => void) {
      gsap.fromTo(el, { xPercent: 100, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out", onComplete: done });
    },
    leave(el: Element, done: () => void) {
      gsap.to(el, { xPercent: 100, autoAlpha: 0, duration: 0.22, ease: "power2.in", onComplete: done });
    },
  },
});
</script>

<style scoped>
.right-drawer-anim {
  flex: 0 0 auto;
  display: flex;
  border-left: 1px solid rgba(255,255,255,0.06);
  will-change: transform;
}
</style>