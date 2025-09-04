<template>
  <div class="filters-root">
    <h3 class="title">Filters</h3>

    <label class="field">
      <span class="lbl">Search</span>
      <input
        class="inp"
        type="text"
        :value="query"
        placeholder="id or label..."
        @input="onQuery(($event.target as HTMLInputElement).value)"
      />
    </label>

    <div class="colors" v-if="palette.length">
      <span class="lbl">Colors</span>
      <div class="chips">
        <button
          v-for="c in palette"
          :key="c"
          class="chip"
          :class="{ on: colors.includes(c) }"
          :style="{ '--c': c }"
          @click="toggleColor(c)"
        >
          <span class="swatch" :style="{ background: c }" />
          {{ shortColor(c) }}
        </button>
      </div>
    </div>

    <div class="actions">
      <button class="small" :disabled="!active" @click="clear">Clear</button>
    </div>

    <p class="hint muted" v-if="!active">All nodes shown.</p>
    <p class="hint muted" v-else>{{ matchCount }} / {{ total }} match</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  name: "PanelFilters",
  props: {
    query: { type: String, default: "" },
    colors: { type: Array as PropType<string[]>, default: () => [] },
    palette: { type: Array as PropType<string[]>, default: () => [] },
    matchCount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
  },
  emits: ["filter:query","filter:toggleColor","filter:clear"],
  methods: {
    onQuery(v: string){ this.$emit("filter:query", v); },
    toggleColor(c: string){ this.$emit("filter:toggleColor", c); },
    clear(){ this.$emit("filter:clear"); },
    shortColor(c: string){
      return c.startsWith("#") && c.length === 7 ? c.slice(1) : c;
    }
  }
});
</script>

<style scoped>
.filters-root {
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: var(--text);
  font-size: 13px;
  padding: 12px 14px 18px;
}
.title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
}
.field { display: flex; flex-direction: column; gap: 6px; }
.lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); }
.inp {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.inp:focus { outline: 1px solid var(--accent); }
.colors { display: flex; flex-direction: column; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: var(--text);
  padding: 4px 8px 4px 6px;
  border-radius: 999px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background .18s, border-color .18s;
}
.chip.on {
  background: var(--c);
  border-color: var(--c);
  color: #0b1020;
  font-weight: 600;
}
.swatch {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(0,0,0,.4);
  border: 1px solid rgba(0,0,0,0.3);
}
.actions { display: flex; justify-content: flex-end; }
button.small {
  font-size: 11px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}
button.small:disabled { opacity: .4; cursor: default; }
.hint { font-size: 11px; margin: 0; }
.muted { color: var(--muted); }
</style>