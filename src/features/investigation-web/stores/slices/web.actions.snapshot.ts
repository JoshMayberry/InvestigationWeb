import axios from "axios";
import { FOLDER, FILENAME } from "../web.const";
import { isSnapshot } from "../../types/snapshot";
import { createInitialState } from "../web.state"; // NEW

export const snapshotActions = {
  setBonuses(this:any, b: any[]) { this.bonuses = b; this.dirty = true; },
  setNodes(this:any, nodes: any[]) { this.nodes = nodes as any; this.dirty = true; },
  setStaging(this:any, nodes: any[]) { this.staging = nodes as any; this.dirty = true; },

  setRawSnapshot(this:any, raw: any): boolean {
    if (!isSnapshot(raw)) return false;

    const defaults = createInitialState();

    const merge = (def:any, obj:any)=> ({ ...def, ...(obj||{}) });
    const obj = (x:any)=> (x && typeof x === "object") ? x : {};
    // alias for historical usage in this file
    const ensureObj = obj;
    const ensureArr = (x:any)=> Array.isArray(x) ? x : [];
    const arr = ensureArr;
    const num = (v:any, d:number)=> Number.isFinite(+v) ? +v : d;
    const bool = (v:any, d:boolean)=> (typeof v === "boolean" ? v : d);

    const ensureSegments = (n:any)=> Math.max(1, num(n, 1));
    const ensureLabelStyle = (ls:any)=> merge({ mode:'angle', angle:0, fontSize:11, margin:4 }, ls);

    // Node defaults from settings
    const nodeDef = defaults.settings?.defaultNode || { r: 12, label: "New", color: undefined };

    const normalizeNode = (n:any)=> {
      const out:any = { ...n };
      out.kind = out.kind || 'free';
      out.x = num(out.x, 0);
      out.y = num(out.y, 0);
      out.r = num(out.r, nodeDef.r ?? 12);
      if (out.label == null) out.label = nodeDef.label ?? "";
      if (out.color == null && nodeDef.color != null) out.color = nodeDef.color;
      out.description = out.description ?? "";
      out.labelStyle = ensureLabelStyle(out.labelStyle);
      out.extra = obj(out.extra);
      if (out.kind === 'snap'){
        out.trackOrder = num(out.trackOrder, 0);
        out.trackPosition = Math.max(0, Math.min(1, Number.isFinite(out.trackPosition) ? +out.trackPosition : 0.5));
        if (!out.trackId) out.kind = 'free'; // fallback: unsnapped becomes free
      }
      if (out.sim){
        // keep velocities/forces if present, but ensure shape
        out.sim = {
          enabled: !!out.sim.enabled,
          ...obj(out.sim)
        };
      }
      return out;
    };

    const trackDef = defaults.trackDraft || {};
    const normalizeTrack = (t:any)=> {
      const out:any = { ...t };
      out.type = out.type || "straight";
      out.p1 = obj(out.p1); out.p1.x = num(out.p1.x, 0); out.p1.y = num(out.p1.y, 0);
      out.p2 = obj(out.p2); out.p2.x = num(out.p2.x, 0); out.p2.y = num(out.p2.y, 0);
      out.color = out.color ?? trackDef.color ?? "#93c5fd";
      out.locked = bool(out.locked, !!trackDef.locked);
      out.segments = ensureSegments(out.segments);
      // keep optional type-specific fields as-is (engine tolerates undefined)
      out.extra = obj(out.extra);
      return out;
    };

    const linkDef = defaults.linkDraft || {};
    const simDef = linkDef.sim || {};
    const normalizeLink = (l:any)=> {
      const out:any = merge(linkDef, l);
      out.id = l?.id ?? `L${++this.linkSeq}`;
      out.type = l?.type || linkDef.type || "straight";
      out.from = l?.from ?? "";
      out.to = l?.to ?? "";
      out.color = l?.color ?? linkDef.color ?? "#64748b";
      out.stroke = l?.stroke ?? linkDef.stroke ?? "solid";
      out.arrowHead = bool(l?.arrowHead, !!linkDef.arrowHead);
      out.pad = num(l?.pad, num(linkDef.pad, 0));
      out.extra = obj(l?.extra);
      out.sim = merge(simDef, l?.sim);
      return out;
    };

    const groupDef = defaults.groupDraft || { type:"horizontal-lines", colorPalette:[], params:{} };
    const normalizeGroup = (g:any)=> {
      const out:any = { ...g };
      out.type = g?.type || groupDef.type || "horizontal-lines";
      out.colorPalette = Array.isArray(g?.colorPalette) ? g.colorPalette.slice() : (groupDef.colorPalette || []);
      out.params = merge(groupDef.params || {}, g?.params);
      out.extra = obj(g?.extra);
      // carry any stored extras for calc-track persistence
      if (g?.trackExtras && typeof g.trackExtras === 'object') out.trackExtras = g.trackExtras;
      if (Array.isArray(g?._trackExtrasIndex)) out._trackExtrasIndex = g._trackExtrasIndex;
      if (g?.bbox){
        out.bbox = { x:num(g.bbox.x, 0), y:num(g.bbox.y, 0), w:num(g.bbox.w, 0), h:num(g.bbox.h, 0) };
      }
      return out;
    };

    this.nodes = arr(raw.nodes).map(normalizeNode);
    this.staging = arr(raw.staging).map(normalizeNode);
    this.bonuses = arr(raw.bonuses);
    this.tracks = arr(raw.tracks).map(normalizeTrack);
    this.links = arr(raw.links).map(normalizeLink);
    this.calcGroups = arr(raw.calcGroups).map(normalizeGroup);

    // Drafts with defaults
    this.trackDraft = merge(trackDef, raw.trackDraft); this.trackDraft.segments = ensureSegments(this.trackDraft.segments);
    this.linkDraft = merge(linkDef, raw.linkDraft);
    this.groupDraft = merge(groupDef, raw.groupDraft);

    // Sequences
    this.trackSeq = Number.isFinite(raw.trackSeq) ? +raw.trackSeq : this.tracks.length;
    this.linkSeq = Number.isFinite(raw.linkSeq) ? +raw.linkSeq : this.links.length;

    // Custom fields (ensure all buckets exist)
    const cf = ensureObj(raw.customFields);
    this.customFields = {
      node: ensureArr(cf.node),
      link: ensureArr(cf.link),
      track: ensureArr(cf.track),
      group: ensureArr(cf.group),
    };

    // --- Apply GM configuration: discovery, settings, filters (merge with sane defaults) ---
    // Use defaults from createInitialState so missing fields are filled.
    this.discovery = merge(defaults.discovery || {}, raw.discovery || {});
    this.settings = { ...(defaults.settings || {}), ...(raw.settings || {}) };
    if (raw.currentMode !== undefined) this.currentMode = raw.currentMode;
    else if (defaults.currentMode !== undefined) this.currentMode = defaults.currentMode;
    this.policy = { ...(defaults.policy || {}), ...(raw.policy || {}) };

    // DEBUG: log what the GM sent and what ended up in the store
    try {
      console.debug("[setRawSnapshot] incoming discovery:", raw.discovery, "applied discovery:", this.discovery);
      console.debug("[setRawSnapshot] currentMode:", this.currentMode, "policy:", this.policy);
    } catch (e) { /* ignore logging failures */ }

    // Filters: ensure canonical shape
    const defFilters = defaults.filters || { query: "", colors: [], extra: {}, searchTargets: { label:true, description:true, bonus:false, extras:{} } };
    this.filters = {
      query: String(raw.filters?.query ?? defFilters.query),
      colors: ensureArr(raw.filters?.colors || defFilters.colors),
      extra: (() => {
        const ex = ensureObj(raw.filters?.extra || defFilters.extra);
        // ensure arrays
        const out: Record<string,string[]> = {};
        for (const k of Object.keys(ex)) out[k] = Array.isArray(ex[k]) ? ex[k].slice() : (ex[k] != null ? [String(ex[k])] : []);
        return out;
      })(),
      searchTargets: (() => {
        const st = ensureObj(raw.filters?.searchTargets || defFilters.searchTargets);
        const extras = { ...(defFilters.searchTargets?.extras || {}) };
        const mergedExtras = { ...extras, ...(st.extras || {}) };
        return {
          label: st.label !== false,
          description: st.description !== false,
          bonus: !!st.bonus,
          extras: mergedExtras,
        };
      })()
    };
    // --- end apply GM configuration ---

    // Settings (optional meta)
    if (raw.meta?.settings) {
      const s = raw.meta.settings;
      if ("confirmDeleteNode" in s) this.settings.confirmDeleteNode = !!s.confirmDeleteNode;
      if ("confirmDeleteStaging" in s) this.settings.confirmDeleteStaging = !!s.confirmDeleteStaging;
      if ("enforceNoOverlap" in s) this.settings.enforceNoOverlap = !!s.enforceNoOverlap;
      if ("nodePadding" in s) this.settings.nodePadding = num(s.nodePadding, this.settings.nodePadding || 0);
      if ("showPadPreview" in s) this.settings.showPadPreview = !!s.showPadPreview;
      this._persistSettings?.();
    }
    this.savedAt = raw.meta?.savedAt || null;

    // Rebuild calculated tracks (your regen preserves extras)
    this._regenerateCalculatedGroups();

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
      links: this.links,
      trackSeq: this.trackSeq,
      linkSeq: this.linkSeq,
      trackDraft: this.trackDraft,
      linkDraft: this.linkDraft,
      groupDraft: this.groupDraft,
      customFields: this.customFields,
      meta: { savedAt: new Date().toISOString() },
      calcGroups: this.calcGroups,
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