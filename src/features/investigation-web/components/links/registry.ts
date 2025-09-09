import type { Component } from "vue";
import StraightCanvas from "./types/StraightCanvas.vue";
import CurvedCanvas from "./types/CurvedCanvas.vue";
import BezierCanvas from "./types/BezierCanvas.vue";
import SplineCanvas from "./types/SplineCanvas.vue";
import CorkscrewCanvas from "./types/CorkscrewCanvas.vue";
import SpiralCanvas from "./types/SpiralCanvas.vue";

import StraightEditor from "./editors/StraightEditor.vue";
import CurvedEditor from "./editors/CurvedEditor.vue";
import BezierEditor from "./editors/BezierEditor.vue";
import SplineEditor from "./editors/SplineEditor.vue";
import CorkscrewEditor from "./editors/CorkscrewEditor.vue";
import SpiralEditor from "./editors/SpiralEditor.vue";

export interface LinkTypeDef {
  id: string;
  label: string;
  canvas: Component;
  editor?: Component;
  defaults?: Record<string, any>;
}

const defs: Record<string, LinkTypeDef> = {
  straight: { id:"straight", label:"Straight", canvas: StraightCanvas, editor: StraightEditor, defaults:{ stroke:"solid", arrowHead:false, pad:0 } },
  curved:   { id:"curved",   label:"Curved",   canvas: CurvedCanvas,   editor: CurvedEditor,   defaults:{ stroke:"solid", pad:0, midControls: [] } },
  bezier:   { id:"bezier",   label:"Bezier",   canvas: BezierCanvas,   editor: BezierEditor,   defaults:{ stroke:"solid", pad:0, c1:{t:25,off:30}, c2:{t:75,off:-30}, symmetric:false } },
  spline:   { id:"spline",   label:"Spline",   canvas: SplineCanvas,   editor: SplineEditor,   defaults:{ stroke:"solid", pad:0, tension:0.25, controls:[{t:50,off:0}] } },
  corkscrew:{ id:"corkscrew",label:"Corkscrew",canvas: CorkscrewCanvas, editor: CorkscrewEditor, defaults:{ stroke:"solid", pad:0, turns:3, direction:1, startRadius:10, endRadius:60 } },
  spiral:   { id:"spiral",   label:"Spiral",   canvas: SpiralCanvas,   editor: SpiralEditor,   defaults:{ stroke:"solid", pad:0, turns:3, direction:1, startRadius:10, endRadius:60 } },
};

export function getLinkType(type: string | undefined | null): LinkTypeDef {
  return defs[type || ""] || defs.straight;
}
export function listLinkTypes(): LinkTypeDef[] {
  return Object.values(defs);
}