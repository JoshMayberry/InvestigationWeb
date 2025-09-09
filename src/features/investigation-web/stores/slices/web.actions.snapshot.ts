import axios from "axios";
import { FOLDER, FILENAME } from "../web.const";

export const snapshotActions = {
  setBonuses(this:any, b: any[]) { this.bonuses = b; this.dirty = true; },
  setNodes(this:any, nodes: any[]) { this.nodes = nodes as any; this.dirty = true; },
  setStaging(this:any, nodes: any[]) { this.staging = nodes as any; this.dirty = true; },
  setRawSnapshot(this:any, raw: any): boolean {
    // version/type guards are elsewhere; keep current behavior
    this.nodes = raw.nodes as any;
    this.staging = raw.staging as any;
    this.bonuses = raw.bonuses;
    if (raw.meta?.settings) {
      const s = raw.meta.settings;
      const existing = localStorage.getItem("investigation-web:settings:v1");
      if (!existing) {
        if ("confirmDeleteNode" in s) this.settings.confirmDeleteNode = !!s.confirmDeleteNode;
        if ("confirmDeleteStaging" in s) this.settings.confirmDeleteStaging = !!s.confirmDeleteStaging;
        if ("enforceNoOverlap" in s) this.settings.enforceNoOverlap = !!s.enforceNoOverlap;
        if ("nodePadding" in s) this.settings.nodePadding = Number(s.nodePadding) || 0;
        if ("showPadPreview" in s) this.settings.showPadPreview = !!s.showPadPreview;
        this._persistSettings?.();
      }
    }
    this.savedAt = raw.meta?.savedAt || null;
    this.dirty = true;
    return true;
  },
  async save(this:any) {
    const doc = {
      version: 3,
      nodes: this.nodes,
      staging: this.staging,
      bonuses: this.bonuses,
      meta: { savedAt: new Date().toISOString() },
    };
    await axios.post("/api/data", { folder: FOLDER, filename: FILENAME, data: doc });
    this.savedAt = doc.meta?.savedAt || null;
    this.dirty = false;
  },
  async load(this:any): Promise<boolean> {
    try {
      const res = await axios.get("/api/data", { params: { folder: FOLDER, filename: FILENAME } });
      if (res?.data?.version) {
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
};