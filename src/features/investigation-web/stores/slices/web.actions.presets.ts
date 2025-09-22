export const presetActions = {
  _persistPresets(this:any){
    try { localStorage.setItem("investigation.presets", JSON.stringify(this.presets)); } catch {}
  },
  initPresetsFromLocal(this:any){
    try {
      const raw = localStorage.getItem("investigation.presets");
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.simulation) this.presets.simulation = data.simulation;
      if (data.nodeSim) this.presets.nodeSim = data.nodeSim;
      if (data.linkSim) this.presets.linkSim = data.linkSim;
    } catch {}
  },
  addSimulationPreset(this:any, name:string, description:string){
    const data = { ...this.simulation };
    delete data.running;
    this.presets.simulation.push({ id:`ps-${Date.now()}`, name, description, data });
    this._persistPresets();
  },
  applySimulationPreset(this:any, id:string){
    const p = this.presets.simulation.find((x:any)=> x.id===id); if (!p) return;
    this.updateSimSettings({ ...p.data });
    if (!this.simulation.running) this.simulation.alpha = p.data.alpha ?? this.simulation.alpha;
  },
  removeSimulationPreset(this:any, id:string){
    const i = this.presets.simulation.findIndex((x:any)=> x.id===id); if (i>=0){ this.presets.simulation.splice(i,1); this._persistPresets(); }
  },
  addNodeSimPreset(this:any, name:string, description:string, node:any){
    if (!node?.sim) return;
    this.presets.nodeSim.push({ id:`pn-${Date.now()}`, name, description, data:{ ...node.sim } });
    this._persistPresets();
  },
  applyNodeSimPreset(this:any, id:string, nodeId:string){
    const p = this.presets.nodeSim.find((x:any)=> x.id===id); if (!p) return;
    this.patchNode(nodeId, { sim: { ...p.data, enabled:true } });
  },
  removeNodeSimPreset(this:any, id:string){
    const i = this.presets.nodeSim.findIndex((x:any)=> x.id===id); if (i>=0){ this.presets.nodeSim.splice(i,1); this._persistPresets(); }
  },
  addLinkSimPreset(this:any, name:string, description:string, link:any){
    if (!link?.sim) return;
    this.presets.linkSim.push({ id:`pl-${Date.now()}`, name, description, data:{ ...link.sim } });
    this._persistPresets();
  },
  applyLinkSimPreset(this:any, id:string, linkId:string){
    const p = this.presets.linkSim.find((x:any)=> x.id===id); if (!p) return;
    this.patchLink(linkId, { sim: { ...p.data, enabled:true } });
  },
  removeLinkSimPreset(this:any, id:string){
    const i = this.presets.linkSim.findIndex((x:any)=> x.id===id); if (i>=0){ this.presets.linkSim.splice(i,1); this._persistPresets(); }
  },
  exportSettingsAndPresets(this:any){
    const blob = new Blob([JSON.stringify({ settings:this.settings, presets:this.presets }, null, 2)], { type:"application/json" });
    const a = document.createElement("a");
    a.download = "investigation-settings-presets.json";
    a.href = URL.createObjectURL(blob);
    a.click();
    setTimeout(()=> URL.revokeObjectURL(a.href), 2000);
  },
  importSettingsAndPresets(this:any, obj:any){
    if (obj.settings){
      Object.assign(this.settings, obj.settings);
      this._persistSettings();
    }
    if (obj.presets){
      if (obj.presets.simulation) this.presets.simulation = obj.presets.simulation;
      if (obj.presets.nodeSim) this.presets.nodeSim = obj.presets.nodeSim;
      if (obj.presets.linkSim) this.presets.linkSim = obj.presets.linkSim;
      this._persistPresets();
    }
  }
};