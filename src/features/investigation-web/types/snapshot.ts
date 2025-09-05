import type { Bonus } from "./bonus";
import type { NodeAny } from "./node";

export type Snapshot = {
  version: 3;
  nodes: any[];
  staging: any[];
  bonuses: any[];
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
    x.version === 3 &&
    Array.isArray(x.nodes) &&
    Array.isArray(x.staging) &&
    Array.isArray(x.bonuses);
}