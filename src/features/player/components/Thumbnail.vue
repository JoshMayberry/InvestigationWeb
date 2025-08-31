<template>
  <div
    ref="root"
    class="thumb"
    :class="{ selected }"
    @click="$emit('select', item)"
    @mouseenter="showTip = true"
    @mouseleave="showTip = false"
  >
    <template v-if="item.url">
      <img :src="item.url" :alt="item.name" />
    </template>
    <template v-else>
      <div class="file-placeholder">{{ item.name }}</div>
    </template>
    <div class="name">{{ item.name }}</div>

    <ToolTip :target="exposed" :visible="showTip" placement="top">
      <template #default="{ data }">
        <div class="tip-content">
          <div class="tip-title">{{ data?.title }}</div>
          <div v-if="data?.notes" class="tip-notes">{{ data?.notes }}</div>
        </div>
      </template>
    </ToolTip>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import ToolTip from "@shared/components/overlay/ToolTip.vue";

export type FileItem = {
  name: string;
  url: string | null;
  kind: "image" | "other";
  mime?: string;
};

export default defineComponent({
  name: "Thumbnail",
  components: { ToolTip },
  props: {
    item: { type: Object as PropType<FileItem>, required: true },
    notes: { type: String, default: "" },
    selected: { type: Boolean, default: false },
  },
  emits: ["select"],
  data() {
    return {
      showTip: false as boolean,
      root: null as HTMLElement | null,
    };
  },
  computed: {
    exposed(): { getReferenceEl: () => HTMLElement | null; getTooltipData: () => any } {
      return {
        getReferenceEl: () => this.root,
        getTooltipData: () => ({ title: this.item.name, notes: this.notes }),
      };
    },
  },
  mounted() {
    this.root = this.$refs.root as HTMLElement | null;
  },
});
</script>

<style scoped>
.thumb { border: 2px solid transparent; border-radius: 10px; cursor: pointer; background: var(--panel); transition: border 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; align-items: center; color: var(--text); }
.thumb.selected { border: 2px solid var(--warn); box-shadow: 0 0 10px rgba(251,191,36,0.5); }
.thumb img { width: 130px; height: 130px; object-fit: cover; border-bottom: 1px solid var(--bg); }
.file-placeholder { width: 130px; height: 130px; background: var(--panel); color: var(--muted); display: grid; place-items: center; border-bottom: 1px solid var(--bg); text-align: center; padding: 6px; }
.name { color: var(--text); font-size: 0.85rem; padding: 0.35rem; text-align: center; background: var(--bg); width: 80%; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; }
.tip-content { max-width: 280px; }
.tip-title { font-weight: 600; margin-bottom: 4px; }
.tip-notes { color: var(--text); opacity: 0.85; font-size: 12px; white-space: pre-wrap; }
</style>