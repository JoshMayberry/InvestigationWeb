import { defineStore } from "pinia";
import type { NodeAny, NodeFree, NodeSnap } from "../types/node";
import { Snapshot, isSnapshot } from "../types/snapshot";
import type { Bonus } from "../types/bonus";
import axios from "axios";

const FOLDER = "investigation-web";
const FILENAME = "whispers-in-the-weaping.json";

export const useInvestigationWebStore = defineStore("investigationWeb", {
  state: () => ({
    nodes: [] as NodeAny[],
    bonuses: [] as Bonus[],
    savedAt: null as string | null,
    dirty: false,

    filters: {
      query: "",
      colors: [] as string[], // empty => no color filter
    },
  }),
  getters: {
    nodeCount: (s) => s.nodes.length,
    bonusCount: (s) => s.bonuses.length,
    filteredIdSet(state): Set<string> {
      const q = state.filters.query.trim().toLowerCase();
      const colors = state.filters.colors;
      if (!q && colors.length === 0) return new Set(state.nodes.map(n => n.id));
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
    filtersActive(state): boolean {
      return !!state.filters.query.trim() || state.filters.colors.length > 0;
    },
    colorPalette(state): string[] {
      const out = new Set<string>();
      for (const n of state.nodes) if (n.color) out.add(n.color);
      return Array.from(out);
    },
  },
  actions: {
    setNodes(nodes: NodeAny[]) {
      this.nodes = nodes;
      this.dirty = true;
    },
    setBonuses(bonuses: Bonus[]) {
      this.bonuses = bonuses;
      this.dirty = true;
    },
    addBonus(b: Bonus) {
      if (!this.bonuses.find(x => x.id === b.id)) {
        this.bonuses.push(b);
        this.dirty = true;
      }
    },
    patchNode(id: string, patch: Partial<NodeFree> | Partial<NodeSnap>) {
      const idx = this.nodes.findIndex(n => n.id === id);
      if (idx === -1) return;
      const prev = this.nodes[idx];
      const next = { ...prev, ...patch } as NodeAny;
      this.nodes.splice(idx, 1, next);
      this.dirty = true;
    },
    async saveSnapshot(doc: Snapshot): Promise<{ ok: true }> {
      await axios.post("/api/data", { folder: FOLDER, filename: FILENAME, data: doc });
      return { ok: true };
    },
     async loadSnapshot(): Promise<Snapshot | null> {
      try {
        const res = await axios.get("/api/data", { params: { folder: FOLDER, filename: FILENAME } });
        const data = res?.data;
        if (isSnapshot(data)) return data;
        console.warn("[snapshot] Unsupported version or invalid data:", data?.version);
        return null;
      } catch (e) {
        console.warn("[snapshot] load failed", e);
        return null;
      }
    },
    async load(): Promise<boolean> {
      const snap = await this.loadSnapshot();
      if (!snap) return false;
      this.nodes = snap.nodes as any;
      this.bonuses = snap.bonuses;
      this.savedAt = snap.meta?.savedAt ?? null;
      this.dirty = false;
      return true;
    },
    async save(): Promise<boolean> {
      const doc: Snapshot = {
        version: 2,
        nodes: this.nodes as any,
        bonuses: this.bonuses,
        meta: { savedAt: new Date().toISOString() },
      };
      await this.saveSnapshot(doc);
      this.savedAt = doc.meta!.savedAt!;
      this.dirty = false;
      return true;
    },
    newBlank() {
      this.nodes = [];
      this.bonuses = [];
      this.dirty = true;
    },
    setFilterQuery(q: string) {
      this.filters.query = q;
    },
    toggleFilterColor(color: string) {
      const i = this.filters.colors.indexOf(color);
      if (i === -1) this.filters.colors.push(color);
      else this.filters.colors.splice(i, 1);
    },
    clearFilters() {
      this.filters.query = "";
      this.filters.colors = [];
    },
  },
});