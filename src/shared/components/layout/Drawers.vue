<template>
  <div class="drawers-container">
    <div class="drawer-handles">
      <button
        v-for="(drawer, i) in drawerConfigs"
        :key="i"
        :class="['drawer-handle', { active: i === openIndex }]"
        @click="toggleDrawer(i)"
        :title="drawer.label || ''"
      >
        <span class="material-icons">{{ drawer.icon }}</span>
      </button>
    </div>
    <div ref="drawerPanels" class="drawer-panels">
      <div
        v-for="(child, i) in drawerChildren"
        :key="i"
        ref="drawerPanel"
        class="drawer-panel"
        v-show="i === openIndex"
      >
        <component :is="child" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { gsap } from "gsap";
import { defineComponent, VNode } from "vue";

export default defineComponent({
  name: "Drawers",
  emits: ["drawer:opened", "drawer:closed", "drawer:change"],
  data() {
    return {
      openIndex: null as number | null, // null means no drawer open
    };
  },
  computed: {
    drawerChildren(): VNode[] {
      return this.$slots.default ? (this.$slots.default() as VNode[]) : [];
    },
    drawerConfigs(): Array<Record<string, any>> {
      return this.drawerChildren.map((vnode) => (vnode.props as any)?.drawer || {});
    },
  },
  watch: {
    openIndex(newVal: number | null, oldVal: number | null) {
      this.animateDrawer(newVal, oldVal);
      // emits
      this.$emit("drawer:change", {
        index: newVal,
        config: newVal == null ? null : this.drawerConfigs[newVal] || null,
      });
      if (oldVal != null && newVal == null) {
        this.$emit("drawer:closed", {
          index: oldVal,
          config: this.drawerConfigs[oldVal] || null,
        });
      }
      if (newVal != null) {
        this.$emit("drawer:opened", {
          index: newVal,
          config: this.drawerConfigs[newVal] || null,
        });
      }
    },
  },
  mounted() {
    // Start with all panels closed
    this.setPanelWidth(0);
  },
  methods: {
    toggleDrawer(i: number) {
      if (this.openIndex === i) {
        // Close if already open
        this.openIndex = null;
      } else {
        this.openIndex = i;
      }
    },
    setPanelWidth(width: number) {
      const el = this.$refs.drawerPanels as HTMLDivElement | undefined;
      if (el) {
        gsap.set(el, { width: width, padding: width ? "1rem" : 0 });
      }
    },
    animateDrawer(newVal: number | null, oldVal: number | null) {
      const el = this.$refs.drawerPanels as HTMLDivElement | undefined;
      if (!el) return;
      if (newVal === null) {
        // Close
        gsap.to(el, {
          width: 0,
          padding: 0,
          duration: 0.35,
          ease: "power2.in",
        });
      } else {
        // Open
        gsap.to(el, {
          width: 320,
          padding: "1rem",
          duration: 0.35,
          ease: "power2.out",
        });
      }
    },
  },
});
</script>

<style scoped>
.drawers-container {
  display: flex;
  flex-direction: row;
  height: 100%;
}
.drawer-handles {
  display: flex;
  flex-direction: column;
  background: var(--panel);
  min-width: 56px;
  box-shadow: 2px 0 16px rgba(0,0,0,0.10);
  z-index: 2;
}
.drawer-handle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  font-size: 2rem;
  margin: 0.5rem 0;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.drawer-handle.active,
.drawer-handle:hover {
  background: rgba(96,165,250,0.12);
  color: var(--accent-2);
}
.drawer-panels {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  position: relative;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  width: 0;
  overflow: hidden;
  transition: width 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1);
}
.drawer-panel {
  width: 100%;
  height: 100%;
  padding: 0;
  box-sizing: border-box;
}
</style>