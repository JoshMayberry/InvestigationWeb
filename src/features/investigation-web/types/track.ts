export type TrackKind = "free" | "calc";

export interface TrackBase {
  id: string;
  kind: TrackKind;
  color?: string;
  locked?: boolean;
}

export interface FreeTrack extends TrackBase {
  kind: "free";
  p1: { x: number; y: number };
  p2: { x: number; y: number };
}

export type TrackAny = FreeTrack;