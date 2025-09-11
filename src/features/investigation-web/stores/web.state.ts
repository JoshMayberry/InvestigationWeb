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
    trackDraft: {
      color: "#93c5fd",
      kind: "free",
      type: "straight",
      locked: false,
      segments: 1, // NEW
      // defaults for advanced types
      midControls: [] as any[],
      c1: { t: 25, off: 30 },
      c2: { t: 75, off: -30 },
      symmetric: false,
      controls: [{ t: 33, off: 20 }, { t: 66, off: -10 }],
      tension: 0.25,
      turns: 2,
      startRadius: 10,
      endRadius: 60,
      direction: 1 as 1 | -1
    } as any,

    groupDraft: {
      type: "horizontal-lines",
      colorPalette: ['#38bdf8','#22d3ee','#818cf8','#f472b6'],
      params: { cx:0, cy:0, width:800, lines:4, gap:120, rotation:0 }
    },

    links: [] as any[],
    linkSeq: 0,
    linkDraft: {
      type: "straight",
      color: "#64748b",
      stroke: "solid",
      arrowHead: false,
      pad: 0
    } as any,

    discovery: { ...({ mode: "free", visibility: { mode: "hide", depth: 1 }, allowUndiscover: true }) },

    tools: {
      addFreeNode: false,
      addSnapNode: false,
      addLink: false,
      addTrack: false,
      addCalcGroup: false, // NEW
      placeStagedId: null,
      placeStagedSnapId: null
    },
    currentEditState: "none" as import("../types/editState").CurrentEditState,
    drag: { nodeId: null as string | null, active: false },
    panels: { settingsOpen: false },
    snapPlacement: {
      active: false,
      x: 0, y: 0,
      trackId: null as string | null,
      t: 0,
      valid: false,
      staged: false, // placing from staging?
    },
    trackDragGhost: {
      active: false,
      mode: "translate" as "translate"|"end",
      trackId: null as string|null,
      p1: { x:0, y:0 },
      p2: { x:0, y:0 },
      color: "#93c5fd",
      valid: true,
      reason: null as string|null
    },
    calcGroupPlacementGhost: {
      active: false,
      type: "horizontal-lines",
      params: {},
      valid: true,
      reason: null,
      tracks: [],
      bbox: null,
      centerX: 0,
      centerY: 0,
      invalidIds: [] as string[]
    },
    suppressClearSelectionUntil: 0,
    calcGroups: [], // array of calculated track groups
  };
}