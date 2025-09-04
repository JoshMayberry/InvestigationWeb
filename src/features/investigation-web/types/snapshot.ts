import type { Bonus } from "./bonus";

export type Snapshot = {
  version: 2;
  nodes: Array<{
    id: string;
    kind: "free";
    x: number;
    y: number;
    r: number;
    color?: string;
    label?: string;
  }>;
  bonuses: Bonus[];
  meta?: {
    savedAt?: string;
    note?: string;
  };
};

export function isSnapshot(x: any): x is Snapshot {
  return x &&
    x.version === 2 &&
    Array.isArray(x.nodes) &&
    Array.isArray(x.bonuses);
}