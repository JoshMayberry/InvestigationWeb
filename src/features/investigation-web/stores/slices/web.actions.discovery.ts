export type DiscoveryMode = "free" | "connected";
export type VisibilityMode = "hide" | "frontier" | "all";

export interface DiscoveryState {
  mode: DiscoveryMode;
  visibility: { mode: VisibilityMode; depth: number };
  allowUndiscover: boolean;
}

export const defaultDiscoveryState: DiscoveryState = {
  mode: "free",
  visibility: { mode: "hide", depth: 1 },
  allowUndiscover: true,
};

// SELECTORS (pure helpers). Keep discovery logic here; getters delegate to these.
export function selectDiscoveredIdSet(s:any): Set<string> {
  const res = new Set<string>();
  for (const n of s.nodes) if (n.discovered) res.add(n.id);
  return res;
}
export function selectIncomingMap(s:any): Map<string,string[]> {
  const m = new Map<string,string[]>(); for (const n of s.nodes) m.set(n.id, []);
  for (const l of s.links) { if (!m.has(l.to)) m.set(l.to, []); m.get(l.to)!.push(l.from); }
  return m;
}
export function selectOutgoingMap(s:any): Map<string,string[]> {
  const m = new Map<string,string[]>(); for (const n of s.nodes) m.set(n.id, []);
  for (const l of s.links) { if (!m.has(l.from)) m.set(l.from, []); m.get(l.from)!.push(l.to); }
  return m;
}
export function selectDiscoverableIdSet(s:any): Set<string> {
  const discovered = selectDiscoveredIdSet(s);
  if (s.discovery.mode === "free") {
    const all = new Set<string>(); for (const n of s.nodes) if (!discovered.has(n.id)) all.add(n.id); return all;
  }
  const incoming = selectIncomingMap(s);
  const res = new Set<string>();
  for (const n of s.nodes) {
    if (discovered.has(n.id)) continue;
    const ins = incoming.get(n.id) || [];
    if (ins.length === 0 || ins.every(id => discovered.has(id))) res.add(n.id);
  }
  return res;
}
export function selectVisibleByDiscoveryIdSet(s:any): Set<string> {
  const discovered = selectDiscoveredIdSet(s);
  const mode = s.discovery.visibility.mode;
  if (mode === "all") return new Set(s.nodes.map((n:any)=>n.id));
  if (mode === "hide") return discovered;
  const depth = Math.max(0, Math.floor(s.discovery.visibility.depth || 0));
  const outgoing = selectOutgoingMap(s);
  const visible = new Set<string>([...discovered]);
  if (depth > 0) {
    const q: { id:string; d:number }[] = [...discovered].map(id => ({ id, d:0 }));
    const seen = new Set<string>([...discovered]);
    while (q.length) {
      const { id, d } = q.shift()!;
      if (d >= depth) continue;
      for (const nxt of (outgoing.get(id) || [])) {
        if (!seen.has(nxt)) { seen.add(nxt); visible.add(nxt); q.push({ id: nxt, d: d + 1 }); }
      }
    }
  }
  return visible;
}

// ACTIONS (mutate node.discovered)
export const discoveryActions = {
  setDiscoveryMode(this:any, m: DiscoveryMode) { this.discovery.mode = m; this.dirty = true; },
  setDiscoveryVisibilityMode(this:any, m: VisibilityMode) { this.discovery.visibility.mode = m; this.dirty = true; },
  setDiscoveryDepth(this:any, d: number) { this.discovery.visibility.depth = Math.max(0, Math.floor(d||0)); this.dirty = true; },
  setAllowUndiscover(this:any, on: boolean) { this.discovery.allowUndiscover = !!on; this.dirty = true; },

  setDiscovered(this:any, ids: string[]) {
    const keep = new Set(ids);
    for (const n of this.nodes) n.discovered = keep.has(n.id);
    this.dirty = true;
  },
  clearDiscovered(this:any) {
    for (const n of this.nodes) n.discovered = false;
    this.dirty = true;
  },
  canDiscover(this:any, id:string): boolean {
    if (!this.hasNode(id)) return false;
    if (this.discovery.mode === "free") return true;
    // connected: require all incoming discovered
    const incoming = selectIncomingMap(this);
    const dis = selectDiscoveredIdSet(this);
    const ins = incoming.get(id) || [];
    return ins.length === 0 || ins.every((x)=> dis.has(x));
  },
  discover(this:any, id: string) {
    if (!this.canDiscover(id)) return false;
    const n = this.nodes.find((x:any)=> x.id===id); if (!n) return false;
    n.discovered = true; this.dirty = true; return true;
  },
  undiscover(this:any, id: string) {
    if (!this.discovery.allowUndiscover) return false;
    const n = this.nodes.find((x:any)=> x.id===id); if (!n) return false;
    n.discovered = false; this.dirty = true; return true;
  },
  toggleDiscover(this:any, id: string) {
    const n = this.nodes.find((x:any)=> x.id===id); if (!n) return false;
    return n.discovered ? this.undiscover(id) : this.discover(id);
  },
};