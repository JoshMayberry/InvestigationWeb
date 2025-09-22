<template>
  <div class="filters-root">
    <h3 class="title">Filters</h3>

    <!-- Search target pills -->
    <div class="targets">
      <span class="lbl clickable" @click="toggleAllTargets">Search In</span>
      <div class="chips">
        <button class="chip" :class="{ on: sTargets.label }" @click="toggleTarget('label')">Label</button>
        <button class="chip" :class="{ on: sTargets.description }" @click="toggleTarget('description')">Description</button>
        <button class="chip" :class="{ on: sTargets.bonus }" @click="toggleTarget('bonus')">Bonus</button>
        <template v-for="f in extraDefs" :key="f.key">
          <button class="chip" :class="{ on: sTargets.extras[f.key] }" @click="toggleTargetExtra(f.key)">{{ f.label || f.key }}</button>
        </template>
      </div>
    </div>

    <label class="field">
      <span class="lbl">Search</span>
      <input
        class="inp"
        type="text"
        :value="query"
        placeholder="type to search..."
        @input="onQuery(($event.target as HTMLInputElement).value)"
      />
    </label>

    <!-- Colors -->
    <div class="colors" v-if="palette.length">
      <span class="lbl clickable" @click="toggleAllColors">{{ colorsAllOn ? 'Colors (all on)' : (colorsAny ? 'Colors (some on)' : 'Colors (all off)') }}</span>
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

    <!-- Additional field pill groups -->
    <div class="facet" v-for="facet in extraFacets" :key="facet.key">
      <span class="lbl clickable" @click="toggleAllExtra(facet.key, facet.values)">
        {{ facetLabel(facet.key) }}
      </span>
      <div class="chips">
        <button
          v-for="v in facet.values"
          :key="v"
          class="chip"
          :class="{ on: isExtraSelected(facet.key, v) }"
          @click="toggleExtra(facet.key, v)"
        >{{ v }}</button>
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
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "PanelFilters",
  data(){
    return {
      store: useInvestigationWebStore(),
    };
  },
  computed:{
    extraDefs(): any[] { return this.store.customFields?.node || []; },
    sTargets(): any { return this.store.searchTargetsEffective; },
    palette(): string[] { return this.store.colorPalette || []; },
    extraFacets(): any[] { return this.store.extraFacets || []; },

    query(): string { return this.store.filters.query; },
    colors(): string[] { return this.store.filters.colors; },
    colorsAny(): boolean { return (this.store.filters.colors?.length || 0) > 0; },
    colorsAllOn(): boolean { return this.store.filters.colors?.length === this.palette.length && this.palette.length > 0; },

    matchCount(): number { return this.store.filteredIdSet?.size || 0; },
    total(): number { return this.store.nodeCount || 0; },
    active(): boolean { return this.store.filtersActive; },
  },
  methods:{
    toggleAllTargets(){
      const st = this.store.filters.searchTargets;
      const defs = (this.store.customFields?.node || []) as { key:string }[];
      const keys = defs.map(d=> d.key);
      const allOn =
        st.label &&
        st.description &&
        st.bonus &&
        keys.every(k => st.extras?.[k] !== false); // missing => treated as on
      const next = !allOn;
      st.label = next;
      st.description = next;
      st.bonus = next;
      st.extras = { ...(st.extras || {}) };
      for (const k of keys) st.extras[k] = next;
    },
    toggleAllColors(){
      this.store.setAllFilterColors(!this.colorsAllOn, this.palette);
    },
    toggleColor(c:string){ this.store.toggleFilterColor(c); },
    toggleExtra(key:string, v:string){ this.store.toggleFilterExtraValue(key, v); },
    isExtraSelected(key:string, v:string){
      const sel = this.store.filters.extra?.[key] || [];
      return sel.includes(v);
    },
    toggleAllExtra(key:string, all:string[]){
      const sel = this.store.filters.extra?.[key] || [];
      const allOn = sel.length === all.length && all.length > 0;
      this.store.setAllFilterExtraValues(key, !allOn, all);
    },
    facetLabel(key:string){
      const d = (this.extraDefs || []).find((x:any)=> x.key === key);
      return d?.label || key;
    },
    toggleTarget(name:'label'|'description'|'bonus'){ this.store.toggleSearchTarget(name); },
    toggleTargetExtra(key:string){ this.store.toggleSearchTargetExtra(key); },
    onQuery(v:string){ this.store.setFilterQuery(v); },
    clear(){ this.store.clearFilters(); },
    shortColor(c: string){ return c.startsWith("#") && c.length === 7 ? c.slice(1) : c; },
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
.title { margin: 0; font-size: 14px; font-weight: 600; color: var(--accent); }
.field { display: flex; flex-direction: column; gap: 6px; }
.lbl { font-size: 11px; text-transform: uppercase; letter-spacing: .6px; color: var(--muted); }
.lbl.clickable { cursor: pointer; user-select: none; }
.inp {
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
}
.inp:focus { outline: 1px solid var(--accent); }
.targets, .colors, .facet { display: flex; flex-direction: column; gap: 8px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.10);
  color: var(--text);
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: background .18s, border-color .18s;
}
.chip.on {
  background: rgba(255,255,255,0.8);
  border-color: rgba(255,255,255,0.8);
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