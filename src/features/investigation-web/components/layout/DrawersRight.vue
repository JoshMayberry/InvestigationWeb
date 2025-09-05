<template>
  <Transition :css="false" @enter="enter" @leave="leave">
    <div v-if="open" class="right-drawer-anim">
      <Drawers
        class="right-drawers"
        side="right"
        @drawer:hover="onHandleHover"
        @drawer:change="onChange"
        ref="drawers"
      >
        <PanelStaging
          :drawer="{ icon: 'chair', label: 'Staging' }"
          :staging="staging"
          :placeStagedId="placeStagedId"
          @staging:add="$emit('staging:add')"
          @staging:delete="$emit('staging:delete', $event)"
          @staging:placeToggle="$emit('staging:placeToggle', $event)"
        />
        <PanelAdd
          :drawer="{ icon: 'add', label: 'Add' }"
          :addFreeNode="addFreeNode"
          :editDefaults="editDefaults"
          @tool:addFreeNode="$emit('tool:addFreeNode', $event)"
          @tool:editDefaults="$emit('tool:editDefaults', $event)"
        />
      </Drawers>
    </div>
  </Transition>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { gsap } from "gsap";
import Drawers from "@shared/components/layout/Drawers.vue";
import PanelStaging from "./PanelStaging.vue";
import PanelAdd from "./PanelAdd.vue";

export default defineComponent({
  name: "DrawersRight",
  components: { Drawers, PanelStaging, PanelAdd },
  props: {
    open: { type: Boolean, default: false },
    staging: { type: Array as PropType<any[]>, default: () => [] },
    dragging: { type: Boolean, default: false },
    addFreeNode: { type: Boolean, default: false },
    placeStagedId: { type: String, default: null },
    editDefaults: { type: Boolean, default: false },
  },
  emits: [
    "staging:add",
    "staging:delete",
    "staging:placePrompt",
    "staging:placeToggle",
    "tool:addFreeNode",
    "tool:editDefaults",
    "panel:change"
  ],
  methods: {
    enter(el: Element, done: () => void) {
      gsap.fromTo(el, { xPercent: 100, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 0.28, ease: "power2.out", onComplete: done });
    },
    leave(el: Element, done: () => void) {
      gsap.to(el, { xPercent: 100, autoAlpha: 0, duration: 0.22, ease: "power2.in", onComplete: done });
    },
    onHandleHover(e: { index:number }) {
      if (this.dragging && e.index === 0) {
        (this.$refs.drawers as any)?.activate?.(0);
      }
    },
    onChange(p:{ index:number|null }) {
      this.$emit("panel:change", p);
    }
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