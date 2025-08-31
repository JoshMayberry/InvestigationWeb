<template>
  <teleport to="#tooltip-root">
    <div
      v-if="visible"
      ref="tipEl"
      class="tooltip"
      role="tooltip"
    >
      <slot :data="resolvedData">
        <div class="tooltip-default">
          {{ resolvedData?.title ?? '' }}
        </div>
      </slot>
      <div class="tooltip-arrow" data-popper-arrow></div>
    </div>
  </teleport>
</template>

<script lang="ts">
import { defineComponent, onMounted, onBeforeUnmount, PropType, ref, watch, computed, nextTick } from "vue";
import { createPopper, Instance, Placement } from "@popperjs/core";

type TargetAPI = {
  getReferenceEl: () => HTMLElement | null;
  getTooltipData?: () => Record<string, any>;
};

export default defineComponent({
  name: "ToolTip",
  props: {
    target: { type: Object as PropType<TargetAPI>, required: true },
    visible: { type: Boolean, default: false },
    placement: { type: String as PropType<Placement>, default: "top" },
    offset: { type: Array as unknown as PropType<[number, number]>, default: () => [0, 8] },
  },
  setup(props) {
    const tipEl = ref<HTMLElement | null>(null);
    const popper = ref<Instance | null>(null);

    const resolvedData = computed(() => props.target.getTooltipData?.() ?? null);

    const onWinChange = () => { popper.value?.update(); };

    function destroyPopper() {
      if (popper.value) {
        popper.value.destroy();
        popper.value = null;
      }
    }

    async function ensurePopper() {
      const reference = props.target.getReferenceEl();
      if (!reference) return;
      await nextTick(); // wait for tipEl to mount
      if (!tipEl.value) return;
      destroyPopper();
      popper.value = createPopper(reference, tipEl.value, {
        placement: props.placement,
        strategy: "fixed",
        modifiers: [
          { name: "offset", options: { offset: props.offset } },
          { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
          { name: "flip", options: { fallbackPlacements: ["top", "bottom", "right", "left"] } },
          { name: "eventListeners", enabled: true },
        ],
      });
      popper.value.update();
    }

    watch(() => props.visible, async (v) => {
      if (v) {
        await ensurePopper();
      } else {
        destroyPopper();
      }
    });

    watch(() => props.placement, (p) => {
      if (popper.value) popper.value.setOptions((opts) => ({ ...opts, placement: p }));
    });

    onMounted(() => {
      window.addEventListener("scroll", onWinChange, true);
      window.addEventListener("resize", onWinChange);
    });
    onBeforeUnmount(() => {
      window.removeEventListener("scroll", onWinChange, true);
      window.removeEventListener("resize", onWinChange);
      destroyPopper();
    });

    return { tipEl, resolvedData };
  },
});
</script>

<style scoped>
.tooltip {
  /* Popper sets position via inline styles; using fixed strategy */
  background: rgba(17, 24, 39, 0.98);
  color: var(--text);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.2;
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
  max-width: 320px;
  pointer-events: none; /* keep interactions on page */
  z-index: 1; /* layered inside tooltip-root */
}
.tooltip-arrow[data-popper-arrow] {
  position: absolute;
  width: 8px;
  height: 8px;
}
.tooltip-arrow::before {
  content: "";
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(17, 24, 39, 0.98);
  transform: rotate(45deg);
}
</style>