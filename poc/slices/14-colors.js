// Colors
const wedgeBaseHex = ['#e74c3c','#fdd835','#1e90ff']; // Endurance, Harmony, Remembrance
const wedgeBaseHSL = wedgeBaseHex.map(h => d3.hsl(d3.color(h)));

const CENTER_ANGLES  = startAngles.map(a => a + Math.PI/3);
const BOUNDARY_ANGLES = [
  midAngle(CENTER_ANGLES[0], CENTER_ANGLES[1]),
  midAngle(CENTER_ANGLES[1], CENTER_ANGLES[2]),
  midAngle(CENTER_ANGLES[2], CENTER_ANGLES[0]),
];

const boundaryBaseHex = ['#2ECC71','#F6841F','#8B57B4'];
const boundaryBaseHSL = boundaryBaseHex.map(h => d3.hsl(d3.color(h)));

function shadeTier(baseHsl,tier){ const l = clamp01(baseHsl.l + (tierLAdj[tier]||0)); return d3.hsl(baseHsl.h, baseHsl.s, l); }
function toHex(hsl){ return d3.hsl(hsl.h, hsl.s, hsl.l).formatHex(); }

function nodeColorHSL(d){
  const boundaryColor = d.fixed ? boundaryBaseHSL[d.bridge] : null;
  if (appMode === MODES.EDIT){
    if (boundaryColor) return boundaryColor;
    const idx = wedgeAt(d.x, d.y);
    return shadeTier(wedgeBaseHSL[idx], d.tier);
  }
  if (appMode === MODES.PLAYER && !d.unlocked) return d3.hsl(225, 0.15, 0.55);
  if (boundaryColor) return boundaryColor;
  const idx = wedgeAt(d.x, d.y);
  return shadeTier(wedgeBaseHSL[idx], d.tier);
}
function nodeColor(d){ return toHex(nodeColorHSL(d)); }
function linkColor(d){ const s = nodesById.get(d.source); const idx=wedgeAt(s.x,s.y); return toHex(wedgeBaseHSL[idx]); }
