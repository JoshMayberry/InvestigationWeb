import { defaultSettings } from "./slices/web.actions.settings";

export function createInitialState() {
  return {
    policy: { canEditStructure: false, canDiscover: false, canInteract: true },
    nodes: [] as any[],
    staging: [] as any[],
    bonuses: [] as any[],
    savedAt: null as string | null,
    dirty: false,
    settings: { ...defaultSettings },
    filters: { query: "", colors: [] as string[] },

    tracks: [] as any[],
    trackSeq: 0,
    trackDraft: { kind: "free", color: "#93c5fd", locked: false } as any,

    links: [] as any[],
    linkSeq: 0,
    linkDraft: {
      type: "straight",
      color: "#64748b",
      stroke: "solid",
      arrowHead: false,
      pad: 0
    } as any,

    discovery: { ...({ mode:"free", visibility:{ mode:"hide", depth:1 }, allowUndiscover:true }) },

    tools: { addFreeNode: false, placeStagedId: null as string | null, editDefaults: false, addLink: false, addTrack: false },
    currentEditState: "none" as "none"|"add-free-node"|"add-link"|"add-track"|"place-stashed-node"|"drag-free-node"|"edit-selected-node",
    drag: { nodeId: null as string | null, active: false },
    panels: { settingsOpen: false },
  };
}