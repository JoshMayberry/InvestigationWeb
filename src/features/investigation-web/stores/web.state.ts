import { defaultSettings } from "./slices/web.actions.settings";
import { defaultDiscoveryState } from "./slices/web.actions.discovery";

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
    links: [] as any[],
    linkSeq: 0,
    linkDraft: {
      type: "straight",
      color: "#64748b",
      stroke: "solid",
      arrowHead: false,
      pad: 0
    } as any,
    discovery: { ...defaultDiscoveryState },
    tools: { addFreeNode: false, placeStagedId: null as string | null, editDefaults: false, addLink: false },
    currentEditState: "none" as "none"|"add-free-node"|"add-link"|"place-stashed-node"|"drag-free-node"|"edit-selected-node",
    drag: { nodeId: null as string | null, active: false },
  };
}