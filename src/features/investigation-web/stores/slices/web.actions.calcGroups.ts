import { defaultHorizontalGroup, defaultSpiralGroup, generateGroupTracks } from "../util/calculatedTracks";
import { parseSimplePath, pointAtTrackPosition, sampleTrack } from "../util/trackGeometry";

function decimatePolyline(
  pts: { x:number; y:number }[],
  tol = 1.2
): { x:number; y:number }[] {
  if (pts.length <= 3) return pts;
  const keep = new Array(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  const sqTol = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    const A = pts[a], B = pts[b];
    const vx = B.x - A.x, vy = B.y - A.y;
    const vlen2 = vx * vx + vy * vy || 1;
    for (let i = a + 1; i < b; i++) {
      const P = pts[i];
      let t = ((P.x - A.x) * vx + (P.y - A.y) * vy) / vlen2;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      const px = A.x + vx * t, py = A.y + vy * t;
      const dx = P.x - px, dy = P.y - py;
      const d2 = dx * dx + dy * dy;
      if (d2 > maxD) { maxD = d2; idx = i; }
    }
    if (maxD > sqTol && idx !== -1) {
      keep[idx] = true;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out: { x:number; y:number }[] = [];
  for (let i = 0; i < pts.length; i++) if (keep[i]) out.push(pts[i]);
  return out;
}

export const calcGroupActions = {
  addCalculatedGroup(this:any, kind:'horizontal-lines'|'spiral-set'){
    const group = kind==='horizontal-lines' ? defaultHorizontalGroup() : defaultSpiralGroup();
    const view = this.runtime?.controllers?.view;
    if (view){
      const c = view.centerWorld?.();
      if (c){ group.params.cx = c.x; group.params.cy = c.y; }
    }
    this.calcGroups.push(group);
    this._regenerateCalculatedGroups();
    this.dirty = true;
    return group;
  },
  removeCalculatedGroup(this:any, id:string){
    const idx = this.calcGroups.findIndex((g:any)=> g.id===id);
    if (idx === -1) return;
    this.calcGroups.splice(idx,1);
    this.tracks = this.tracks.filter((t:any)=> !(t.kind==='calc' && t.groupId===id));
    this.dirty = true;
    this.recalcAllSnapLayouts?.();
  },
  explodeCalculatedGroup(this:any, id:string){
    const gIdx = this.calcGroups.findIndex((g:any)=> g.id===id);
    if (gIdx === -1) return;
    for (const t of this.tracks){
      if (t.kind === 'calc' && t.groupId === id){
        t.kind = 'free';
        delete t.groupId;
        t.locked = false;
        if (t.type === 'path' && typeof t.pathD === 'string'){
          const pts = parseSimplePath(t.pathD);
          if (pts.length >= 4){
            const dec = decimatePolyline(pts, 1.2); // tolerance ~1.2px
            t.pathPoints = dec;
            t.p1 = { ...dec[0] };
            t.p2 = { ...dec[dec.length-1] };
            delete t.pathD;
          } else if (pts.length >= 2){
            t.pathPoints = pts;
            t.p1 = { ...pts[0] };
            t.p2 = { ...pts[pts.length-1] };
            delete t.pathD;
          }
          t._v = (t._v||0) + 1;
        }
        if (t.type==='path' && t.pathPoints?.length){
          // prime arc cache lazily (will build on first use anyway)
          t._arcCache = null;
        }
      }
    }
    this.calcGroups.splice(gIdx,1);
    this.dirty = true;
    this.recalcAllSnapLayouts?.();
  },
  updateCalculatedGroup(this:any, id:string, patch:any){
    const g = this.calcGroups.find((x:any)=> x.id===id);
    if (!g) return;
    const isTypeChange = patch.type && patch.type !== g.type;
    if (isTypeChange){
      g.type = patch.type;
      const cx = g.params.cx ?? 0, cy = g.params.cy ?? 0, rotation = g.params.rotation ?? 0;
      g.params = (g.type === 'horizontal-lines')
        ? { cx, cy, rotation, width:800, lines:4, gap:120 }
        : { cx, cy, rotation, turns:1.0, spirals:3, r0:30, k:55, samples:260 };
    }
    const rest = { ...patch }; delete rest.type;
    g.params = { ...g.params, ...rest };
    for (const t of this.tracks){ if (t.groupId === id) t._oldGroupTrackId = t.id; }
    this._regenerateCalculatedGroups();
    this._remapSnapNodesForGroup(id);
    for (const t of this.tracks){ delete t._oldGroupTrackId; }
    this.recalcAllSnapLayouts?.();
    this.dirty = true;
    const newIds = this.tracks.filter((t:any)=> t.groupId===id).map((t:any)=> t.id);
    this._reapplyTrackPositions(newIds);
  },
  stageAllGroupSnapNodes(this:any, groupId:string){
    const ids = this.tracks.filter((t:any)=> t.groupId===groupId).map((t:any)=> t.id);
    const snaps = this.nodes.filter((n:any)=> n.kind==='snap' && ids.includes(n.trackId));
    for (const n of snaps){
      this.moveNodeToStaging?.(n.id);
    }
  },
  // Placement ghost
  startCalcGroupPlacement(this:any, defaultType="horizontal-lines"){
    const gd = this.groupDraft || {};
    const type = gd.type || defaultType;
    this.calcGroupPlacementGhost.active = true;
    this.calcGroupPlacementGhost.type = type;
    this.calcGroupPlacementGhost.params = { ...(gd.params||{}) };
    this.calcGroupPlacementGhost.valid = true;
    this.calcGroupPlacementGhost.reason = null;
    this.calcGroupPlacementGhost.tracks = [];
    this.calcGroupPlacementGhost.bbox = null;
    this.calcGroupPlacementGhost.centerX = this.groupDraft?.params?.cx || 0;
    this.calcGroupPlacementGhost.centerY = this.groupDraft?.params?.cy || 0;
  },
  updateCalcGroupPlacement(this:any, cx:number, cy:number, _opts?:any){
    if (!this.calcGroupPlacementGhost.active) return;
    const gd = this.groupDraft || {};
    const type = this.calcGroupPlacementGhost.type;
    const base = type === "spiral-set" ? defaultSpiralGroup() : defaultHorizontalGroup();
    base.id="__ghost__";
    base.params = { ...base.params, ...(gd.params||{}) };
    base.params.cx = cx;
    base.params.cy = cy;
    base.colorPalette = gd.colorPalette || base.colorPalette;
    const tracks = generateGroupTracks(base);
    // per-track validation
    const invalidIds:string[] = [];
    if (this.settings?.preventTrackCrossing){
      for (const nt of tracks){
        const ntSegs = sampleTrackSegments(nt);
        for (const et of this.tracks){
          if (et.kind==='calc') continue;
            const etSegs = sampleTrackSegments(et);
            let bad = false;
            outer:
            for (const a of ntSegs){
              for (const b of etSegs){
                if (segmentsIntersect(a.p1,a.p2,b.p1,b.p2)){ bad = true; break outer; }
              }
            }
            if (bad) { invalidIds.push(nt.id); break; }
        }
      }
    }
    this.calcGroupPlacementGhost.tracks = tracks;
    this.calcGroupPlacementGhost.bbox = base.bbox;
    this.calcGroupPlacementGhost.invalidIds = invalidIds;
    this.calcGroupPlacementGhost.valid = invalidIds.length === 0;
    this.calcGroupPlacementGhost.reason = invalidIds.length ? "cross" : null;
    this.calcGroupPlacementGhost.centerX = cx;
    this.calcGroupPlacementGhost.centerY = cy;

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
    function sampleTrackSegments(t:any){
      if (t.type==='straight') return [{ p1:t.p1, p2:t.p2 }];
      const samp = sampleTrack(t, 40);
      const segs:any[] = [];
      for (let i=0;i<samp.length-1;i++){
        segs.push({ p1:{x:samp[i].x,y:samp[i].y}, p2:{x:samp[i+1].x,y:samp[i+1].y} });
      }
      return segs;
    }
  },
  commitCalcGroupPlacement(this:any){
    const g = this.calcGroupPlacementGhost;
    if (!g.active) return null;
    if (!g.valid){ this.cancelCalcGroupPlacement(); return null; }
    const gd = this.groupDraft || {};
    const real = (gd.type === "spiral-set") ? defaultSpiralGroup() : defaultHorizontalGroup();
    real.type = gd.type || real.type;
    real.colorPalette = gd.colorPalette || real.colorPalette;
    real.params = { ...real.params, ...(gd.params||{}) };
    if (g.bbox){
      real.params.cx = g.bbox.x + g.bbox.w/2;
      real.params.cy = g.bbox.y + g.bbox.h/2;
    }
    this.calcGroups.push(real);
    this._regenerateCalculatedGroups();
    this.dirty = true;
    const id = real.id;
    this.cancelCalcGroupPlacement();
    this.recalcAllSnapLayouts?.();
    return id;
  },
  cancelCalcGroupPlacement(this:any){
    this.calcGroupPlacementGhost.active = false;
    this.calcGroupPlacementGhost.tracks = [];
    this.tools.addCalcGroup = false;
  },
  setGroupDraft(this:any, patch:any){
    this.groupDraft = { ...this.groupDraft, ...patch };
    this.dirty = true;
    if (this.calcGroupPlacementGhost.active){
      const cx = this.calcGroupPlacementGhost.centerX;
      const cy = this.calcGroupPlacementGhost.centerY;
      this.updateCalcGroupPlacement(cx, cy);
    }
  },
  setGroupDefaultsFromGroup(this:any, id:string){
    const g = this.calcGroups.find((x:any)=> x.id===id);
    if (!g) return;
    this.groupDraft = {
      type: g.type,
      colorPalette: [...g.colorPalette],
      params: { ...g.params }
    };
  },
  // Internal helpers
  _regenerateCalculatedGroups(this:any){
    this.tracks = this.tracks.filter((t:any)=> t.kind !== 'calc');
    for (const g of this.calcGroups){
      const gen = generateGroupTracks(g);
      for (const t of gen){
        t._v = 1;
      }
      this.tracks.push(...gen);
    }
  },
  _remapSnapNodesForGroup(this:any, groupId:string){
    const newTracks = this.tracks.filter((t:any)=> t.groupId === groupId);
    if (!newTracks.length) return;
    const oldTrackIds = new Set(newTracks.map((t:any)=> t._oldGroupTrackId).filter(Boolean));
    const affected = this.nodes.filter((n:any)=> n.kind==="snap" && oldTrackIds.has(n.trackId));
    if (!affected.length) return;
    affected.sort((a:any,b:any)=> (a.trackOrder||0)-(b.trackOrder||0));
    for (let i=0;i<affected.length;i++){
      const track = newTracks[i % newTracks.length];
      affected[i].trackId = track.id;
      delete affected[i].trackSegment;
    }
    for (const t of newTracks){
      this._recalcSnapTrackLayout?.(t.id);
    }
  },
  _reapplyTrackPositions(this:any, trackIds:string[]){
    for (const tid of trackIds){
      const track = this.tracks.find((t:any)=> t.id===tid);
      if (!track) continue;
      const snaps = this.nodes.filter((n:any)=> n.kind==='snap' && n.trackId===tid);
      for (const n of snaps){
        const pos = typeof n.trackPosition === 'number' ? n.trackPosition : 0.5;
        const pt = pointAtTrackPosition(track, pos);
        n.x = pt.x; n.y = pt.y;
      }
      this._recalcSnapTrackLayout(tid);
    }
  }
};