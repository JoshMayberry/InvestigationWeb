import { selectDiscoveredIdSet, selectDiscoverableIdSet } from "./slices/web.actions.discovery";

export const webGetters = {
  nodeCount: (s:any) => (s.nodes?.length || 0),

  colorPalette(s:any) {
    const set = new Set<string>();
    for (const n of (s.nodes || [])) {
      const c = n?.color;
      if (c) set.add(c);
    }
    return Array.from(set.values());
  },

  // Distinct non-empty values for each additional field key
  extraFacets(s:any): { key:string; label:string; values:string[] }[] {
    const defs = (s.customFields?.node || []) as { key:string; label?:string }[];
    const nodes = s.nodes || [];
    const result: { key:string; label:string; values:string[] }[] = [];
    for (const def of defs) {
      const key = def.key;
      const values = new Set<string>();
      for (const n of nodes) {
        const v = n?.extra?.[key];
        if (v == null) continue;
        const t = String(v).trim();
        if (!t) continue;
        values.add(t);
      }
      result.push({ key, label: def.label || key, values: Array.from(values.values()).sort() });
    }
    return result;
  },

  filtersActive(s:any) {
    const q = String(s.filters?.query || "").trim();
    const hasColors = (s.filters?.colors?.length || 0) > 0;
    const hasExtra = Object.keys(s.filters?.extra || {}).length > 0;
    return !!q || hasColors || hasExtra;
  },

  // Normalize search-target toggles (ensure extras keys present with defaults)
  searchTargetsEffective(s:any) {
    const defs = (s.customFields?.node || []) as { key:string }[];
    const st = s.filters?.searchTargets || { label:true, description:true, bonus:false, extras:{} };
    const extras = { ...(st.extras || {}) };
    for (const d of defs) {
      if (!(d.key in extras)) extras[d.key] = true; // default on
    }
    return {
      label: st.label !== false,
      description: st.description !== false,
      bonus: !!st.bonus,
      extras,
    };
  },

  // Set of node ids that match filters: colors, extra value selections, and text query over selected targets
  filteredIdSet(state:any): Set<string> {
    const nodes = state.nodes || [];
    const colors: string[] = state.filters?.colors || [];
    const extraSel: Record<string, string[]> = state.filters?.extra || {};
    const st = (webGetters as any).searchTargetsEffective(state); // reuse getter logic

    const qStr = String(state.filters?.query || "");
    const q = qStr.trim().toLowerCase();
    const hasQ = q.length > 0;
    const hasColors = colors.length > 0;

    const keep = new Set<string>();

    for (const n of nodes) {
      if (!n) continue;

      // Color filter
      if (hasColors) {
        const c = n.color || "";
        if (!colors.includes(c)) continue;
      }

      // Extra value selections (AND across keys; OR within key)
      let passExtra = true;
      for (const key of Object.keys(extraSel)) {
        const selected = extraSel[key];
        if (!Array.isArray(selected) || selected.length === 0) continue; // inactive
        const val = String(n?.extra?.[key] ?? "").trim();
        if (!selected.includes(val)) { passExtra = false; break; }
      }
      if (!passExtra) continue;

      // Query across selected targets
      if (hasQ) {
        let hit = false;

        if (!hit && st.label) {
          const s = String(n.label || "").toLowerCase();
          if (s && s.includes(q)) hit = true;
        }

        if (!hit && st.description) {
          const s = String(n.description || "").toLowerCase();
          if (s && s.includes(q)) hit = true;
        }

        if (!hit && st.bonus) {
          const arr = Array.isArray(n.bonuses) ? n.bonuses : [];
          for (const b of arr) {
            const t = String(b?.title || "").toLowerCase();
            const d = String(b?.description || "").toLowerCase();
            if ((t && t.includes(q)) || (d && d.includes(q))) { hit = true; break; }
          }
        }

        if (!hit) {
          // extras included per toggle per key
          const extras = n?.extra || {};
          for (const key of Object.keys(extras)) {
            if (!st.extras?.[key]) continue;
            const s = String(extras[key] ?? "").toLowerCase();
            if (s && s.includes(q)) { hit = true; break; }
          }
        }

        if (!hit) continue;
      }

      keep.add(n.id);
    }

    // If no filters active, include all nodes for count parity
    if (!hasQ && !hasColors && Object.keys(extraSel).length === 0) {
      const all = new Set<string>();
      for (const n of nodes) all.add(n.id);
      return all;
    }

    return keep;
  },

  defaultNodeTemplate(s:any){ return s.settings.defaultNode; },

  // Discovery helpers
  discoveredIdSet(s:any): Set<string> { return selectDiscoveredIdSet(s); },
  discoverableIdSet(s:any): Set<string> { return selectDiscoverableIdSet(s); },
  playerVisibleIdSet(s:any): Set<string> {
    const discovered = selectDiscoveredIdSet(s);
    if (s.discovery?.mode === "connected") {
      const discoverable = selectDiscoverableIdSet(s);
      const union = new Set<string>(discovered);
      for (const id of discoverable) union.add(id);
      return union;
    }
    // free: only discovered
    return discovered;
  },
};