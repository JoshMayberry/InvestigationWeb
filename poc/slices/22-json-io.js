// JSON Open/Save
function exportPayload(){
  const serialized = nodes.map(n=>{
    const copy = {...n};
    copy.links = (n.links||[]).map(v=>{
      if (typeof v === 'string') return v;
      const out = { to: v.to };
      if (v.cfg) out.cfg = {...v.cfg};
      return out;
    });
    return copy;
  });
  return { version: 4, appMode, linkDefaults: LINK_CFG, nodes: serialized };
}
function saveState(){ try{ localStorage.setItem('investigationWeb.v4', JSON.stringify(exportPayload())); }catch(e){} }

function applyPayload(doc){
  if(!doc || !Array.isArray(doc.nodes)) throw new Error('Invalid JSON: expected { nodes: [...] }');

  if (doc.linkDefaults){
    LINK_CFG = { ...DEFAULT_LINK_CFG, ...doc.linkDefaults };
    saveGlobalLinkCfg();
  }

  nodes = doc.nodes.map(n=>{
    const m={...n};
    m.dc ??= null; m.test ??= null; m.tags ??= [];
    m.links = (m.links||[]).map(v=>{
      if (typeof v === 'string') return v;
      return { to: v.to, cfg: v.cfg ? { ...v.cfg } : undefined };
    });
    m.fixed = !!m.fixed;
    m.unlocked = !!m.unlocked;
    m.initiallyHidden = !!m.initiallyHidden;
    return m;
  });

  nodes.forEach(n=>{
    if(n.fixed && typeof n.boundary==='number'){
      const p=anchorXYBoundary(n.boundary,n.tier);
      n.x=p.x; n.y=p.y;
    }
  });

  layoutNodes(nodes);
  nodesById = new Map(nodes.map(n=>[n.id,n]));
  rebuildLinks();

  const validMode = v => Object.values(MODES).includes(v);
  const remembered = localStorage.getItem(MODE_KEY);
  const fileMode   = doc.appMode;
  let nextMode = appMode;
  if (validMode(remembered)) nextMode = remembered; else if (validMode(fileMode)) nextMode = fileMode;
  setMode(nextMode);
  updateBonuses();
}

/* Save / Load buttons */
document.getElementById('btnSave').addEventListener('click', ()=>{
  const blob=new Blob([JSON.stringify(exportPayload(),null,2)], {type:'application/json'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='three-virtues-web.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

const fileOpen = document.getElementById('fileOpen');
document.getElementById('btnOpen').addEventListener('click', ()=> fileOpen.click());
fileOpen.addEventListener('change', async ev=>{
  const f=ev.target.files && ev.target.files[0]; if(!f) return;
  try{
    const text = await f.text();
    const doc  = JSON.parse(text);
    applyPayload(doc);
  }catch(e){
    alert('Invalid JSON: ' + e.message);
  }finally{
    ev.target.value='';
  }
});
