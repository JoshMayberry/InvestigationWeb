import type { Component } from "vue";
import StraightLinkCanvas from "./links/StraightLinkCanvas.vue";
import CurvedLinkCanvas from "./links/CurvedLinkCanvas.vue";
import BezierLinkCanvas from "./links/BezierLinkCanvas.vue";
import SplineLinkCanvas from "./links/SplineLinkCanvas.vue";
import CorkscrewLinkCanvas from "./links/CorkscrewLinkCanvas.vue";
import SpiralLinkCanvas from "./links/SpiralLinkCanvas.vue";

import StraightEditor from "./editors/StraightEditor.vue";
import CurvedEditor from "./editors/CurvedEditor.vue";
import BezierEditor from "./editors/BezierEditor.vue";
import SplineEditor from "./editors/SplineEditor.vue";
import CorkscrewEditor from "./editors/CorkscrewEditor.vue";
import SpiralEditor from "./editors/SpiralEditor.vue";

export interface PathTypeDef {
  id: string;
  label: string;
  linkCanvas: Component;
  editor?: Component;
  defaults?: Record<string, any>;
}

const defs: Record<string, PathTypeDef> = {
  straight: { id:"straight", label:"Straight", linkCanvas: StraightLinkCanvas, editor: StraightEditor, defaults:{ stroke:"solid", arrowHead:false, pad:0 } },
  curved:   { id:"curved",   label:"Curved",   linkCanvas: CurvedLinkCanvas,   editor: CurvedEditor,   defaults:{ stroke:"solid", pad:0, midControls: [] } },
  bezier:   { id:"bezier",   label:"Bezier",   linkCanvas: BezierLinkCanvas,   editor: BezierEditor,   defaults:{ stroke:"solid", pad:0, c1:{t:25,off:30}, c2:{t:75,off:-30}, symmetric:false } },
  spline:   { id:"spline",   label:"Spline",   linkCanvas: SplineLinkCanvas,   editor: SplineEditor,   defaults:{ stroke:"solid", pad:0, tension:0.25, controls:[{t:50,off:0}] } },
  corkscrew:{ id:"corkscrew",label:"Corkscrew",linkCanvas: CorkscrewLinkCanvas, editor: CorkscrewEditor, defaults:{ stroke:"solid", pad:0, turns:3, direction:1, startRadius:10, endRadius:60 } },
  spiral:   { id:"spiral",   label:"Spiral",   linkCanvas: SpiralLinkCanvas,   editor: SpiralEditor,   defaults:{ stroke:"solid", pad:0, turns:3, direction:1, startRadius:10, endRadius:60 } },
};

export function getPathType(type: string | undefined | null): PathTypeDef {
  return defs[type || ""] || defs.straight;
}
export function listPathTypes(): PathTypeDef[] {
  return Object.values(defs);
}