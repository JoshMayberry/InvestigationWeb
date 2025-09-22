<template>
  <div class="bonuses-root">
    <header class="head">
      <h3>Unlocked Bonuses</h3>
      <span class="count">{{ bonuses.length }}</span>
    </header>

    <ul class="list">
      <li v-for="b in bonuses" :key="b.id" class="item">
        <div class="label">
          <span class="dot" />
          <span class="name">{{ b.label }}</span>
        </div>
        <p v-if="b.description" class="desc">{{ b.description }}</p>
      </li>
    </ul>

    <p v-if="!bonuses.length" class="empty muted">None unlocked.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { useInvestigationWebStore } from "../../stores/web";

export default defineComponent({
  name: "PanelBonus",
  data(){ return { store: useInvestigationWebStore() }; },
  computed:{
    // Only bonuses on discovered nodes
    bonuses(): { id:string; label:string; description?:string }[] {
      const out: { id:string; label:string; description?:string }[] = [];
      for (const n of this.store.nodes as any[]) {
        if (!n?.discovered || !Array.isArray(n?.bonuses)) continue;
        n.bonuses.forEach((b:any, i:number)=>{
          if (!b?.title && !b?.label) return;
          out.push({
            id: `${n.id}#${i}`,
            label: b.title ?? b.label,
            description: b.description
          });
        });
      }
      return out;
    }
  }
});
</script>

<style scoped>
.bonuses-root {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px 18px;
  color: var(--text);
  font-size: 13px;
}
.head { display: flex; align-items: center; gap: 8px; margin: 0 0 4px; }
.head h3 { font-size: 14px; font-weight: 600; margin: 0; color: var(--accent); }
.count {
  background: rgba(255,255,255,0.08);
  padding: 2px 8px 3px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1;
  color: var(--muted);
  border: 1px solid rgba(255,255,255,0.10);
}
.list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.item { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.07); border-radius: 8px; padding: 8px 10px 10px; }
.label { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text); font-size: 12px; letter-spacing: .3px; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 4px var(--ok); }
.name { flex: 1; }
.desc { margin: 6px 0 0; font-size: 11px; line-height: 1.3; color: var(--muted); }
.empty { font-size: 12px; margin: 8px 0 0; }
.muted { color: var(--muted); }
</style>