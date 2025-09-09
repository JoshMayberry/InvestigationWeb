import { newId } from "../util/newId";

export const nodeActions = {
  addNode(this:any, p: any) {
    const d = this.settings.defaultNode;
    const n = {
      id: p.id || newId(),
      kind: "free",
      x: p.x ?? 0, y: p.y ?? 0,
      r: p.r ?? d.r, color: p.color || d.color, label: p.label ?? d.label
    };
    this.nodes.push(n); this.dirty = true; return n;
  },
  addStaged(this:any, p?: any) {
    const d = this.settings.defaultNode;
    const n = {
      id: p?.id || newId("s"),
      kind: "free",
      x: p?.x ?? 0, y: p?.y ?? 0,
      r: p?.r ?? d.r, color: p?.color || d.color, label: p?.label ?? d.label
    };
    this.staging.push(n); this.dirty = true; return n;
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
  patchNode(this:any, id: string, patch: any) {
    const i = this.nodes.findIndex((n:any) => n.id === id); if (i === -1) return;
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
};