<template>
  <div class="drawers-container" :class="['side-' + side]">
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
        v-for="(child, i) in panelVNodes"
        :key="i"
        class="drawer-panel"
        v-show="i === openIndex"
      >
        <component :is="child.type" v-bind="child.props" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, VNode, Fragment } from "vue";
import { gsap } from "gsap";

function flatten(children: VNode[] = []): VNode[] {
  const out: VNode[] = [];
  for (const c of children) {
    if (!c) continue;
    // Fragment
    if (c.type === Fragment && Array.isArray(c.children)) {
      out.push(...flatten(c.children as VNode[]));
    } else {
      out.push(c);
    }
  }
  return out;
}

export default defineComponent({
  name: "Drawers",
  emits: ["drawer:opened", "drawer:closed", "drawer:change"],
  props: {
    side: { type: String as () => "left" | "right", default: "left" },
    panelWidth: { type: Number, default: 320 },
    startOpen: { type: Boolean, default: false },
  },
  data() {
    return {
      openIndex: null as number | null,
    };
  },
  computed: {
    // Raw slot -> flattened (handles Fragments)
    panelVNodes(): VNode[] {
      const raw = this.$slots.default ? (this.$slots.default() as VNode[]) : [];
      return flatten(raw).filter(v => v.type !== Comment);
    },
    drawerConfigs(): Array<Record<string, any>> {
      return this.panelVNodes.map(v => (v.props as any)?.drawer || {});
    },
  },
  watch: {
    openIndex(newVal: number | null, oldVal: number | null) {
      this.animateDrawer(newVal);
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
    // If slot content changes (dynamic tabs), keep index sane
    panelVNodes() {
      if (this.openIndex != null && this.openIndex >= this.panelVNodes.length) {
        this.openIndex = null;
      }
    }
  },
  mounted() {
    this.setPanelWidth(0);
    if (this.startOpen && this.drawerConfigs.length) {
      // open first drawer after next tick for smooth animation
      requestAnimationFrame(() => { this.openIndex = 0; });
    }
  },
  methods: {
    toggleDrawer(i: number) {
      this.openIndex = this.openIndex === i ? null : i;
    },
    setPanelWidth(width: number) {
      const el = this.$refs.drawerPanels as HTMLDivElement | undefined;
      if (el) gsap.set(el, { width, padding: width ? "1rem" : 0 });
    },
    animateDrawer(newVal: number | null) {
      const el = this.$refs.drawerPanels as HTMLDivElement | undefined;
      if (!el) return;
      const w = newVal == null ? 0 : this.panelWidth;
      gsap.to(el, {
        width: w,
        padding: w ? "1rem" : 0,
        duration: 0.30,
        ease: "power2.out"
      });
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
.drawers-container.side-right { flex-direction: row-reverse; }
.drawer-handles {
  display: flex;
  flex-direction: column;
  background: var(--panel);
  min-width: 56px;
  box-shadow: 2px 0 16px rgba(0,0,0,0.10);
  z-index: 2;
}
.drawers-container.side-right .drawer-handles {
  box-shadow: -2px 0 16px rgba(0,0,0,0.10);
}
.drawer-handle {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  font-size: 24px;
  margin: 6px;
  border-radius: 8px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background .2s, color .2s;
}
.drawer-handle.active,
.drawer-handle:hover {
  background: rgba(96,165,250,0.12);
  color: var(--accent-2);
}
.drawer-panels {
  flex: 0 0 auto;
  min-height: 0;
  position: relative;
  background: var(--panel);
  display: flex;
  flex-direction: column;
  width: 0;
  overflow: auto;
}
.drawer-panel {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}
</style>