import { LS_SETTINGS_KEY } from "../web.const";

export const defaultSettings = {
  confirmDeleteNode: true,
  confirmDeleteStaging: true,
  enforceNoOverlap: false,
  nodePadding: 0,
  showPadPreview: false,
  linkHitRadius: 10,
  defaultNode: { r: 14, color: "#10b981", label: "New" },
  undoCoalesceMs: 300,
};

export const settingsActions = {
  _persistSettings(this: any) {
    try { localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(this.settings)); } catch {}
  },
  initSettingsFromLocal(this: any) {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      if (!raw) return;
      const obj = JSON.parse(raw);
      Object.assign(this.settings, {
        confirmDeleteNode: !!obj.confirmDeleteNode,
        confirmDeleteStaging: !!obj.confirmDeleteStaging,
        enforceNoOverlap: !!obj.enforceNoOverlap,
        nodePadding: Number(obj.nodePadding) || 0,
        showPadPreview: !!obj.showPadPreview,
        undoCoalesceMs: Number(obj.undoCoalesceMs) || this.settings.undoCoalesceMs,
        defaultNode: {
          r: obj.defaultNode?.r ?? this.settings.defaultNode.r,
          color: obj.defaultNode?.color ?? this.settings.defaultNode.color,
          label: obj.defaultNode?.label ?? this.settings.defaultNode.label
        },
        linkHitRadius: Number(obj.linkHitRadius) || this.settings.linkHitRadius
      });
    } catch {}
  },
  setSetting(this: any, key: string, val: any) {
    if (key in this.settings) {
      (this.settings as any)[key] = val;
      this._persistSettings();
    }
  },
  updateDefaultNode(this: any, p: Partial<{ r:number; color:string; label:string }>) {
    this.settings.defaultNode = { ...this.settings.defaultNode, ...p };
    this._persistSettings();
  },
  setDefaultsFromNode(this: any, id: string) {
    const n = this.nodes.find((n:any) => n.id === id);
    if (!n) return;
    this.updateDefaultNode({
      r: n.r,
      color: n.color || this.settings.defaultNode.color,
      label: n.label || this.settings.defaultNode.label
    });
  },
};