export type LinkType = "straight" | "curved" | "corkscrew" | "bezier" | "spline";

export interface BaseLink {
  id: string;
  type: LinkType;
  from: string;
  to: string;
  color: string;
  stroke: "solid" | "dashed" | "dotted";
  // style options
  arrowHead?: boolean;
  // extra gap between node edge and link on both ends (world units)
  pad?: number;
}

export interface StraightLink extends BaseLink {
  type: "straight";
}

export interface CurvedLink extends BaseLink {
  type: "curved";
  midpoints: { x: number; y: number }[];
  // Percentage-based controls (0..100 for t, -100..100 for off)
  midControls?: { t: number; off: number }[];
}

// Two-handle cubic Bezier controlled in chord-percentage space
export interface BezierLink extends BaseLink {
  type: "bezier";
  c1: { t: number; off: number }; // 0..100, -100..100
  c2: { t: number; off: number };
  symmetric?: boolean;
}

// Multi-point smooth spline (Catmull-Rom → cubic Bezier)
export interface SplineLink extends BaseLink {
  type: "spline";
  controls: { t: number; off: number }[]; // 0..100, -100..100
  tension?: number; // 0..1 (0 = smoothest)
}

export interface SpiralLike {
  turns: number;
  startRadius: number;
  endRadius: number;
  direction: 1 | -1;
}

export interface CorkscrewLink extends BaseLink, SpiralLike {
  type: "corkscrew";
}

export type AnyLink = StraightLink | CurvedLink | BezierLink | SplineLink | CorkscrewLink;

export interface LinkDraftSettings {
  type: LinkType;
  color: string;
  stroke: "solid" | "dashed" | "dotted";
  arrowHead: boolean;
  pad: number;
  // for corkscrew
  turns?: number;
  startRadius?: number;
  endRadius?: number;
  direction?: 1 | -1;
  // for bezier
  c1?: { t: number; off: number };
  c2?: { t: number; off: number };
  symmetric?: boolean;
  // for spline
  controls?: { t:number; off:number }[];
  tension?: number;
}