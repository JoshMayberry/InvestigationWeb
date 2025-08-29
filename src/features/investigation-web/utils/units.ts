// utils/units.ts
import type { Unit, Rect } from "../types";

export function resolveUnit(u: Unit | undefined, axis: "x"|"y"|"w"|"h", frame: Rect): number {
  if (u == null) return 0;
  if (typeof u === "number") return u;

  const s = String(u).trim();
  if (s.endsWith("%")) {
    const pct = parseFloat(s) / 100;
    const base = (axis === "x" || axis === "w") ? frame.w : frame.h;
    return pct * base;
  }
  if (s.endsWith("px")) {
    return parseFloat(s);
  }
  // simple numbers as px
  const n = Number(s);
  if (!Number.isNaN(n)) return n;

  // fallback: treat unknown units as 0
  return 0;
}
