import type { Bonus } from "./bonus";
import type { NodeAny } from "./node";

export type Snapshot = {
  version: 4;
  nodes: any[];
  staging: any[];
  bonuses: any[];
  tracks: any[];
  trackSeq?: number;
  trackDraft?: any;
  meta?: {
    savedAt?: string;
    note?: string;
    settings?: {
      confirmDeleteNode?: boolean;
      confirmDeleteStaging?: boolean;
      enforceNoOverlap?: boolean;
      nodePadding?: number;
      showPadPreview?: boolean;
    };
  };
};

export function isSnapshot(x: any): x is Snapshot {
  return !!x &&
    x.version === 4 &&
    Array.isArray(x.nodes) &&
    Array.isArray(x.staging) &&
    Array.isArray(x.tracks) &&
    Array.isArray(x.bonuses);
}