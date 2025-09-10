import axios from "axios";
import { FOLDER, FILENAME } from "../web.const";
import { isSnapshot } from "../../types/snapshot";

export const snapshotActions = {
  setBonuses(this:any, b: any[]) { this.bonuses = b; this.dirty = true; },
  setNodes(this:any, nodes: any[]) { this.nodes = nodes as any; this.dirty = true; },
  setStaging(this:any, nodes: any[]) { this.staging = nodes as any; this.dirty = true; },

  setRawSnapshot(this:any, raw: any): boolean {
    if (!isSnapshot(raw)) return false;
    this.nodes = raw.nodes as any;
    this.staging = raw.staging as any;
    this.bonuses = raw.bonuses;
    this.tracks = (raw.tracks || []).map((t:any)=> ({
      ...t,
      segments: Math.max(1, t.segments || 1)
    }));
    this.trackSeq = raw.trackSeq ?? this.tracks.length;
    if (raw.trackDraft){
      this.trackDraft = {
        ...this.trackDraft,
        ...raw.trackDraft,
        segments: Math.max(1, raw.trackDraft.segments || 1)
      };
    }
    if (raw.meta?.settings) {
      const s = raw.meta.settings;
      // (Keep existing settings merge logic)
      if ("confirmDeleteNode" in s) this.settings.confirmDeleteNode = !!s.confirmDeleteNode;
      if ("confirmDeleteStaging" in s) this.settings.confirmDeleteStaging = !!s.confirmDeleteStaging;
      if ("enforceNoOverlap" in s) this.settings.enforceNoOverlap = !!s.enforceNoOverlap;
      if ("nodePadding" in s) this.settings.nodePadding = Number(s.nodePadding) || 0;
      if ("showPadPreview" in s) this.settings.showPadPreview = !!s.showPadPreview;
      this._persistSettings?.();
    }
    this.savedAt = raw.meta?.savedAt || null;
    this.dirty = false;
    return true;
  },

  async save(this:any) {
    const doc = {
      version: 4,
      nodes: this.nodes,
      staging: this.staging,
      bonuses: this.bonuses,
      tracks: this.tracks,
      trackSeq: this.trackSeq,
      trackDraft: this.trackDraft,
      meta: { savedAt: new Date().toISOString() }
    };
    await axios.post("/api/data", { folder: FOLDER, filename: FILENAME, data: doc });
    this.savedAt = doc.meta.savedAt;
    this.dirty = false;
  },

  async load(this:any): Promise<boolean> {
    try {
      const res = await axios.get("/api/data", { params: { folder: FOLDER, filename: FILENAME } });
      if (!isSnapshot(res.data)) {
        console.warn("[snapshot] invalid snapshot (expect v4)");
        return false;
      }
      return this.setRawSnapshot(res.data);
    } catch {
      return false;
    }
  },
};