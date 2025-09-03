// Link defaults & overrides
const LINK_CFG_KEY = 'iweb.linkcfg.v4';
const DEFAULT_LINK_CFG = {
  style: 'radial',
  outward: 60,
  curve: 0,
  laneSpacing: 12
};
function loadLinkCfg(){
  try{
    const raw = localStorage.getItem(LINK_CFG_KEY);
    if(raw) return { ...DEFAULT_LINK_CFG, ...JSON.parse(raw) };
  }catch(e){}
  return { ...DEFAULT_LINK_CFG };
}
function saveGlobalLinkCfg(){
  try{ localStorage.setItem(LINK_CFG_KEY, JSON.stringify(LINK_CFG)); }catch(e){}
}
let LINK_CFG = loadLinkCfg();

function linkKey(sourceId, targetId){ return `${sourceId}>${targetId}`; }

function ensureLinkEntryObject(sourceNode, targetId){
  const arr = sourceNode.links || (sourceNode.links = []);
  for (let i=0;i<arr.length;i++){
    const v = arr[i];
    if ((typeof v === 'string' && v === targetId) || (v && typeof v === 'object' && v.to === targetId)){
      if (typeof v === 'string'){ arr[i] = { to: v }; return arr[i]; }
      return v;
    }
  }
  const obj = { to: targetId };
  arr.push(obj);
  return obj;
}
function getLinkEntryObject(sourceNode, targetId){
  const arr = sourceNode.links || [];
  for (const v of arr){
    if (typeof v === 'object' && v.to === targetId) return v;
    if (typeof v === 'string' && v === targetId) return null;
  }
  return null;
}
function getLinkCfgObj(sourceId, targetId){
  const s = nodesById.get(sourceId); if(!s) return null;
  const entry = ensureLinkEntryObject(s, targetId);
  return entry.cfg || null;
}
function ensureLinkCfg(sourceId, targetId){
  const s = nodesById.get(sourceId); if(!s) return null;
  const entry = ensureLinkEntryObject(s, targetId);
  if (!entry.cfg) entry.cfg = { style: LINK_CFG.style, outward: LINK_CFG.outward, curve: LINK_CFG.curve };
  return entry.cfg;
}
function clearLinkCfg(sourceId, targetId){
  const s = nodesById.get(sourceId); if(!s) return;
  const entry = ensureLinkEntryObject(s, targetId);
  delete entry.cfg;
}
function effectiveCfgForLink(sourceId, targetId){
  const c = getLinkCfgObj(sourceId, targetId);
  return { ...LINK_CFG, ...(c || {}) };
}

/* Lane offsets */
let ANGLE_BINS = 36;
let laneOffsetMap = new Map();
function computeLinkLaneOffsets(){
  laneOffsetMap.clear();
  const spacing = (LINK_CFG?.laneSpacing ?? 12);
  const groups = new Map();

  links.forEach(l=>{
    const s=nodesById.get(l.source), t=nodesById.get(l.target);
    if(!s||!t) return;
    const thS = quantizeAngle(angleOf(s.x,s.y), ANGLE_BINS);
    const thT = quantizeAngle(angleOf(t.x,t.y), ANGLE_BINS);
    const key = `${thS.toFixed(3)}|${thT.toFixed(3)}`;
    if(!groups.has(key)) groups.set(key, []);
    groups.get(key).push(l);
  });

  groups.forEach(arr=>{
    arr.sort((a,b)=> (a.source+a.target).localeCompare(b.source+b.target));
    const n = arr.length, base = -(n-1)/2;
    arr.forEach((l,i)=> laneOffsetMap.set(linkKey(l.source,l.target), (base+i)*spacing));
  });
}

function getLinkPath(d){
  const s = nodesById.get(d.source), t = nodesById.get(d.target);
  if(!s||!t) return '';

  const cfg = effectiveCfgForLink(d.source, d.target);

  const E0 = { x: s.x, y: s.y };
  const E3 = { x: t.x, y: t.y };

  const ux = E3.x - E0.x, uy = E3.y - E0.y;
  const L  = Math.hypot(ux,uy) || 1;
  const u  = { x: ux/L, y: uy/L };
  const nChord = { x: -u.y, y: u.x };

  const M0 = { x:(E0.x+E3.x)/2, y:(E0.y+E3.y)/2 };

  const rvec = { x: M0.x - cx, y: M0.y - cy };
  const rlen = Math.hypot(rvec.x, rvec.y) || 1;
  const rdir = { x: rvec.x/rlen, y: rvec.y/rlen };
  const tau  = { x: -rdir.y, y: rdir.x };

  const laneOffset = laneOffsetMap.get(`${d.source}>${d.target}`) || 0;
  const laneShift  = { x: nChord.x * laneOffset, y: nChord.y * laneOffset };

  const thS = angleOf(s.x,s.y), thT = angleOf(t.x,t.y);
  const rS  = radiusOf(s.x,s.y), rT  = radiusOf(t.x,t.y);
  const vS  = spiralTangent(rS, thS);
  const vT  = spiralTangent(rT, thT);

  /* STRAIGHT: S-bend with curve (along local tangents) + outward (perp to chord, opposite at ends) */
  if (cfg.style === 'straight'){
    const k = cfg.curve;
    const o = cfg.outward;
    const c1 = {
      x: E0.x + vS.x*k + nChord.x*o + laneShift.x,
      y: E0.y + vS.y*k + nChord.y*o + laneShift.y
    };
    const c2 = {
      x: E3.x - vT.x*k - nChord.x*o + laneShift.x,
      y: E3.y - vT.y*k - nChord.y*o + laneShift.y
    };

    const p = d3.path();
    p.moveTo(E0.x, E0.y);
    p.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, E3.x, E3.y);
    return p.toString();
  }

  // RADIAL/SPIRAL
  const axis = (cfg.style === 'spiral') ? tau : rdir;
  const peak = {
    x: M0.x + axis.x * cfg.outward + u.x * cfg.curve + laneShift.x,
    y: M0.y + axis.y * cfg.outward + u.y * cfg.curve + laneShift.y
  };
  const c1 = { x: E0.x + (2/3)*(peak.x - E0.x), y: E0.y + (2/3)*(peak.y - E0.y) };
  const c2 = { x: E3.x + (2/3)*(peak.x - E3.x), y: E3.y + (2/3)*(peak.y - E3.y) };

  const p = d3.path();
  p.moveTo(E0.x, E0.y);
  p.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, E3.x, E3.y);
  return p.toString();
}
