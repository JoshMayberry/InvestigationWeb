import { newId } from "../util/newId";
import { pointAtTrackPosition } from "../util/trackGeometry";

export const trackActions = {
  addFreeTrack(this:any, p:{ p1:{x:number;y:number}; p2:{x:number;y:number}; color?:string; locked?:boolean; type?:string }) {
    const id = `T${++this.trackSeq}`;
    const td = this.trackDraft;
    const type = (p.type || td.type || "straight") as any;
    const segments = Math.max(1, td.segments || 1);
    const t = {
      id,
      kind:"free",
      type,
      p1:{...p.p1},
      p2:{...p.p2},
      color: p.color || td.color,
      locked: !!p.locked,
      segments,
      // copy type-specific defaults (lightweight)
      midControls: type==="curved" ? [...(td.midControls||[])] : undefined,
      c1: type==="bezier" ? { ...(td.c1||{ t:25, off:30 }) } : undefined,
      c2: type==="bezier" ? { ...(td.c2||{ t:75, off:-30 }) } : undefined,
      symmetric: type==="bezier" ? !!td.symmetric : undefined,
      controls: type==="spline" ? [...(td.controls||[])] : undefined,
      tension: type==="spline" ? td.tension : undefined,
      turns: (type==="corkscrew"||type==="spiral") ? td.turns : undefined,
      startRadius: (type==="corkscrew"||type==="spiral") ? td.startRadius : undefined,
      endRadius: (type==="corkscrew"||type==="spiral") ? td.endRadius : undefined,
      direction: (type==="corkscrew"||type==="spiral") ? td.direction : undefined,
    };
    this.tracks.push(t);
    this.dirty = true;
    return id;
  },
  _repositionSnapNodesForTrack(this:any, trackId:string){
    const track = this.tracks.find((t:any)=> t.id===trackId);
    if (!track) return;
    const snaps = this.nodes.filter((n:any)=> n.kind === "snap" && n.trackId === trackId);
    if (!snaps.length) return;
    for (const s of snaps){
      // Use stored trackPosition if present; fallback to order
      let pos = typeof s.trackPosition === "number" ? s.trackPosition : ((s.trackOrder + 1) / (snaps.length + 1));
      if (pos < 0) pos = 0; else if (pos > 1) pos = 1;
      const pt = pointAtTrackPosition(track, pos);
      s.x = pt.x; s.y = pt.y;
    }
  },
  patchTrack(this:any, id:string, patch:any){
    const i = this.tracks.findIndex((t:any)=> t.id===id);
    if (i === -1) return;
    this.tracks[i] = { ...this.tracks[i], ...patch };
    this.dirty = true;
    const shapeKeys = ["p1","p2","type","midControls","c1","c2","symmetric","controls","tension","turns","startRadius","endRadius","direction","segments"];
    if (Object.keys(patch).some(k => shapeKeys.includes(k))){
      this._repositionSnapNodesForTrack(id);
      if (patch.segments != null) this._recalcSnapTrackLayout(id); // force spacing update
    }
  },
  setTrackDraft(this:any, patch:any){
    this.trackDraft = { ...this.trackDraft, ...patch };
    this.dirty = true;
  },
  deleteTrack(this:any, id:string){
    const i = this.tracks.findIndex((t:any)=> t.id === id);
    if (i >= 0) this.tracks.splice(i,1);
  },
  renameTrackId(this:any, oldId:string, next:string): boolean {
    const id = next.trim(); if (!id || id === oldId) return true;
    if (this.tracks.some((t:any)=> t.id === id)) return false;
    const t = this.tracks.find((t:any)=> t.id === oldId); if (!t) return false;
    t.id = id; this.dirty = true; return true;
  },
  duplicateTrack(this:any, id:string){
    const t = this.tracks.find((x:any)=> x.id===id);
    if (!t) return null;
    const dx = t.p2.x - t.p1.x, dy = t.p2.y - t.p1.y;
    // Horizontal-ish if |dx| >= |dy| (45° treated as horizontal)
    const horiz = Math.abs(dx) >= Math.abs(dy);
    const off = this.settings?.gridSize ? Math.max(8, this.settings.gridSize/2) : 12;
    const shift = horiz ? { x: 0, y: off } : { x: off, y: 0 };
    const p1 = { x: t.p1.x + shift.x, y: t.p1.y + shift.y };
    const p2 = { x: t.p2.x + shift.x, y: t.p2.y + shift.y };
    const nid = this.addFreeTrack({ p1, p2, color: t.color, locked: t.locked });
    return nid;
  },
  setTrackType(this:any, id:string, nextType:string){
    const i = this.tracks.findIndex((t:any)=> t.id===id);
    if (i === -1) return;
    const t = this.tracks[i];
    if (t.type === nextType) return;
    const td = this.trackDraft;
    const patch:any = { type: nextType };
    // initialize shape fields
    if (nextType === "curved") patch.midControls = [...(td.midControls||[])];
    if (nextType === "bezier") {
      patch.c1 = { ...(td.c1||{ t:25, off:30 }) };
      patch.c2 = { ...(td.c2||{ t:75, off:-30 }) };
      patch.symmetric = !!td.symmetric;
    }
    if (nextType === "spline") {
      patch.controls = [...(td.controls||[])];
      patch.tension = td.tension;
    }
    if (nextType === "corkscrew" || nextType === "spiral"){
      patch.turns = td.turns;
      patch.startRadius = td.startRadius;
      patch.endRadius = td.endRadius;
      patch.direction = td.direction;
    }
    this.tracks[i] = { ...t, ...patch };
    this.dirty = true;
    this._repositionSnapNodesForTrack(id);
  },
  setTrackDefaultsFromTrack(this:any, id:string){
    const t = this.tracks.find((x:any)=> x.id===id);
    if (!t) return;
    const copy:any = {
      color: t.color,
      type: t.type,
      locked: false,
      segments: Math.max(1, t.segments || 1),
      midControls: t.midControls ? [...t.midControls] : [],
      c1: t.c1 ? { ...t.c1 } : undefined,
      c2: t.c2 ? { ...t.c2 } : undefined,
      symmetric: !!t.symmetric,
      controls: t.controls ? [...t.controls] : undefined,
      tension: t.tension,
      turns: t.turns,
      startRadius: t.startRadius,
      endRadius: t.endRadius,
      direction: t.direction,
    };
    this.setTrackDraft(copy);
  },
  startTrackDragGhost(this:any, track:any, mode:"translate"|"end"){
    this.trackDragGhost.active = true;
    this.trackDragGhost.mode = mode;
    this.trackDragGhost.trackId = track.id;
    this.trackDragGhost.p1 = { ...track.p1 };
    this.trackDragGhost.p2 = { ...track.p2 };
    this.trackDragGhost.color = track.color || "#93c5fd";
    this.trackDragGhost.valid = true;
    this.trackDragGhost.reason = null;
  },
  updateTrackDragGhost(this:any, p1:{x:number;y:number}, p2:{x:number;y:number}){
    this.trackDragGhost.p1 = p1;
    this.trackDragGhost.p2 = p2;
    // simple validation (crossing) reused from prior logic if desired
    if (!this.settings?.preventTrackCrossing){
      this.trackDragGhost.valid = true; this.trackDragGhost.reason = null; return;
    }
    const A1 = p1, A2 = p2;
    for (const t of this.tracks){
      if (t.id === this.trackDragGhost.trackId) continue;
      const B1 = t.p1, B2 = t.p2;
      const touches =
        (Math.hypot(A1.x-B1.x,A1.y-B1.y) < 1e-4) || (Math.hypot(A1.x-B2.x,A1.y-B2.y) < 1e-4) ||
        (Math.hypot(A2.x-B1.x,A2.y-B1.y) < 1e-4) || (Math.hypot(A2.x-B2.x,A2.y-B2.y) < 1e-4);
      if (touches) continue;
      if (segmentsIntersect(A1,A2,B1,B2)){
        this.trackDragGhost.valid = false;
        this.trackDragGhost.reason = "cross";
        return;
      }
    }
    this.trackDragGhost.valid = true;
    this.trackDragGhost.reason = null;
    function segmentsIntersect(a1:any,a2:any,b1:any,b2:any){
      function orient(p:any,q:any,r:any){ const v=(q.y-p.y)*(r.x-q.x)-(q.x-p.x)*(r.y-q.y); return Math.sign(v); }
      function onSeg(p:any,q:any,r:any){ return Math.min(p.x,r.x)-1e-6<=q.x&&q.x<=Math.max(p.x,r.x)+1e-6 && Math.min(p.y,r.y)-1e-6<=q.y&&q.y<=Math.max(p.y,r.y)+1e-6; }
      const o1=orient(a1,a2,b1),o2=orient(a1,a2,b2),o3=orient(b1,b2,a1),o4=orient(b1,b2,a2);
      if (o1!==o2 && o3!==o4) return true;
      if (o1===0&&onSeg(a1,b1,a2)) return true;
      if (o2===0&&onSeg(a1,b2,a2)) return true;
      if (o3===0&&onSeg(b1,a1,b2)) return true;
      if (o4===0&&onSeg(b1,a2,b2)) return true;
      return false;
    }
  },
  endTrackDragGhost(this:any, commit:boolean){
    if (commit && this.trackDragGhost.valid && this.trackDragGhost.trackId){
      this.patchTrack(this.trackDragGhost.trackId, {
        p1: { ...this.trackDragGhost.p1 },
        p2: { ...this.trackDragGhost.p2 }
      });
      this.recalcAllSnapLayouts?.();
    }
    this.trackDragGhost.active = false;
    this.trackDragGhost.trackId = null;
  },
};