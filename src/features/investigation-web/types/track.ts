export type TrackKind = "free" | "calc";
export type TrackType = "straight" | "curved" | "bezier" | "spline" | "corkscrew" | "spiral" | "path";

export interface TrackBase {
  id: string;
  kind: TrackKind;
  type: TrackType;
  color?: string;
  locked?: boolean;
  segments?: number; // NEW
}

export interface FreeTrack extends TrackBase {
  p1: { x: number; y: number };
  p2: { x: number; y: number };
  // Optional type-specific data (mirrors link variants)
  midControls?: { t:number; off:number }[];      // curved
  midpoints?: { x:number; y:number }[];          // curved (legacy form)
  c1?: { t:number; off:number };                 // bezier
  c2?: { t:number; off:number };
  symmetric?: boolean;                           // bezier
  controls?: { t:number; off:number }[];         // spline
  tension?: number;                              // spline
  turns?: number;                                // corkscrew / spiral
  startRadius?: number;
  endRadius?: number;
  direction?: 1 | -1;
  extra?: Record<string, any> // NEW (for additional fields)
}

export type TrackAny = FreeTrack;