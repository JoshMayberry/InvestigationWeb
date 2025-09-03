import { resolveUnit } from "./units";
import type { Rect, Point } from "../types";
import { CompiledTrack, LayoutAny } from "../types/layout";
import { clamp, clamp01, lerp } from ".";

export function compileLayout(tree: LayoutAny, frame: Rect): CompiledTrack[] {
  const out: CompiledTrack[] = [];
  walk(tree, frame, out);
  return out;
}

function walk(node: LayoutAny, frame: Rect, out: CompiledTrack[]) {
  switch (node.type) {
    case "group":
      switch (node.kind) {
        case "row":
          const children = node.children || [];
          const gapPx = resolveUnit(node.props?.gap ?? 0, "w", frame);
          const n = Math.max(1, children.length);
          const totalGap = gapPx * (n - 1);
          const childW = Math.max(0, (frame.w - totalGap) / n);

          children.forEach((child, i) => {
            const childFrame: Rect = {
              x: frame.x + i * (childW + gapPx),
              y: frame.y,
              w: childW,
              h: frame.h
            };
            walk(child, childFrame, out);
          });
          break;

        default:
          console.warn("Unknown node type", {node});
          (node.children || []).forEach(ch => walk(ch, frame, out));
          break;
      }
      break; // add: prevent fallthrough from "group" into "track"

    case "track":
      switch (node.kind) {
        case "vline":
          const xLocal = resolveUnit(node.props?.x ?? "50%", "x", frame);
          const y1Local = resolveUnit(node.props?.y1 ?? "0%", "y", frame);
          const y2Local = resolveUnit(node.props?.y2 ?? "100%", "y", frame);

          const x = frame.x + xLocal;
          const y1 = frame.y + y1Local;
          const y2 = frame.y + y2Local;

          const yMin = Math.min(y1, y2);
          const yMax = Math.max(y1, y2);
          const L = Math.max(1e-6, (yMax - yMin));

          const track: CompiledTrack = {
            id: node.id,
            kind: "vline",
            color: node.props?.color,
            label: node.props?.label,
            snapT: node.props?.snapT ?? 0.5,
            eval(t: number): Point {
              const tt = clamp01(t);
              return { x, y: lerp(yMin, yMax, tt) };
            },
            project(trackId: string, p: Point) {
              const y = clamp(p.y, yMin, yMax);
              const t = (y - yMin) / L;
              const point = { x, y };
              const dx = p.x - x, dy = p.y - y;
              return { trackId, t, point, dist: Math.hypot(dx, dy) };
            }
          };
          out.push(track);
          break;

        default:
          console.warn("Unknown track type", {node});
          break;
      }
  }
}
