import { newId } from "../util/newId";
import { projectPointToTrack, pointAtTrackPosition } from "../util/trackGeometry"; // ADDED

export const nodeActions = {
  addNode(this:any, p:any){
    const d = this.settings.defaultNode;
    const wantSim = p.kind === 'sim' || p.simEnabled;
    const n:any = {
      id: p.id || newId(),
      kind: p.kind === 'snap' ? 'snap' : 'free',
      x: p.x ?? 0,
      y: p.y ?? 0,
      r: p.r ?? d.r,
      label: p.label ?? d.label,
      description: p.description ?? d.description ?? "",  // NEW
      data: p.data || {},
      locked: !!p.locked,
      labelStyle: p.labelStyle || { mode:'angle', angle:0, fontSize:11, margin:4 },
      extra: p.extra || {},               // NEW
    };
    if (n.kind === 'free' && wantSim){
      n.sim = { enabled:true };
    }
    this.nodes.push(n);
    this.dirty = true;
    return n;
  },
  addStaged(this:any, p?:any){
    const d = this.settings.defaultNode;
    const wantSim = p?.kind === 'sim' || p?.simEnabled;
    const n:any = {
      id: p?.id || newId("s"),
      kind: 'free',
      x: p?.x ?? 0,
      y: p?.y ?? 0,
      r: p?.r ?? d.r,
      label: p?.label ?? d.label,
      description: p?.description ?? d.description ?? "",   // NEW
      locked: !!p?.locked,
      labelStyle: p?.labelStyle || { mode:'angle', angle:0, fontSize:11, margin:4 },
      extra: p?.extra || {},              // NEW
    };
    if (wantSim) n.sim = { enabled:true };
    this.staging.push(n);
    this.dirty = true;
    return n;
  },
  duplicateNodeToStaging(this:any, id: string) {
    const n = this.nodes.find((n:any) => n.id === id); if (!n) return;
    this.addStaged({ r: n.r, color: n.color, label: n.label });
  },
  moveNodeToStaging(this:any, id: string) {
    const i = this.nodes.findIndex((n:any) => n.id === id); if (i === -1) return;
    const [n] = this.nodes.splice(i, 1); this.staging.push(n); this.dirty = true;
  },
  placeFromStaging(this:any, id: string, x: number, y: number) {
    const i = this.staging.findIndex((n:any) => n.id === id); if (i === -1) return;
    const [n] = this.staging.splice(i, 1); n.x = x; n.y = y; this.nodes.push(n);
    this.tools.placeStagedId = null; this.dirty = true; return n;
  },
  // (Optional robustness) when patching sim flag keep existing velocities:
  patchNode(this:any, id: string, patch: any) {
    const i = this.nodes.findIndex((n:any) => n.id === id); if (i === -1) return;
    if (patch.sim && this.nodes[i].sim){
      patch = { ...patch, sim: { ...this.nodes[i].sim, ...patch.sim } };
    }
    if (patch.labelStyle){
      const cur = this.nodes[i].labelStyle || {};
      patch = { ...patch, labelStyle: { ...cur, ...patch.labelStyle } };
    }
    if (patch.extra){
      const cur = this.nodes[i].extra || {};
      patch = { ...patch, extra: { ...cur, ...patch.extra } };
    }
    this.nodes[i] = { ...this.nodes[i], ...patch }; this.dirty = true;
  },
  hasNode(this:any, id:string){ return this.nodes.some((n:any)=> n.id === id) || this.staging.some((n:any)=> n.id === id); },
  renameNodeId(this:any, oldId:string, newId:string): boolean {
    const next = newId.trim(); if (!next || next === oldId) return true;
    if (this.nodes.some((n:any)=> n.id === next) || this.staging.some((n:any)=> n.id === next)) return false;
    const n = this.nodes.find((n:any)=> n.id === oldId); if (!n) return false;
    n.id = next;
    for (const l of this.links) { if (l.from === oldId) l.from = next; if (l.to === oldId) l.to = next; }
    this.dirty = true; return true;
  },
  deleteNode(this:any, id: string) {
    let i = this.nodes.findIndex((n:any)=> n.id === id);
    if (i !== -1) { this.nodes.splice(i, 1); this.dirty = true; return; }
    i = this.staging.findIndex((n:any)=> n.id === id);
    if (i !== -1) { this.staging.splice(i, 1); this.dirty = true; }
  },
  addSnapNode(this:any, p:{ trackId:string; proto?: any; tHint?: number; segmentHint?: number }) {
    const base = this.settings.defaultNode;
    const track = this.tracks.find((t:any)=> t.id===p.trackId);
    const segCount = Math.max(1, track?.segments || 1);
    let segIdx = typeof p.segmentHint === "number" ? p.segmentHint : (p.tHint!=null ? Math.min(segCount-1, Math.floor(p.tHint * segCount)) : 0);
    segIdx = Math.max(0, Math.min(segCount-1, segIdx));
    const n = {
      id: p.proto?.id || newId(),
      kind: "snap",
      trackId: p.trackId,
      trackOrder: 0,
      trackPosition: 0.5,
      trackSegment: segIdx, // NEW
      x: 0, y: 0,
      r: p.proto?.r ?? base.r, color: p.proto?.color ?? base.color, label: p.proto?.label ?? base.label,
    };
    this.nodes.push(n);
    this.dirty = true;
    this._recalcSnapTrackLayout(p.trackId, p.tHint, n.id, segIdx);
    return n;
  },
  placeSnapFromStaging(this:any, stagedId:string, trackId:string, tHint?:number){
    const i = this.staging.findIndex((n:any)=> n.id===stagedId);
    if (i === -1) return null;
    const [staged] = this.staging.splice(i,1);
    const snap = this.addSnapNode({ trackId, proto: staged, tHint });
    this.tools.placeStagedSnapId = null;
    this.dirty = true;
    return snap;
  },
  setSnapNodeSegment(this:any, id:string, segment:number){
    const n = this.nodes.find((x:any)=> x.id===id && x.kind==="snap");
    if (!n) return;
    const track = this.tracks.find((t:any)=> t.id===n.trackId); if (!track) return;
    const segs = Math.max(1, track.segments || 1);
    const clamped = Math.max(0, Math.min(segs-1, segment|0));
    if (n.trackSegment === clamped) return;
    n.trackSegment = clamped;
    this._recalcSnapTrackLayout(n.trackId);
  },
  _recalcSnapTrackLayout(this:any, trackId:string, optionalTHint?:number, newIdForHint?:string, newSegmentHint?:number){
    const track = this.tracks.find((t:any)=> t.id===trackId);
    if (!track) return;
    const snaps = this.nodes.filter((n:any)=> n.kind==="snap" && n.trackId===trackId);
    if (!snaps.length) return;
    const segCount = Math.max(1, track.segments || 1);

    // Build projected array using existing trackPosition (no projection) unless missing or new
    const projected = snaps.map(n=>{
      let t = typeof n.trackPosition === "number" ? n.trackPosition : 0.5;
      return { n, t };
    });

    if (optionalTHint!=null && newIdForHint){
      const target = projected.find(e=> e.n.id===newIdForHint);
      if (target){
        target.t = optionalTHint;
        if (typeof newSegmentHint === "number"){
          target.n.trackSegment = Math.max(0, Math.min(segCount-1, newSegmentHint));
        } else {
          target.n.trackSegment = Math.min(segCount-1, Math.floor(optionalTHint * segCount));
        }
      }
    }

    // Ensure every node has a segment index
    for (const e of projected){
      if (typeof e.n.trackSegment !== "number" || e.n.trackSegment < 0 || e.n.trackSegment >= segCount){
        e.n.trackSegment = Math.min(segCount-1, Math.floor(e.t * segCount));
      }
    }

    // Group by segment
    const groups: Record<number, typeof projected> = {};
    for (let i=0;i<segCount;i++) groups[i] = [];
    for (const e of projected) groups[e.n.trackSegment].push(e);

    let globalOrder = 0;
    for (let seg=0; seg<segCount; seg++){
      const list = groups[seg];
      if (!list.length) continue;
      // Sort by t but keep existing approximate order
      list.sort((a,b)=> a.t - b.t);
      const segT0 = seg / segCount;
      const segT1 = (seg+1)/segCount;
      const count = list.length;
      for (let i=0;i<count;i++){
        const localPos = (i+1)/(count+1);
        const pos = segT0 + (segT1 - segT0)*localPos;
        const pt = pointAtTrackPosition(track, pos);
        const n = list[i].n;
        n.trackOrder = globalOrder++;
        n.trackPosition = pos;
        n.x = pt.x; n.y = pt.y;
      }
    }
  },
  recalcAllSnapLayouts(this:any){
    const trackIds = Array.from(new Set(this.nodes.filter((n:any)=> n.kind==="snap").map((n:any)=> n.trackId)));
    for (const tid of trackIds) this._recalcSnapTrackLayout(tid);
  },
  setSnapGhost(this:any, g: Partial<{ active:boolean; x:number; y:number; trackId:string|null; t:number; valid:boolean; staged:boolean }>) {
    Object.assign(this.snapPlacement, g);
  },
  clearSnapGhost(this:any){
    this.snapPlacement.active = false;
    this.snapPlacement.trackId = null;
    this.snapPlacement.valid = false;
    this.snapPlacement.staged = false;
  },
  
  // Clipboard: copy node formatting (no id, no label/description/bonuses/connections)
  copyNode(this:any, id:string){
    const n = this.nodes.find((x:any)=> x.id === id) || this.staging.find((x:any)=> x.id === id);
    if (!n) return false;
    const payload:any = {
      // formatting fields allowed to copy to other nodes
      r: n.r,
      color: n.color,
      labelStyle: n.labelStyle ? { ...n.labelStyle } : undefined,
      extra: n.extra ? JSON.parse(JSON.stringify(n.extra)) : {},
      sim: n.sim ? { ...n.sim, vx: undefined, vy: undefined, fx: undefined, fy: undefined } : undefined
    };
    this.clipboard = { kind: 'node', data: payload };
    return true;
  },

  // Paste clipboard as a new node at position x,y (creates new id, does NOT copy label/description/bonuses/connections)
  pasteNodeAt(this:any, x:number, y:number){
    if (!this.clipboard || this.clipboard.kind !== 'node') return null;
    const tpl = this.clipboard.data || {};
    return this.addNode({ x, y, r: tpl.r, color: tpl.color, labelStyle: tpl.labelStyle, extra: JSON.parse(JSON.stringify(tpl.extra || {})), sim: tpl.sim });
  },

  // Paste clipboard formatting onto existing node (only nodes -> nodes)
  pasteNodeOnto(this:any, targetId:string){
    if (!this.clipboard || this.clipboard.kind !== 'node') return false;
    const t = this.nodes.find((n:any)=> n.id === targetId) || this.staging.find((n:any)=> n.id === targetId);
    if (!t) return false;
    const tpl = this.clipboard.data || {};
    // Only allow node settings to be applied
    const patch:any = {};
    if (tpl.r !== undefined) patch.r = tpl.r;
    if (tpl.color !== undefined) patch.color = tpl.color;
    if (tpl.labelStyle !== undefined) patch.labelStyle = { ...(t.labelStyle||{}), ...tpl.labelStyle };
    if (tpl.extra !== undefined) patch.extra = { ...(t.extra||{}), ...JSON.parse(JSON.stringify(tpl.extra)) };
    if (tpl.sim !== undefined) patch.sim = { ...(t.sim||{}), ...tpl.sim };
    this.patchNode(targetId, patch);
    return true;
  },
  clearClipboard(this:any){ this.clipboard = null; return true; },
};