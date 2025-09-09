import { defineStore } from "pinia";
import axios from "axios";
import type { NodeAny, NodeFree } from "../types/node";
import type { Bonus } from "../types/bonus";
import type { Snapshot } from "../types/snapshot";
import { isSnapshot } from "../types/snapshot";
import type { LinkDraftSettings, AnyLink, LinkType } from "../types/links";
import type { CurrentEditState } from "../types/editState";

const FOLDER = "investigation-web";
const FILENAME = "whispers-in-the-weaping.json";
const LS_SETTINGS_KEY = "investigation-web:settings:v1";

function newId(prefix = "n") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

const defaultSettings = {
  confirmDeleteNode: true,
  confirmDeleteStaging: true,
  enforceNoOverlap: false,
  nodePadding: 0,
  showPadPreview: false,
  linkHitRadius: 10, // px radius outside visible stroke for easier selection
  defaultNode: {
    r: 14,
    color: "#10b981",
    label: "New"
  },
  undoCoalesceMs: 300,
};

export const useInvestigationWebStore = defineStore("investigationWeb", {
  state: () => ({
    policy: {
      canEditStructure: false,
      canDiscover: false,
      canInteract: true,
    },
    nodes: [] as NodeFree[],
    staging: [] as NodeFree[],
    bonuses: [] as Bonus[],
    savedAt: null as string | null,
    dirty: false,
    settings: { ...defaultSettings },
    filters: { query: "", colors: [] as string[] },
    links: [] as AnyLink[],
    linkSeq: 0,
    linkDraft: {
      type: "straight",
      color: "#64748b",
      stroke: "solid",
      arrowHead: false,
      pad: 0
    } as LinkDraftSettings,
    tools: {
      addFreeNode: false,
      placeStagedId: null as string | null,
      editDefaults: false,
      addLink: false
    },
    currentEditState: "none" as CurrentEditState,
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
    setCurrentEditState(s: CurrentEditState) { this.currentEditState = s; },
    // ---- POLICY ACTIONS ----------------------------------------------------
    setCanEditStructure(on: boolean) {
      this.policy.canEditStructure = on;
      if (!on) {
        // Leaving edit mode: clear structure-edit tools
        this.resetTools();
        this.setCurrentEditState("none");
      }
    },
    updatePolicy(p: Partial<{ canEditStructure:boolean; canDiscover:boolean; canInteract:boolean }>) {
      if (p.canEditStructure !== undefined) this.setCanEditStructure(p.canEditStructure);
      if (p.canDiscover !== undefined) this.policy.canDiscover = p.canDiscover;
      if (p.canInteract !== undefined) this.policy.canInteract = p.canInteract;
    },

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
            undoCoalesceMs: Number(obj.undoCoalesceMs) || this.settings.undoCoalesceMs,
            defaultNode: {
              r: obj.defaultNode?.r ?? this.settings.defaultNode.r,
              color: obj.defaultNode?.color ?? this.settings.defaultNode.color,
              label: obj.defaultNode?.label ?? this.settings.defaultNode.label
            }
          });
          Object.assign(this.settings, {
            linkHitRadius: Number(obj.linkHitRadius) || this.settings.linkHitRadius
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
    hasNode(id:string){ return this.nodes.some(n => n.id === id) || this.staging.some(n => n.id === id); },
    renameNodeId(oldId:string, newId:string): boolean {
      const next = newId.trim();
      if (!next || next === oldId) return true;
      // enforce uniqueness across nodes and staging
      if (this.nodes.some(n => n.id === next) || this.staging.some(n => n.id === next)) return false;
      const n = this.nodes.find(n => n.id === oldId);
      if (!n) return false;
      n.id = next;
      // propagate to links endpoints
      for (const l of this.links) {
        if (l.from === oldId) l.from = next;
        if (l.to === oldId) l.to = next;
      }
      this.dirty = true;
      return true;
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
        this.tools.addLink = false;
        this.setCurrentEditState("add-free-node");
      } else {
        if (!this.tools.placeStagedId && !this.tools.addLink) this.setCurrentEditState("none");
      }
    },
    setPlaceStaged(id: string | null) {
      this.tools.placeStagedId = id;
      if (id) {
        this.tools.addFreeNode = false;
        this.tools.editDefaults = false;
        this.tools.addLink = false;
        this.setCurrentEditState("place-stashed-node");
      } else {
        if (!this.tools.addFreeNode && !this.tools.addLink) this.setCurrentEditState("none");
      }
    },
    setEditDefaults(on: boolean) {
      this.tools.editDefaults = on;
      if (on) {
        this.tools.addFreeNode = false;
        this.tools.placeStagedId = null;
        this.tools.addLink = false;
        this.setCurrentEditState("none");
      }
    },
    setAddLink(on:boolean){
      this.tools.addLink = on;
      if (on) {
        this.tools.addFreeNode = false;
        this.tools.placeStagedId = null;
        this.tools.editDefaults = false;
        this.setCurrentEditState("add-link");
      } else {
        if (!this.tools.addFreeNode && !this.tools.placeStagedId) this.setCurrentEditState("none");
      }
    },
    // 1) Close Add panel helper (call from drawer close)
    closeAddPanel() {
      this.resetTools();
    },
    // 9) Link draft setter used by PanelEdit
    setLinkDraft(p: Partial<LinkDraftSettings>){
      this.linkDraft = { ...this.linkDraft, ...p };
    },
    hasLink(id:string){ return this.links.some(l => l.id === id); },
    renameLinkId(oldId:string, newId:string): boolean {
      if (!newId || oldId === newId) return true;
      if (this.links.some(l => l.id === newId)) return false; // uniqueness
      const l = this.links.find(l => l.id === oldId);
      if (!l) return false;
      l.id = newId;
      this.dirty = true;
      return true;
    },
    addLink(payload: {
      type: LinkType;
      from: string;
      to: string;
      color?: string;
      stroke?: "solid"|"dashed"|"dotted";
      arrowHead?: boolean;
      pad?: number;
      midpoints?: {x:number;y:number;}[];
      // corkscrew
      turns?: number;
      startRadius?: number;
      endRadius?: number;
      direction?: 1|-1;
      // bezier
      c1?: { t:number; off:number };
      c2?: { t:number; off:number };
      symmetric?: boolean;
      // spline
      controls?: { t:number; off:number }[];
      tension?: number;
    }){
      const id = `L${++this.linkSeq}`;
      let link: AnyLink;

      if (payload.type === "curved"){
        link = { id, type:"curved", from: payload.from, to: payload.to,
          color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
          arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
          midpoints: payload.midpoints || [], midControls: [] };
      } else if (payload.type === "bezier"){
        const defC1 = this.linkDraft.c1 ?? { t: 25, off: 30 };
        const defC2 = this.linkDraft.c2 ?? { t: 75, off: -30 };
        link = {
          id, type:"bezier", from: payload.from, to: payload.to,
          color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
          arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
          c1: payload.c1 ?? defC1,
          c2: payload.c2 ?? defC2,
          symmetric: payload.symmetric ?? (this.linkDraft.symmetric ?? false)
        };
      } else if (payload.type === "spline"){
        link = {
          id, type:"spline", from: payload.from, to: payload.to,
          color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
          arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
          controls: payload.controls ?? (this.linkDraft.controls ?? [{ t: 33, off: 20 }, { t: 66, off: -10 }]),
          tension: payload.tension ?? (this.linkDraft.tension ?? 0.25)
        };
      } else if (payload.type === "corkscrew"){
        const turns = Math.round(payload.turns ?? (this.linkDraft.turns ?? 1));
        link = {
          id, type:"corkscrew", from: payload.from, to: payload.to,
          color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
          arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
          turns,
          startRadius: payload.startRadius ?? (this.linkDraft.startRadius ?? 10),
          endRadius: payload.endRadius ?? (this.linkDraft.endRadius ?? 60),
          direction: payload.direction ?? (this.linkDraft.direction ?? 1)
        };
      } else {
        link = {
          id, type:"straight", from: payload.from, to: payload.to,
          color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
          arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad
        };
      }
      this.links.push(link);
      return id;
    },
    patchLink(id: string, patch: any) {
      const i = this.links.findIndex((l:any)=> l.id === id);
      if (i === -1) return;
      const before = this.links[i];
      let next = { ...before, ...patch };

      if (patch.type && patch.type !== before.type) {
        const base = { id: before.id, from: before.from, to: before.to, color: before.color, stroke: before.stroke, arrowHead: before.arrowHead, pad: before.pad };
        if (patch.type === "curved") {
          next = { ...base, type:"curved", midpoints: [], midControls: [] };
        } else if (patch.type === "bezier") {
          next = { ...base, type:"bezier", c1: this.linkDraft.c1 ?? { t:25, off:30 }, c2: this.linkDraft.c2 ?? { t:75, off:-30 }, symmetric: this.linkDraft.symmetric ?? false };
        } else if (patch.type === "spline") {
          next = { ...base, type:"spline", controls: this.linkDraft.controls ?? [{ t: 33, off: 20 }, { t: 66, off: -10 }], tension: this.linkDraft.tension ?? 0.25 };
        } else if (patch.type === "corkscrew") {
          next = { ...base, type:"corkscrew", turns: Math.round(this.linkDraft.turns ?? 1), startRadius: this.linkDraft.startRadius ?? 10, endRadius: this.linkDraft.endRadius ?? 60, direction: this.linkDraft.direction ?? 1 };
        } else {
          next = { ...base, type:"straight" };
        }
      }

      // Normalize corkscrew turns to integers even when only 'turns' is patched
      if ((next as any).type === "corkscrew" && patch.turns !== undefined) {
        (next as any).turns = Math.round(patch.turns);
      }

      this.links[i] = next;
      this.dirty = true;
    },
    deleteLink(id:string){
      const i = this.links.findIndex(l => l.id === id);
      if (i >= 0) this.links.splice(i,1);
    },
    resetTools() {
      this.tools.addFreeNode = false;
      this.tools.placeStagedId = null;
      this.tools.editDefaults = false;
      this.tools.addLink = false;
      this.setCurrentEditState("none");
    },

    setSetting(key: string, val: any) {
      if (key in this.settings) {
        (this.settings as any)[key] = val;
        this._persistSettings();
        // NOTE: settings changes no longer mark document dirty
      }
    },
    updateDefaultNode(p: Partial<{ r:number; color:string; label:string }>) {
      this.settings.defaultNode = { ...this.settings.defaultNode, ...p };
      this._persistSettings();
      // keep not dirty
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