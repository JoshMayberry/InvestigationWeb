<template>
  <mcw-tab-bar
    :model-value="activeTabIndex"
    :active-tab-index="activeTabIndex"
    @update:modelValue="onTabChange"
  >
    <mcw-tab v-for="(tab, i) in navTabs" :key="i">
      <span class="mdc-tab__text-label">{{ tab.label }}</span>
    </mcw-tab>
  </mcw-tab-bar>
</template>

<script lang="ts">
import { routeDefinitions } from '@app/router'

export default {
  name: 'NavigationTabs',
  data() {
    return {
      activeTabIndex: 0,
    }
  },
  computed: {
    navTabs() {
      return routeDefinitions
        .filter(r => r.meta?.navigationLabel)
        .sort((a, b) => (a.meta?.navOrder ?? 9999) - (b.meta?.navOrder ?? 9999))
        .map(r => ({
          label: r.meta.navigationLabel,
          path: r.path,
          pathBase: r.pathBase || r.path,
        }))
    }
  },
  watch: {
    $route(to) {
      // console.log("@route", {to, navTabs: this.navTabs});
      const idx = this.navTabs.findIndex(t => {
        if (to.path === "/") {
          return t.path === "/";
        }
        return (t.pathBase !== "/") && to.path.startsWith(t.pathBase);
      })
      this.activeTabIndex = idx >= 0 ? idx : 0
    }
  },
  created() {
    const idx = this.navTabs.findIndex(t => this.$route.path.startsWith(t.pathBase))
    this.activeTabIndex = idx >= 0 ? idx : 0
  },
  methods: {
    onTabChange(index: any) {
      const tab = this.navTabs[index];
      if ((tab.path !== "/") && (this.$route.path.startsWith(tab.pathBase))) {
        return; // Already there
      }

      if (this.$route.path !== tab.path) {
        this.$router.push(tab.path)
      }
    }
  }
}
</script>
