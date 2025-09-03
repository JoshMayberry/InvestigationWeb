// Helpers
const tierFrac = { center:0, deep:1/3, mid:2/3, shallow:1 };
const segByTier = { deep:0, mid:1, shallow:2 };
const tierLAdj  = { shallow:+0.14, mid:0, deep:-0.12, center:-0.2 };

function pointAt(pathEl, t){ const L = pathEl.getTotalLength(); return pathEl.getPointAtLength(Math.max(0, Math.min(L, t*L))); }
function angleOf(x,y){ return Math.atan2(y - cy, x - cx); }
function angleDist(a,b){ let d=a-b; while(d> Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return Math.abs(d); }
const clamp01 = v => Math.max(0, Math.min(1, v));
function radiusOf(x,y){ return Math.hypot(x - cx, y - cy); }
function toXY(r, th){ return { x: cx + r*Math.cos(th), y: cy + r*Math.sin(th) }; }
function midAngle(a,b){ let d=b-a; while(d> Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return a+d/2; }

/* --- Map wedge detection (absolute position) --- */
const WEDGE_CENTERS = [ -Math.PI/2, Math.PI/6, 5*Math.PI/6 ]; // E (top), H (bottom-right), R (bottom-left)
function wedgeAt(x,y){
  const th = angleOf(x,y);
  let best=0, bestD=Infinity;
  for(let i=0;i<3;i++){
    const d=angleDist(th, WEDGE_CENTERS[i]);
    if(d<bestD){bestD=d; best=i;}
  }
  return best; // 0:E, 1:H, 2:R
}

/* --- Link geometry (center-to-center) --- */
const NODE_R = 12;
function quantizeAngle(theta, lanes = 24){ const step = (2*Math.PI) / lanes; return Math.round(theta / step) * step; }
// Spiral tangent at (r, theta) for r = r0 + k * theta
function spiralTangent(r, th){
  const dx = k*Math.cos(th) - r*Math.sin(th);
  const dy = k*Math.sin(th) + r*Math.cos(th);
  const m = Math.hypot(dx,dy) || 1;
  return { x: dx/m, y: dy/m };
}
