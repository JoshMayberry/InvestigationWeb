import { newId } from "../util/newId";

export const trackActions = {
  addFreeTrack(this:any, p:{ p1:{x:number;y:number}; p2:{x:number;y:number}; color?:string; locked?:boolean }) {
    const id = `T${++this.trackSeq}`;
    const t = { id, kind:"free", p1:{...p.p1}, p2:{...p.p2}, color: p.color || this.trackDraft.color, locked: !!p.locked };
    this.tracks.push(t); this.dirty = true; return id;
  },
  patchTrack(this:any, id:string, patch:any){
    const i = this.tracks.findIndex((t:any)=> t.id === id);
    if (i === -1) return;
    this.tracks[i] = { ...this.tracks[i], ...patch };
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
};