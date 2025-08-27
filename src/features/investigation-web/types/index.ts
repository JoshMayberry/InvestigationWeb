export type LayoutKind = 'static' | 'dynamic';
export type LinkStyle = 'radial' | 'spiral' | 'straight';

export interface NodeStyle {
  fill?: string;
  stroke?: string;
  r?: number;          // radius (if using circles)
  class?: string;      // optional CSS class
}

export interface NodeDoc {
  id: string;
  title?: string;
  x?: number; y?: number;       // set by layout; may be preset for static
  tags?: string[];
  style?: NodeStyle;
  data?: Record<string, unknown>; // arbitrary domain data
  links?: Array<string | { to: string; cfg?: Partial<LinkCfg> }>;
}

export interface LinkCfg {
  style: LinkStyle;
  curve: number;
  outward: number;
}

export interface DocLink {
  id: string;
  source: string;
  target: string;
}

export interface LinkDefaults extends LinkCfg {
  laneSpacing: number;
}

export interface LayoutConfig {
  kind: LayoutKind;
  strategyId: string;             // 'spiral', 'rings', 'grid', 'force', ...
  options?: Record<string, unknown>;
}

export interface NavDoc {
  version: number;
  layout: LayoutConfig;
  linkDefaults: LinkDefaults;
  nodes: NodeDoc[];
}

/** Static track definition */
export interface TrackDef {
  id: string;
  /** Evaluate a point at 0..1 along the track */
  eval: (t: number) => { x: number; y: number };
  /** Optional: where labels should anchor */
  labelAt?: (t: number) => { x: number; y: number; anchor?: 'start'|'middle'|'end' };
}

/** For static layout: optional explicit slotting of a node onto a given track & order */
export interface StaticSlot {
  trackId: string;
  order?: number;          // relative ordering along that track; auto if omitted
}

export interface NodeWithSlot extends NodeDoc {
  slot?: StaticSlot | null;
}
