export const customFieldActions = {
  addCustomField(this:any, kind:'node'|'link'|'track'|'group', key:string, label?:string){
    key = String(key||"").trim();
    if (!key) return false;
    const list = this.customFields[kind] as any[];
    if (list.some((f:any)=> f.key === key)) return false;
    list.push({ key, label });
    // ensure .extra exists and add empty value
    const ensure = (o:any)=> { if (!o.extra) o.extra = {}; if (!(key in o.extra)) o.extra[key] = ""; };
    if (kind==='node'){ for (const n of this.nodes) ensure(n); for (const n of this.staging) ensure(n); }
    if (kind==='link'){ for (const l of this.links) ensure(l); }
    if (kind==='track'){ for (const t of this.tracks) ensure(t); }
    if (kind==='group'){ for (const g of this.calcGroups) ensure(g); }
    this.dirty = true; return true;
  },
  removeCustomField(this:any, kind:'node'|'link'|'track'|'group', key:string){
    const list = this.customFields[kind] as any[];
    const i = list.findIndex((f:any)=> f.key === key);
    if (i === -1) return false;
    list.splice(i,1);
    const strip = (o:any)=> { if (o.extra) delete o.extra[key]; };
    if (kind==='node'){ for (const n of this.nodes) strip(n); for (const n of this.staging) strip(n); }
    if (kind==='link'){ for (const l of this.links) strip(l); }
    if (kind==='track'){ for (const t of this.tracks) strip(t); }
    if (kind==='group'){ for (const g of this.calcGroups) strip(g); }
    this.dirty = true; return true;
  },
  setCustomValue(this:any, kind:'node'|'link'|'track'|'group', id:string, key:string, value:any){
    const set = (obj:any)=> { if (!obj.extra) obj.extra = {}; obj.extra[key] = value; };
    if (kind==='node'){
      const n = this.nodes.find((x:any)=> x.id===id); if (n) set(n);
      const s = this.staging.find((x:any)=> x.id===id); if (s) set(s);
    } else if (kind==='link'){
      const l = this.links.find((x:any)=> x.id===id); if (l) set(l);
    } else if (kind==='track'){
      const t = this.tracks.find((x:any)=> x.id===id); if (t) set(t);
    } else if (kind==='group'){
      const g = this.calcGroups.find((x:any)=> x.id===id); if (g) set(g);
    }
    this.dirty = true;
  },
};