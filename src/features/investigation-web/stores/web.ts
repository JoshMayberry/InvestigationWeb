import { defineStore } from "pinia";
import axios from "axios";
import type { NodeAny, NodeFree } from "../types/node";
import type { Bonus } from "../types/bonus";
import type { Snapshot } from "../types/snapshot";
import { isSnapshot } from "../types/snapshot";

const FOLDER = "investigation-web";
const FILENAME = "whispers-in-the-weaping.json";
const LS_SETTINGS_KEY = "investigation-web:settings:v1";

function newId(prefix = "n") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export const useInvestigationWebStore = defineStore("investigationWeb", {
  state: () => ({
    nodes: [] as NodeFree[],
    staging: [] as NodeFree[],
    bonuses: [] as Bonus[],
    savedAt: null as string | null,
    dirty: false,
    settings: {
      confirmDeleteNode: true,
      confirmDeleteStaging: true,
      enforceNoOverlap: false,
      nodePadding: 0,
      showPadPreview: false,
      defaultNode: {
        r: 14,
        color: "#10b981",
        label: "New"
      }
    },
    filters: { query: "", colors: [] as string[] },
    tools: {
      addFreeNode: false,
      placeStagedId: null as string | null,
      editDefaults: false,
    },
    drag: { nodeId: null as string | null, active: false },
  }),
  getters: {
    nodeCount: (s) => s.nodes.length,
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
    filtersActive(s) {
      return !!s.filters.query.trim() || s.filters.colors.length > 0;
    },
    colorPalette(s) {
      const set = new Set<string>();
      for (const n of s.nodes) if (n.color) set.add(n.color);
      return [...set];
    },
    defaultNodeTemplate(s){ return s.settings.defaultNode; }
  },
  actions: {
    _persistSettings() {
      try {
        localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(this.settings));
      } catch {}
    },
    initSettingsFromLocal() {
      try {
        const raw = localStorage.getItem(LS_SETTINGS_KEY);
        if (raw) {
          const obj = JSON.parse(raw);
          Object.assign(this.settings, {
            confirmDeleteNode: !!obj.confirmDeleteNode,
            confirmDeleteStaging: !!obj.confirmDeleteStaging,
            enforceNoOverlap: !!obj.enforceNoOverlap,
            nodePadding: Number(obj.nodePadding) || 0,
            showPadPreview: !!obj.showPadPreview,
            defaultNode: {
              r: obj.defaultNode?.r ?? 14,
              color: obj.defaultNode?.color ?? "#10b981",
              label: obj.defaultNode?.label ?? "New"
            }
          });
        }
      } catch {}
    },

    addNode(p: Partial<NodeFree>) {
      const d = this.settings.defaultNode;
      const n: NodeFree = {
        id: p.id || newId(),
        kind: "free",
        x: p.x ?? 0,
        y: p.y ?? 0,
        r: p.r ?? d.r,
        color: p.color || d.color,
        label: p.label ?? d.label,
      };
      this.nodes.push(n);
      this.dirty = true;
      return n;
    },
    addStaged(p?: Partial<NodeFree>) {
      const d = this.settings.defaultNode;
      const n: NodeFree = {
        id: p?.id || newId("s"),
        kind: "free",
        x: p?.x ?? 0,
        y: p?.y ?? 0,
        r: p?.r ?? d.r,
        color: p?.color || d.color,
        label: p?.label ?? d.label,
      };
      this.staging.push(n);
      this.dirty = true;
      return n;
    },
    duplicateNodeToStaging(id: string) {
      const n = this.nodes.find(n => n.id === id);
      if (!n) return;
      this.addStaged({ r: n.r, color: n.color, label: n.label });
    },
    moveNodeToStaging(id: string) {
      const i = this.nodes.findIndex(n => n.id === id);
      if (i === -1) return;
      const [n] = this.nodes.splice(i, 1);
      this.staging.push(n);
      this.dirty = true;
    },
    placeFromStaging(id: string, x: number, y: number) {
      const i = this.staging.findIndex(n => n.id === id);
      if (i === -1) return;
      const [n] = this.staging.splice(i, 1);
      n.x = x; n.y = y;
      this.nodes.push(n);
      this.tools.placeStagedId = null;
      this.dirty = true;
      return n;
    },
    patchNode(id: string, patch: Partial<NodeFree>) {
      const i = this.nodes.findIndex(n => n.id === id);
      if (i === -1) return;
      this.nodes[i] = { ...this.nodes[i], ...patch };
      this.dirty = true;
    },
    deleteNode(id: string) {
      let i = this.nodes.findIndex(n => n.id === id);
      if (i !== -1) { this.nodes.splice(i, 1); this.dirty = true; return; }
      i = this.staging.findIndex(n => n.id === id);
      if (i !== -1) { this.staging.splice(i, 1); this.dirty = true; }
    },

    setFilterQuery(q: string) { this.filters.query = q; },
    toggleFilterColor(c: string) {
      const i = this.filters.colors.indexOf(c);
      if (i === -1) this.filters.colors.push(c); else this.filters.colors.splice(i, 1);
    },
    clearFilters() { this.filters.query = ""; this.filters.colors = []; },

    setAddFreeNode(on: boolean) {
      this.tools.addFreeNode = on;
      if (on) {
        this.tools.placeStagedId = null;
        this.tools.editDefaults = false;
      }
    },
    setPlaceStaged(id: string | null) {
      this.tools.placeStagedId = id;
      if (id) {
        this.tools.addFreeNode = false;
        this.tools.editDefaults = false;
      }
    },
    setEditDefaults(on: boolean) {
      this.tools.editDefaults = on;
      if (on) {
        this.tools.addFreeNode = false;
        this.tools.placeStagedId = null;
      }
    },
    resetTools() {
      this.tools.addFreeNode = false;
      this.tools.placeStagedId = null;
      this.tools.editDefaults = false;
    },

    setSetting(key: string, val: any) {
      if (key in this.settings) {
        (this.settings as any)[key] = val;
        this._persistSettings();
        this.dirty = true;
      }
    },
    updateDefaultNode(p: Partial<{ r:number; color:string; label:string }>) {
      this.settings.defaultNode = { ...this.settings.defaultNode, ...p };
      this._persistSettings();
    },
    setDefaultsFromNode(id: string) {
      const n = this.nodes.find(n => n.id === id);
      if (!n) return;
      this.updateDefaultNode({ r: n.r, color: n.color || this.settings.defaultNode.color, label: n.label || this.settings.defaultNode.label });
    },

    setBonuses(b: Bonus[]) { this.bonuses = b; this.dirty = true; },
    setNodes(nodes: NodeAny[]) { this.nodes = nodes as NodeFree[]; this.dirty = true; },
    setStaging(nodes: NodeAny[]) { this.staging = nodes as NodeFree[]; this.dirty = true; },

    setRawSnapshot(raw: any): boolean {
      if (!isSnapshot(raw)) return false;
      this.nodes = raw.nodes as any;
      this.staging = raw.staging as any;
      this.bonuses = raw.bonuses;
      if (raw.meta?.settings) {
        const s = raw.meta.settings;
        const existing = localStorage.getItem(LS_SETTINGS_KEY);
        if (!existing) {
          if ("confirmDeleteNode" in s) this.settings.confirmDeleteNode = !!s.confirmDeleteNode;
          if ("confirmDeleteStaging" in s) this.settings.confirmDeleteStaging = !!s.confirmDeleteStaging;
          if ("enforceNoOverlap" in s) this.settings.enforceNoOverlap = !!s.enforceNoOverlap;
          if ("nodePadding" in s) this.settings.nodePadding = Number(s.nodePadding) || 0;
          if ("showPadPreview" in s) this.settings.showPadPreview = !!s.showPadPreview;
          this._persistSettings();
        }
      }
      this.savedAt = raw.meta?.savedAt || null;
      this.dirty = true;
      return true;
    },

    async save() {
      const doc: Snapshot = {
        version: 3,
        nodes: this.nodes,
        staging: this.staging,
        bonuses: this.bonuses,
        meta: {
          savedAt: new Date().toISOString(),
        },
      };
      await axios.post("/api/data", { folder: FOLDER, filename: FILENAME, data: doc });
      this.savedAt = doc.meta?.savedAt || null;
      this.dirty = false;
    },
    async load(): Promise<boolean> {
      try {
        const res = await axios.get("/api/data", { params: { folder: FOLDER, filename: FILENAME } });
        if (isSnapshot(res.data)) {
          this.setRawSnapshot(res.data);
          this.dirty = false;
          return true;
        }
        console.warn("[snapshot] invalid version");
        return false;
      } catch {
        return false;
      }
    },
  },
});