// Spiral geometry
const startAngles = [ -Math.PI/6, Math.PI/2, -5*Math.PI/6 ]; // Endurance, Harmony, Remembrance
const virtueIndex = { Endurance:0, Harmony:1, Remembrance:2 };
const ONE_TURN = 2*Math.PI, r0 = 30, k = 55, N = 240;

function segmentPath(start, f0, f1){
  const line=d3.line().curve(d3.curveCatmullRom.alpha(0.7));
  const i0=Math.round(f0*(N-1)), i1=Math.round(f1*(N-1));
  const pts=[];
  for(let i=i0;i<=i1;i++){
    const t=(i/(N-1))*ONE_TURN, th=start+t, r=r0+k*t;
    pts.push([cx + r*Math.cos(th), cy + r*Math.sin(th)]);
  }
  return line(pts);
}
startAngles.forEach((start,i)=>{ [[0,1/3],[1/3,2/3],[2/3,1]].forEach((fr, idx)=>{ root.append('path').attr('id',`spiral-${i}-${idx}`).attr('d',segmentPath(start,fr[0],fr[1])).attr('fill','none').attr('stroke','none').attr('opacity',0).attr('pointer-events','none'); }); });

/* Edit wash visuals */
const washColors = ['var(--endurance)','var(--harmony)','var(--remembrance)'];
const gWashSegs = [];
startAngles.forEach((start,i)=>{ [[0,1/3],[1/3,2/3],[2/3,1]].forEach((fr, idx)=>{
  const p = segmentPath(start,fr[0],fr[1]);
  const path = gWash.append('path').attr('class','edit-wash').attr('data-seg',`${i}-${idx}`).attr('d',p).attr('stroke',washColors[i]).style('display','none');
  gWashSegs.push(path.node());
}); });
function setEditWashVisible(v){ gWash.selectAll('path.edit-wash').style('display', v? '':'none'); }

/* ===== STAGING LANES (Edit-only) ============================================ */
const STAGING = {
  dirs: ['N','E','S','W'],
  lanes: {N:[],E:[],S:[],W:[]},
  len: Math.min(w,h)*0.6,
  margin: 70,
  gap: 60,
};
const ONE_TURN_R = r0 + k*ONE_TURN;
function stagingLineEndpoints(dir, idx){
  const L = STAGING.len;
  const base = ONE_TURN_R + STAGING.margin + idx*STAGING.gap;
  if (dir==='N'){ const y = cy - base; return {x1: cx - L/2, y1: y, x2: cx + L/2, y2: y}; }
  if (dir==='S'){ const y = cy + base; return {x1: cx - L/2, y1: y, x2: cx + L/2, y2: y}; }
  if (dir==='E'){ const x = cx + base; return {x1: x, y1: cy - L/2, x2: x, y2: cy + L/2}; }
  const x = cx - base; return {x1: x, y1: cy - L/2, x2: x, y2: cy + L/2}; // W
}
function refreshGWashSegs(){
  gWashSegs.length = 0;
  gWash.selectAll('path.edit-wash').each(function(){ gWashSegs.push(this); });
}
function ensureLaneExists(dir, idx){
  if (STAGING.lanes[dir][idx]) return STAGING.lanes[dir][idx];
  const id = `staging-${dir}-${idx}`;
  const {x1,y1,x2,y2} = stagingLineEndpoints(dir, idx);
  const path = gWash.append('path')
    .attr('id', id)
    .attr('class','edit-wash staging-wash')
    .attr('data-seg', id)
    .attr('data-kind','staging')
    .attr('data-dir',dir)
    .attr('data-index',idx)
    .attr('d', `M${x1},${y1}L${x2},${y2}`)
    .attr('stroke','#5e6db7')
    .style('display','none');
  STAGING.lanes[dir][idx] = path.node();
  refreshGWashSegs();
  return STAGING.lanes[dir][idx];
}
function initStaging(){ ['N','E','S','W'].forEach(dir=> ensureLaneExists(dir,0)); refreshGWashSegs(); }
initStaging();

/* Compact lanes so there’s exactly ONE empty lane at the end per direction. */
function ensureStagingConsistency(){
  ['N','E','S','W'].forEach(dir=>{
    const used = nodes.filter(n=> n.staging && n.staging.dir===dir).map(n=> n.staging.lane);
    const uniqUsed = Array.from(new Set(used)).sort((a,b)=>a-b);
    const map = new Map(uniqUsed.map((old,i)=>[old,i]));
    nodes.forEach(n=>{ if(n.staging && n.staging.dir===dir){ n.staging.lane = map.get(n.staging.lane) ?? 0; } });
    const needed = uniqUsed.length + 1;
    for(let i=0;i<needed;i++) ensureLaneExists(dir,i);
    const arr = STAGING.lanes[dir];
    for(let i=arr.length-1; i>=needed; i--){ d3.select(arr[i]).remove(); arr.pop(); }
  });
  refreshGWashSegs();
}
