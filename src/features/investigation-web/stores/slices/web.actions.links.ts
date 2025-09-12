import type { LinkType } from "../../types/links";

export const linkActions = {
  setLinkDraft(this:any, p: any){ this.linkDraft = { ...this.linkDraft, ...p }; },
  hasLink(this:any, id:string){ return this.links.some((l:any)=> l.id === id); },
  renameLinkId(this:any, oldId:string, newId:string): boolean {
    if (!newId || oldId === newId) return true;
    if (this.links.some((l:any)=> l.id === newId)) return false;
    const l = this.links.find((l:any)=> l.id === oldId); if (!l) return false;
    l.id = newId; this.dirty = true; return true;
  },
  addLink(this:any, payload: {
    type: LinkType; from: string; to: string;
    color?: string; stroke?: "solid"|"dashed"|"dotted"; arrowHead?: boolean; pad?: number;
    midpoints?: {x:number;y:number;}[];
    turns?: number; startRadius?: number; endRadius?: number; direction?: 1|-1;
    c1?: { t:number; off:number }; c2?: { t:number; off:number }; symmetric?: boolean;
    controls?: { t:number; off:number }[]; tension?: number;
  }){
    const id = `L${++this.linkSeq}`;
    let link:any;
    if (payload.type === "curved"){
      link = { id, type:"curved", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
        midpoints: payload.midpoints || [], midControls: [] };
    } else if (payload.type === "bezier"){
      const defC1 = this.linkDraft.c1 ?? { t: 25, off: 30 };
      const defC2 = this.linkDraft.c2 ?? { t: 75, off: -30 };
      link = { id, type:"bezier", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
        c1: payload.c1 ?? defC1, c2: payload.c2 ?? defC2, symmetric: payload.symmetric ?? (this.linkDraft.symmetric ?? false) };
    } else if (payload.type === "spline"){
      link = { id, type:"spline", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
        controls: payload.controls ?? (this.linkDraft.controls ?? [{ t: 33, off: 20 }, { t: 66, off: -10 }]),
        tension: payload.tension ?? (this.linkDraft.tension ?? 0.25) };
    } else if (payload.type === "corkscrew"){
      const turns = Math.round(payload.turns ?? (this.linkDraft.turns ?? 1));
      link = { id, type:"corkscrew", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
        turns, startRadius: payload.startRadius ?? (this.linkDraft.startRadius ?? 10),
        endRadius: payload.endRadius ?? (this.linkDraft.endRadius ?? 60),
        direction: payload.direction ?? (this.linkDraft.direction ?? 1) };
    } else if (payload.type === "spiral"){
      const turns = Math.round(payload.turns ?? (this.linkDraft.turns ?? 1));
      link = { id, type:"spiral", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad,
        turns, startRadius: payload.startRadius ?? (this.linkDraft.startRadius ?? 10),
        endRadius: payload.endRadius ?? (this.linkDraft.endRadius ?? 60),
        direction: payload.direction ?? (this.linkDraft.direction ?? 1) };
    } else {
      link = { id, type:"straight", from: payload.from, to: payload.to,
        color: payload.color || this.linkDraft.color, stroke: payload.stroke || this.linkDraft.stroke,
        arrowHead: payload.arrowHead ?? this.linkDraft.arrowHead, pad: payload.pad ?? this.linkDraft.pad };
    }
    if ((payload as any)?.simEnabled || this.linkDraft?.sim?.enabled) {
      link.sim = {
        enabled:true,
        restLength: (payload as any).restLength ?? this.linkDraft.sim?.restLength ?? 160,
        tension: (payload as any).tension ?? this.linkDraft.sim?.tension ?? 0.05,
        compression: (payload as any).compression ?? this.linkDraft.sim?.compression ?? 0.05,
        maxForce: (payload as any).maxForce ?? this.linkDraft.sim?.maxForce ?? 4
      };
    }
    link.extra = (payload as any).extra || {};
    this.links.push(link); return id;
  },
  patchLink(this:any, id: string, patch: any) {
    const i = this.links.findIndex((l:any)=> l.id === id); if (i === -1) return;
    const before = this.links[i]; let next = { ...before, ...patch };
    if (patch.type && patch.type !== before.type) {
      const base = { id: before.id, from: before.from, to: before.to, color: before.color, stroke: before.stroke, arrowHead: before.arrowHead, pad: before.pad };
      if (patch.type === "curved") next = { ...base, type:"curved", midpoints: [], midControls: [] };
      else if (patch.type === "bezier") next = { ...base, type:"bezier", c1: this.linkDraft.c1 ?? { t:25, off:30 }, c2: this.linkDraft.c2 ?? { t:75, off:-30 }, symmetric: this.linkDraft.symmetric ?? false };
      else if (patch.type === "spline") next = { ...base, type:"spline", controls: this.linkDraft.controls ?? [{ t: 33, off: 20 }, { t: 66, off: -10 }], tension: this.linkDraft.tension ?? 0.25 };
      else if (patch.type === "corkscrew") next = { ...base, type:"corkscrew", turns: Math.round(this.linkDraft.turns ?? 1), startRadius: this.linkDraft.startRadius ?? 10, endRadius: this.linkDraft.endRadius ?? 60, direction: this.linkDraft.direction ?? 1 };
      else if (patch.type === "spiral") next = { ...base, type:"spiral", turns: Math.round(this.linkDraft.turns ?? 1), startRadius: this.linkDraft.startRadius ?? 10, endRadius: this.linkDraft.endRadius ?? 60, direction: this.linkDraft.direction ?? 1 };
      else next = { ...base, type:"straight" };
    }
    if ((next as any).type === "corkscrew" && patch.turns !== undefined) (next as any).turns = Math.round(patch.turns);
    if ((next as any).type === "spiral" && patch.turns !== undefined) (next as any).turns = Math.round(patch.turns);
    if (patch.sim && (this.links[i] as any).sim){
      next.sim = { ...(this.links[i] as any).sim, ...patch.sim };
    }
    if (next.sim?.enabled && (next.sim.restLength == null)){
      const A = this.nodes.find((n:any)=> n.id===next.from);
      const B = this.nodes.find((n:any)=> n.id===next.to);
      if (A && B){
        next.sim.restLength = Math.hypot(B.x-A.x, B.y-A.y);
      }
    }
    if ((patch as any).extra){
      const cur = (this.links[i] as any).extra || {};
      (next as any).extra = { ...cur, ...(patch as any).extra };
    }
    this.links[i] = next; this.dirty = true;
  },
  deleteLink(this:any, id:string){
    const i = this.links.findIndex((l:any)=> l.id === id);
    if (i >= 0) this.links.splice(i,1);
  },
  removeLink(this:any, id:string){                     // NEW
    const i = (this.links || []).findIndex((l:any)=> l.id === id);
    if (i === -1) return false;
    const removed = this.links[i];
    this.links.splice(i,1);
    this.dirty = true;
    // optional: push undo if controller exists
    this._pushUndo?.({
      label:`delete-link:${id}`,
      before: { add: [removed] },
      after: { remove: [id] },
      do: ()=>{},
      undo: ()=>{ this.links.push(removed); this.dirty = true; },
    });
    return true;
  },
  removeLinks(this:any, ids:string[]){                 // NEW
    const set = new Set(ids);
    const kept:any[] = [];
    const removed:any[] = [];
    for (const l of (this.links||[])){
      if (set.has(l.id)) removed.push(l); else kept.push(l);
    }
    if (!removed.length) return false;
    this.links = kept;
    this.dirty = true;
    this._pushUndo?.({
      label:`delete-links:${removed.length}`,
      before: { add: removed.slice() },
      after: { remove: removed.map((x:any)=> x.id) },
      do: ()=>{},
      undo: ()=>{ this.links.push(...removed); this.dirty = true; },
    });
    return true;
  },
};