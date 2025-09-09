import { selectDiscoveredIdSet, selectDiscoverableIdSet, selectVisibleByDiscoveryIdSet } from "./slices/web.actions.discovery";

export const webGetters = {
  nodeCount: (s:any) => s.nodes.length,

  filteredIdSet(state:any): Set<string> {
    const q = state.filters.query.trim().toLowerCase();
    const colors = state.filters.colors;
    if (!q && colors.length === 0) return new Set(state.nodes.map((n:any)=> n.id));
    const keep = new Set<string>();
    for (const n of state.nodes) {
      const label = (n.label || "").toLowerCase();
      const id = n.id.toLowerCase();
      const matchQ = !q || id.includes(q) || label.includes(q);
      const matchColor = colors.length === 0 || (n.color && colors.includes(n.color));
      if (matchQ && matchColor) keep.add(n.id);
    }
    return keep;
  },

  filtersActive(s:any) { return !!s.filters.query.trim() || s.filters.colors.length > 0; },
  colorPalette(s:any) { const set = new Set<string>(); for (const n of s.nodes) if (n.color) set.add(n.color); return [...set]; },
  defaultNodeTemplate(s:any){ return s.settings.defaultNode; },

  // Discovery getters (pure; no action calls, no name conflicts)
  discoveredIdSet(s:any): Set<string> { return selectDiscoveredIdSet(s); },
  discoverableIdSet(s:any): Set<string> { return selectDiscoverableIdSet(s); },
  visibleByDiscoveryIdSet(s:any): Set<string> { return selectVisibleByDiscoveryIdSet(s); },
};