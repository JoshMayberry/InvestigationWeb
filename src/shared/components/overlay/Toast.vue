<template>
  <div
    class="toast"
    :class="toast.type"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
  >
    <svg v-if="!isSticky" class="progress" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <circle class="track" cx="9" cy="9" r="8" />
      <circle ref="progressCircle" class="progress-ring" cx="9" cy="9" r="8" />
    </svg>
    <span class="text">{{ toast.text }}</span>
    <button v-if="isSticky" class="close" @click.stop="close">✕</button>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import gsap from "gsap";
import type { Toast as ToastModel } from "@shared/stores/toastStore";

export default defineComponent({
  name: "Toast",
  props: {
    toast: { type: Object as () => ToastModel, required: true },
  },
  emits: ["dismiss"],
  data() {
    return {
      tween: null as gsap.core.Tween | null,
      circumference: 0,
    };
  },
  computed: {
    isSticky(): boolean {
      return !!this.toast.sticky || !this.toast.timeout;
    },
  },
  mounted() {
    if (this.isSticky) return;

    const radius = 8;
    this.circumference = 2 * Math.PI * radius;
    const progressEl = this.$refs.progressCircle as SVGCircleElement | null;
    if (!progressEl) return;

    // Initialize the ring
    progressEl.setAttribute("stroke-dasharray", `${this.circumference}`);
    progressEl.setAttribute("stroke-dashoffset", `${this.circumference}`);

    const durationSec = (this.toast.timeout || 3000) / 1000;

    // Animate the SVG attribute directly; this supports reverse() cleanly
    this.tween = gsap.to(progressEl, {
      attr: { "stroke-dashoffset": 0 },
      duration: durationSec,
      ease: "none",
      onComplete: () => this.$emit("dismiss", this.toast.id),
    });
  },
  beforeUnmount() {
    this.tween?.kill();
    this.tween = null;
  },
  methods: {
    onEnter() {
      // Reverse playback while hovered (rewinds the circle)
      if (!this.tween) return;
      if (this.tween.progress() > 0) {
        this.tween.reverse();
      } else {
        this.tween.pause(0);
      }
    },
    onLeave() {
      // Resume forward playback
      if (!this.tween) return;
      this.tween.reversed(false);
      this.tween.play();
    },
    close() {
      this.$emit("dismiss", this.toast.id);
    },
  },
});
</script>

<style scoped>
.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 260px;
  max-width: 460px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--muted);
  box-shadow: 0 6px 20px rgba(0,0,0,0.35);
}
.toast.success { border-color: var(--ok); }
.toast.info { border-color: var(--accent); }
.toast.error { border-color: var(--warn); }

.progress { flex: 0 0 auto; }
.progress .track {
  fill: none;
  stroke: var(--bg);
  stroke-width: 2;
  opacity: 0.7;
}
.progress .progress-ring {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.5;
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
}

.close {
  margin-left: auto;
  background: transparent;
  color: var(--text);
  border: none;
  cursor: pointer;
  opacity: 0.9;
}
.text { white-space: pre-wrap; }
</style>