<template>
  <div class="sidebar-container">
    <div class="icon-bar">
      <button
        class="icon-btn"
        :class="{ active: openPanel === 'tree' }"
        @click="togglePanel('tree')"
        aria-label="Show Navigation"
      >
        <span class="material-icons">menu</span>
      </button>
      <button
        class="icon-btn"
        :class="{ active: openPanel === 'player' }"
        @click="togglePanel('player')"
        aria-label="Show Player"
      >
        <span class="material-icons">play_circle</span>
      </button>
    </div>
    <div ref="sidebar" class="sidebar">
      <button class="close-btn" v-if="openPanel" @click="closePanel" aria-label="Close Sidebar">
        <span class="material-icons">close</span>
      </button>
      <!-- Navigation Tree Panel -->
      <div
        class="sidebar-panel tree-panel"
        :class="{ visible: openPanel === 'tree' }"
      >
        <ul>
          <li v-for="group in groups" :key="group.id">
            <div @click="selectGroup(group)">
              {{ group.title }}
            </div>
            <ul>
              <li
                v-for="sub in group.subGroups"
                :key="sub.id"
                @click="selectSubGroup(group, sub)"
              >
                {{ sub.title }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
      <!-- Player Panel -->
      <div
        class="sidebar-panel player-panel"
        :class="{ visible: openPanel === 'player' }"
      >
        <slot name="player" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { gsap } from "gsap";

type SubGroup = { id: string; title: string };
type Group = { id: string; title: string; subGroups: SubGroup[] };

export default defineComponent({
  name: "SidebarTree",
  props: {
    groups: {
      type: Array as PropType<Group[]>,
      required: true
    }
  },
  emits: ["select", "show-player"],
  data() {
    return {
      openPanel: null as null | "tree" | "player",
    };
  },
  mounted() {
    if (this.$refs.sidebar) {
      gsap.set(this.$refs.sidebar, { width: 0, padding: 0 });
    }
  },
  methods: {
    selectGroup(group: Group) {
      this.$emit("select", { groupId: group.id, subGroupId: null });
    },
    selectSubGroup(group: Group, sub: SubGroup) {
      this.$emit("select", { groupId: group.id, subGroupId: sub.id });
    },
    togglePanel(panel: "tree" | "player") {
      if (this.openPanel === panel) {
        this.animateSidebar(false);
        this.openPanel = null;
      } else {
        this.openPanel = panel;
        this.$nextTick(() => this.animateSidebar(true));
        if (panel === "player") this.$emit("show-player");
      }
    },
    closePanel() {
      this.animateSidebar(false);
      this.openPanel = null;
    },
    animateSidebar(open: boolean) {
      const sidebar = this.$refs.sidebar as HTMLElement | undefined;
      if (!sidebar) return;
      if (open) {
        gsap.to(sidebar, {
          width: 260,
          padding: "1rem",
          duration: 0.35,
          ease: "power2.out"
        });
      } else {
        gsap.to(sidebar, {
          width: 0,
          padding: 0,
          duration: 0.35,
          ease: "power2.in"
        });
      }
    }
  }
});
</script>

<style scoped>
.sidebar-container {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
  min-width: 0;
}
.icon-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--panel);
  padding: 0.5rem 0;
  width: 56px;
  min-width: 56px;
  box-shadow: 2px 0 16px rgba(0,0,0,0.10);
  z-index: 2;
}
.icon-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--accent);
  font-size: 2rem;
  margin: 0.5rem 0;
  border-radius: 50%;
  transition: background 0.2s, color 0.2s;
}
.icon-btn.active,
.icon-btn:hover {
  background: rgba(96,165,250,0.12);
  color: var(--accent-2);
}
.sidebar {
  position: relative;
  min-width: 0;
  width: 0;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--panel);
  color: var(--text);
  box-shadow: 2px 0 16px rgba(0,0,0,0.18);
  height: 100%;
  z-index: 10;
  padding: 0;
  transition: width 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.sidebar-panel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-100%);
  transition: opacity 0.3s, transform 0.3s;
  background: inherit;
  z-index: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-panel.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateX(0);
  z-index: 2;
}

.close-btn {
  align-self: flex-end;
  background: none;
  border: none;
  color: var(--muted);
  font-size: 2rem;
  cursor: pointer;
  margin-bottom: 0.5rem;
}
.sidebar ul { list-style: none; padding: 0; margin: 0; }
.sidebar li { margin-bottom: 0.5rem; }
.sidebar li > div { font-weight: bold; cursor: pointer; }
.sidebar li ul { margin-left: 1rem; }
.sidebar li ul li { font-weight: normal; cursor: pointer; }
.sidebar::-webkit-scrollbar {
  width: 8px;
  background: rgba(255,255,255,0.06);
}
.sidebar::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 8px;
}
.sidebar::-webkit-scrollbar-thumb:hover {
  background: var(--accent-2);
}
.sidebar {
  scrollbar-width: thin;
  scrollbar-color: var(--accent) rgba(255,255,255,0.06);
}
.sidebar-slide-enter-active, .sidebar-slide-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.sidebar-slide-enter-from, .sidebar-slide-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
.sidebar-slide-enter-to, .sidebar-slide-leave-from {
  opacity: 1;
  transform: translateX(0);
}
</style>