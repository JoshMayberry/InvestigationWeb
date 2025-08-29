import { Point, Unit } from ".";

export type GroupKind = "row" | "column" | "overlay" | "polar";
export type LayoutGroup = {
  type: "group";
  id?: string;
  kind: GroupKind;
  props?: {
    gap?: Unit;
    padding?: Unit;
    align?: "start"|"center"|"end"|"stretch";
    sizes?: (Unit | "auto")[];
  };
  children: LayoutAny[];
}

export type TrackKind = "vline" | "hline" | "angle" | "ring" | "spiral" | "segment";
export type LayoutTrack = {
  type: "track";
  id: string;
  kind: TrackKind;
  props?: {
    // vline-specific
    x?: Unit;
    y1?: Unit;
    y2?: Unit;

    color?: string;
    label?: string;
    snapT?: number;
    z?: number;
  };
};

export type LayoutAny = LayoutGroup | LayoutTrack;

export interface Projection {
  trackId: string;    // Which track this projection is for
  t: number;          // 0..1 on the track
  point: Point;       // closest point on the track
  dist: number;       // Euclidean distance
}

export interface CompiledTrack {
  id: string;
  kind: TrackKind;
  color?: string;
  label?: string;
  snapT?: number;
  eval(t:number): Point;      // param -> point
  project?(trackId: string, p:Point): Projection; // point -> nearest (optional for non-snapping kinds at first)
}
