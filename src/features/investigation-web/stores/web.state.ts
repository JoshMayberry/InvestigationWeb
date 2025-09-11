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
      pad: 0,
      sim: { enabled:false, restLength:160, tension:0.05, compression:0.05, maxForce:4 }
    } as any,

    discovery: { ...({ mode: "free", visibility: { mode: "hide", depth: 1 }, allowUndiscover: true }) },

    tools: {
      addFreeNode: false,
      addSimNode: false,
      addSnapNode: false,
      addLink: false,
      linkLasso: false,
      addTrack: false,
      addCalcGroup: false,
      placeStaged: null,
      placeStagedSnap: null
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

    simulation: {
      running: false,
      alpha: 0.6,
      alphaDecay: 0.005,
      velocityDecay: 0.15,
      chargeStrength: -200,
      linkDistance: 160,
      linkStrength: 0.05,
      collideRadius: 40,
      gravityX: 0,
      gravityY: 0,
      center: true,
      minAlphaOnInteract: 0.25,
      cellSize: 180,
    },

    presets: {
      simulation: [
        { id:"sim-default", name:"Default", description:"Baseline simulation parameters", data:{ alpha:0.6, alphaDecay:0.005, velocityDecay:0.15, center:true } },
        { id:"sim-repel-fast", name:"Repel Fast", description:"Strong repulsion, fast cooling", data:{ alpha:0.9, alphaDecay:0.02, velocityDecay:0.18, center:false, gravityX:0, gravityY:0 } },
        { id:"sim-slow-settle", name:"Slow Settle", description:"Slow decay for long drifting layout", data:{ alpha:0.7, alphaDecay:0.002, velocityDecay:0.08, center:true } },
        { id:"sim-orbit", name:"Light Gravity", description:"Gentle center gravity for orbital feel", data:{ alpha:0.8, alphaDecay:0.006, velocityDecay:0.12, center:true, gravityX:0, gravityY:0 } },
        { id:"sim-gravity-down", name:"Gravity Down", description:"Constant downward pull", data:{ alpha:0.75, alphaDecay:0.008, velocityDecay:0.14, gravityY:20, center:false } },
        { id:"sim-tight-springs", name:"Tight Springs", description:"Lower decay, tighter spring settle", data:{ alpha:0.85, alphaDecay:0.01, velocityDecay:0.2, center:true } },
        { id:"sim-loose-cloud", name:"Loose Cloud", description:"High velocity retention, airy motion", data:{ alpha:0.8, alphaDecay:0.004, velocityDecay:0.05, center:false } },
        { id:"sim-hot-explore", name:"Hot Explore", description:"High alpha & low decay to explore layout", data:{ alpha:1.0, alphaDecay:0.001, velocityDecay:0.1, center:false } },
      ],
      nodeSim: [
        { id:"node-attract", name:"Mild Attract", description:"Light mutual attraction", data:{ attraction:120, maxForce:15 } },
        { id:"node-repel", name:"Repel", description:"Pure repulsion", data:{ attraction:-180, maxForce:18 } },
        { id:"node-heavy", name:"Heavy Anchor", description:"High mass & low max force", data:{ attraction:40, mass:25, maxForce:8 } }
      ],
      linkSim: [
        { id:"link-soft", name:"Soft Spring", description:"Low stiffness link", data:{ restLength:160, tension:0.05, compression:0.05, maxForce:6 } },
        { id:"link-rigid", name:"Rigid", description:"High stiffness, short range", data:{ restLength:140, tension:0.4, compression:0.35, maxForce:25 } },
        { id:"link-elastic", name:"Elastic", description:"Loose tension, soft compression", data:{ restLength:200, tension:0.12, compression:0.04, maxForce:12 } },
        { id:"link-antipush", name:"Anti-Compression", description:"Repels when compressed", data:{ restLength:180, tension:0.15, compression:-0.15, maxForce:16 } },
        { id:"link-long-spring", name:"Long Spring", description:"Longer neutral length", data:{ restLength:260, tension:0.08, compression:0.06, maxForce:14 } }
      ]
    },
  };
}