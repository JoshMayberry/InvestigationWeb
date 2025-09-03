// Edit mode: link pills, drag/link, ID rename, etc.
const f_id=document.getElementById('f_id');
const f_title=document.getElementById('f_title');
const f_virtue=document.getElementById('f_virtue');
const f_tier=document.getElementById('f_tier');
const f_source=document.getElementById('f_source');
const f_bridge=document.getElementById('f_bridge');
const f_text=document.getElementById('f_text');
const f_dc=document.getElementById('f_dc');
const f_test=document.getElementById('f_test');
const f_bonus=document.getElementById('f_bonus');
const f_tags=document.getElementById('f_tags');
const f_loreUrl=document.getElementById('f_loreUrl');
const f_initiallyHidden=document.getElementById('f_initiallyHidden');
const editHelp=document.getElementById('editHelp');
const linksWrap=document.getElementById('f_linksWrap');

/* ===== Link panel UI ===== */
const linkPanel = document.getElementById('linkPanel');
const ui = {
  override: document.getElementById('link_override'),
  style : document.getElementById('link_style'),
  curve : document.getElementById('link_curve'),
  out   : document.getElementById('link_outward'),
  lane  : document.getElementById('cfg_lane_space'),
  reset : document.getElementById('btnResetLinkCfg'),
  note  : document.getElementById('linkPanelNote')
};

function parseLinkId(id){
  if(!id) return null;
  const i = id.indexOf('>');
  if (i<0) return null;
  return { source:id.slice(0,i), target:id.slice(i+1) };
}

function setLinkControlsEnabled(enabled){
  ui.style.disabled = !enabled;
  ui.curve.disabled = !enabled;
  ui.out.disabled   = !enabled;
}

function syncLinkUIForLink(){
  if(!linkPanel) return;
  linkPanel.style.display = (appMode===MODES.EDIT) ? '' : 'none';

  // Lane spacing is always global
  ui.lane.value = LINK_CFG.laneSpacing;

  const meta = parseLinkId(selectedLinkId);

  if(!meta){
    // No link selected → edit global defaults
    ui.override.checked = false;
    ui.override.disabled = true;
    setLinkControlsEnabled(true);
    ui.style.value = LINK_CFG.style;
    ui.curve.value = LINK_CFG.curve;
    ui.out.value   = LINK_CFG.outward;
    ui.note.textContent = 'No link selected → controls edit global defaults.';
    return;
  }

  ui.override.disabled = false;
  const hasOverride = !!getLinkCfgObj(meta.source, meta.target);
  ui.override.checked = hasOverride;

  const eff = effectiveCfgForLink(meta.source, meta.target);
  ui.style.value = eff.style;
  ui.curve.value = eff.curve;
  ui.out.value   = eff.outward;

  setLinkControlsEnabled(hasOverride);
  ui.note.textContent = hasOverride
    ? 'Editing this link override.'
    : 'This link uses global defaults (controls disabled until you enable override).';
}

function applyFormToGlobal(){
  LINK_CFG.style       = ui.style.value;
  LINK_CFG.curve       = +ui.curve.value;
  LINK_CFG.outward     = +ui.out.value;
  saveGlobalLinkCfg();
}
function applyFormToSelectedLink(){
  const meta = parseLinkId(selectedLinkId); if(!meta) return;
  const cfg = ensureLinkCfg(meta.source, meta.target);
  cfg.style   = ui.style.value;
  cfg.curve   = +ui.curve.value;
  cfg.outward = +ui.out.value;
  saveState();
}

function onAnyLinkControlChanged(e){
  if (e && e.target === ui.lane){
    LINK_CFG.laneSpacing = +ui.lane.value;
    saveGlobalLinkCfg();
    drawLinks();
    return;
  }
  const meta = parseLinkId(selectedLinkId);
  if (!meta){
    applyFormToGlobal();
  } else {
    if (ui.override.checked){
      applyFormToSelectedLink();
    } // else controls are disabled so no change
  }
  drawLinks();
}

/* Listeners */
if(linkPanel){
  ui.override.addEventListener('change', ()=>{
    const meta = parseLinkId(selectedLinkId);
    if(!meta){ syncLinkUIForLink(); return; }
    if(ui.override.checked){
      ensureLinkCfg(meta.source, meta.target); // seed from current global
      saveState();
    }else{
      clearLinkCfg(meta.source, meta.target);
      saveState();
    }
    syncLinkUIForLink();
    drawLinks();
  });

  [ui.style, ui.curve, ui.out].forEach(el=>{
    el.addEventListener('input', onAnyLinkControlChanged);
  });
  ui.lane.addEventListener('input', onAnyLinkControlChanged);

  ui.reset.addEventListener('click', ()=>{
    const meta = parseLinkId(selectedLinkId);
    if (meta && ui.override.checked){
      const cfg = ensureLinkCfg(meta.source, meta.target);
      cfg.style   = DEFAULT_LINK_CFG.style;
      cfg.curve   = DEFAULT_LINK_CFG.curve;
      cfg.outward = DEFAULT_LINK_CFG.outward;
      saveState();
      syncLinkUIForLink();
      drawLinks();
    } else {
      LINK_CFG = { ...DEFAULT_LINK_CFG };
      saveGlobalLinkCfg();
      syncLinkUIForLink();
      drawLinks();
    }
  });
}

/* ===== Link pills (Edit) ===== */
function populateLinkPills(n){
  if (!linksWrap) return;
  linksWrap.innerHTML = '';
  const entries = (n.links||[]).map(v => (typeof v==='string' ? {to:v} : v));
  if (entries.length === 0){
    const empty = document.createElement('div');
    empty.className = 'note';
    empty.textContent = 'No links yet. Shift+drag from this node to add.';
    linksWrap.appendChild(empty);
    return;
  }
  entries.forEach(entry=>{
    const tid = entry.to;
    const target = nodesById.get(tid);
    const chip = document.createElement('span');
    chip.className = 'link-chip';
    chip.textContent = target ? target.title : `(missing: ${tid})`;
    chip.title = target ? `${n.title} → ${target.title}` : `Broken link to ${tid}`;

    const lk = linkKey(n.id, tid);
    if (lk === selectedLinkId) chip.classList.add('selected');

    chip.addEventListener('click', (ev)=>{
      if (ev.shiftKey){
        // remove this link
        n.links = (n.links||[]).filter(v => (typeof v==='string' ? v !== tid : v.to !== tid));
        if (selectedLinkId === lk) selectedLinkId = null;
        rebuildLinks(); saveState(); refreshAll();
        populateLinkPills(n); // refresh pills & highlight
        syncLinkUIForLink();
      } else {
        // toggle selection for this pill (only one at a time)
        selectedLinkId = (selectedLinkId === lk) ? null : lk;
        // re-render highlights
        linksWrap.querySelectorAll('.link-chip').forEach(el=> el.classList.remove('selected'));
        if (selectedLinkId === lk) chip.classList.add('selected');
        syncLinkUIForLink();
        drawLinks();
      }
    });

    linksWrap.appendChild(chip);
  });
}

/* ===== Edit form (node fields) ===== */
function populateEditForm(n){
  if(appMode!==MODES.EDIT) return;
  if(!n){
    editHelp.textContent='Select a node to edit.';
    if (linksWrap) linksWrap.innerHTML='';
    lockEditButtons(true, true);
    syncLinkUIForLink();
    return;
  }

  f_id.value=n.id||'';
  f_title.value=n.title||'';
  f_virtue.value=n.virtue;
  f_tier.value=n.tier;
  f_source.value=n.source||'';
  f_bridge.value=n.bridge||'';
  f_text.value=n.text||'';
  f_dc.value=n.dc??'';
  f_test.value=n.test||'';
  f_bonus.value=n.bonus||'';
  f_tags.value=(n.tags||[]).join(', ');
  f_loreUrl.value=n.loreUrl||'';
  f_initiallyHidden.checked = !!n.initiallyHidden;

  populateLinkPills(n);

  const hasPrereqs = (incomingMap.get(n.id)||[]).length>0;
  editHelp.textContent = `${(n.initiallyHidden && !hasPrereqs)?'Note: initiallyHidden has no effect without prerequisites (incoming links). ':''}${n.fixed?'Drag this transition onto another transition to swap slots.':''}`;
  lockEditButtons(n.tier==='center', n.fixed);
}
function lockEditButtons(disableAddForCenter, disableDeleteForTransition){
  document.getElementById('btnAddNode').disabled = !!disableAddForCenter;
  document.getElementById('btnDeleteNode').disabled = !!disableDeleteForTransition;
}

/* --- ID rename (with link remap) --- */
function renameNodeId(node, newId){
  const oldId = node.id;
  const id = (newId||'').trim();
  if (!id){ editHelp.textContent='ID cannot be empty.'; return false; }
  if (id === oldId) return true;
  if (nodes.some(n=> n!==node && n.id===id)){ editHelp.textContent='That ID is already in use.'; return false; }

  nodes.forEach(n=>{
    if(!Array.isArray(n.links)) return;
    n.links = n.links.map(v=>{
      if (typeof v==='string') return (v===oldId) ? id : v;
      return { to: v.to===oldId ? id : v.to, cfg: v.cfg ? {...v.cfg} : undefined };
    });
  });

  node.id = id;

  nodesById = new Map(nodes.map(n=>[n.id,n]));
  selectedLinkId = null;
  rebuildLinks();
  refreshAll();
  saveState();
  syncLinkUIForLink();
  editHelp.textContent='ID updated.';
  return true;
}
if (f_id){
  f_id.addEventListener('change', ()=>{
    if(!selectedNode) return;
    renameNodeId(selectedNode, f_id.value);
  });
}

[f_title,f_virtue,f_tier,f_source,f_bridge,f_text,f_dc,f_test,f_bonus,f_tags,f_loreUrl,f_initiallyHidden].forEach(el=>{
  if(!el) return;
  el.addEventListener('input', ()=>{
    if(!selectedNode) return;
    const n=selectedNode;
    if(el===f_title) n.title=el.value;
    if(el===f_virtue) n.virtue=el.value;
    if(el===f_tier) n.tier=el.value;
    if(el===f_source) n.source=el.value;
    if(el===f_bridge) n.bridge= el.value===''?null: parseInt(el.value,10);
    if(el===f_text) n.text=el.value;
    if(el===f_dc) n.dc = el.value===''?null: parseInt(el.value,10);
    if(el===f_test) n.test=el.value;
    if(el===f_bonus) n.bonus=el.value;
    if(el===f_tags) n.tags = el.value.split(',').map(s=>s.trim()).filter(Boolean);
    if(el===f_loreUrl) n.loreUrl=el.value;
    if(el===f_initiallyHidden) n.initiallyHidden = !!el.checked;

    layoutNodes(nodes);
    refreshAll();
    saveState();
  });
});

document.getElementById('btnAddNode').addEventListener('click', ()=>{
  if(!selectedNode) return;

  let v=selectedNode.virtue, t=selectedNode.tier;
  if(selectedNode.fixed){
    const order=['shallow','mid','deep','center']; const idx=order.indexOf(selectedNode.tier);
    if(idx<=0){ return; }
    t = order[idx-1]; v = selectedNode.virtue;
  }
  if(t==='center'){ return; }

  const newId = `node-${Math.random().toString(36).slice(2,8)}-${Date.now().toString(36)}`;
  const nn={ id:newId, title:'New Node', virtue:v, tier:t, source:'—', text:'', dc:null, test:null, bonus:null, tags:[], loreUrl:null, unlocked:false, links:[], initiallyHidden:false };

  if(selectedNode.staging && typeof selectedNode.staging.lane==='number'){
    nn.staging = { dir: selectedNode.staging.dir, lane: selectedNode.staging.lane };
  }

  nodes.push(nn);
  layoutNodes(nodes);
  refreshAll();
  selectNode(nn);
  saveState();
});

document.getElementById('btnDeleteNode').addEventListener('click', ()=>{
  if(!selectedNode || selectedNode.fixed) return;
  const id=selectedNode.id;
  nodes = nodes.filter(n=> n.id!==id);
  nodes.forEach(n=>{
    n.links = (n.links||[]).filter(v=> (typeof v==='string' ? v !== id : v.to !== id));
  });
  layoutNodes(nodes); refreshAll(); selectedNode=null; populateEditForm(null); saveState();
});

/* --- Transition swap helper --- */
function swapTransitionSlots(a,b){
  const A={boundary:a.boundary, tier:a.tier};
  const B={boundary:b.boundary, tier:b.tier};

  a.boundary=B.boundary; a.tier=B.tier;
  b.boundary=A.boundary; b.tier=A.tier;

  const pa=anchorXYBoundary(a.boundary, a.tier); a.x=pa.x; a.y=pa.y;
  const pb=anchorXYBoundary(b.boundary, b.tier); b.x=pb.x; b.y=pb.y;
}

/* Drag & link */
let addLinkState = null;
let ghost = null; let ghostLink = null; let candidateSeg = null;
let draggingFixed = false; let swapTarget = null;
const SWAP_R_TIER = { center: 46, deep: 52, mid: 52, shallow: 52 };

function createGhost(){ if(ghost) return; ghost = gNodes.append('g').attr('class','ghost-node invalid').style('display','none'); ghost.append('circle').attr('class','dot').attr('r',12).attr('fill','none').attr('stroke','#d37f7f'); }
function showGhost(x,y,valid,isTransition=false){
  if(!ghost){ createGhost(); }
  ghost.style('display','')
    .attr('transform',`translate(${x},${y})`)
    .classed('valid', !!valid).classed('invalid', !valid)
    .classed('transition', !!isTransition);
}
function hideGhost(){ if(ghost) ghost.style('display','none'); }
function setWashHighlight(segId){ gWash.selectAll('path.edit-wash').classed('highlight', function(){ return this.getAttribute('data-seg')===segId; }); }

function nearestSegmentPoint(mx,my){
  let best=null; const THRESH=20;
  gWashSegs.forEach(p=>{
    const L=p.getTotalLength();
    let bestLocal={d:Infinity,t:0,pt:null};
    const steps=64;
    for(let i=0;i<=steps;i++){
      const t=i/steps; const pt=p.getPointAtLength(t*L);
      const d=Math.hypot(mx-pt.x, my-pt.y);
      if(d<bestLocal.d){ bestLocal={d,t,pt}; }
    }
    if(bestLocal.d<THRESH){
      const kind = p.getAttribute('data-kind') || 'spiral';
      const segId= p.getAttribute('data-seg');
      if(kind === 'staging'){
        const dir  = p.getAttribute('data-dir');
        const idx  = +p.getAttribute('data-index');
        best = { kind:'staging', segId, p:{x:bestLocal.pt.x, y:bestLocal.pt.y}, t:bestLocal.t, dir, lane: idx };
      }else{
        const [vi,si] = segId.split('-').map(Number);
        const virtue  = ['Endurance','Harmony','Remembrance'][vi];
        const tier    = ['deep','mid','shallow'][si];
        best = { kind:'spiral', segId, p:{x:bestLocal.pt.x, y:bestLocal.pt.y}, t:bestLocal.t, virtue, tier };
      }
    }
  });
  return best;
}

function setupDragBehavior(){
  gNodes.selectAll('g.node').on('.drag', null);
  if (appMode !== MODES.EDIT) return;

  const sel = gNodes.selectAll('g.node');

  const dragBehavior = d3.drag()
    .filter(function(){ return true; })
    .on('start', function(ev){
      const d = this.__data__;
      if (ev.sourceEvent && ev.sourceEvent.shiftKey){
        addLinkState = { from:d, to:null };
        if(!ghostLink) ghostLink = gLinks.append('path').attr('class','ghost-link');
        ghostLink.attr('d', `M${d.x},${d.y}L${d.x},${d.y}`);
        return;
      }
      draggingFixed = !!d.fixed;
      if(draggingFixed){
        showGhost(d.x,d.y,true,true);
        gNodes.selectAll('.swap-target').classed('swap-target', false);
      } else {
        createGhost(); showGhost(d.x,d.y,false); setWashHighlight(null);
      }
    })
    .on('drag', function(ev){
      const d = this.__data__;
      if(addLinkState){
        const mp = d3.pointer(ev, root.node());
        ghostLink.attr('d', `M${addLinkState.from.x},${addLinkState.from.y}L${mp[0]},${mp[1]}`);
        const target = nodes.find(n=> n!==addLinkState.from && Math.hypot(n.x - mp[0], n.y - mp[1]) <= 14 );
        addLinkState.to = target || null;
        return;
      }
      const [mx,my] = d3.pointer(ev, root.node());

      if(draggingFixed){
        showGhost(mx,my,true,true);

        const candidates = nodes.filter(n=> n.fixed && n!==d);
        let pick=null, best=Infinity;
        candidates.forEach(n=>{
          const dist=Math.hypot(n.x-mx,n.y-my);
          if(dist<best){ best=dist; pick=n; }
        });
        const R = SWAP_R_TIER[d.tier] || 52;

        gNodes.selectAll('.swap-target').classed('swap-target', false);
        if(pick && best<=R){
          swapTarget=pick;
          gNodes.selectAll('g.node').filter(nd=>nd===pick).classed('swap-target', true);
          if(editHelp) editHelp.textContent='Release to swap transition slots';
        } else {
          swapTarget=null;
          if(editHelp) editHelp.textContent='Drag onto another transition to swap';
        }
        return;
      }

      const near = nearestSegmentPoint(mx,my);
      if(near){ candidateSeg=near; showGhost(near.p.x, near.p.y, true); setWashHighlight(near.segId); }
      else { candidateSeg=null; showGhost(mx,my,false); setWashHighlight(null); }
      if (near && editHelp) editHelp.textContent = (near.kind==='staging') ? `Move to staging ${near.dir}/${near.lane}` : `Move to ${near.virtue} / ${near.tier}`;
    })
    .on('end', function(){
      const d = this.__data__;
      if(addLinkState){
        if(addLinkState.to){
          const from=addLinkState.from, to=addLinkState.to;
          from.links = from.links || [];
          const exists = (from.links||[]).some(v => (typeof v==='string' ? v===to.id : v.to===to.id));
          if(!exists) from.links.push({ to: to.id });
          selectedLinkId = linkKey(from.id, to.id);
          rebuildLinks(); saveState(); refreshAll();
          if (selectedNode && selectedNode.id === from.id){
            populateLinkPills(from);
          }
          syncLinkUIForLink();
        }
        addLinkState=null; if(ghostLink){ ghostLink.remove(); ghostLink=null; }
        hideGhost();
        return;
      }
      if(draggingFixed){
        if(swapTarget){
          swapTransitionSlots(d, swapTarget);
          refreshAll(); saveState();
        }
        gNodes.selectAll('.swap-target').classed('swap-target', false);
        draggingFixed=false; swapTarget=null;
        hideGhost();
        return;
      }
      if(candidateSeg){
        let segId, arr, pathEl;
        if (candidateSeg.kind === 'staging'){
          d.staging = { dir: candidateSeg.dir, lane: candidateSeg.lane };
          segId = `staging-${candidateSeg.dir}-${candidateSeg.lane}`;
          arr = nodes.filter(n => n!==d && n.staging && n.staging.dir===candidateSeg.dir && n.staging.lane===candidateSeg.lane);
        } else {
          d.staging = null;
          d.virtue  = candidateSeg.virtue;
          d.tier    = candidateSeg.tier;
          const sIdx = virtueIndex[d.virtue];
          const seg  = segByTier[d.tier];
          segId = `spiral-${sIdx}-${seg}`;
          arr = nodes.filter(n => n!==d && !n.staging && !n.fixed && n.virtue===d.virtue && n.tier===d.tier);
        }
        pathEl = getSegPath(segId);
        if(pathEl){
          const L = pathEl.getTotalLength();
          function tOf(n){
            const steps=32; let best={d:Infinity,t:0};
            for(let i=0;i<=steps;i++){
              const t=i/steps; const pt=pathEl.getPointAtLength(t*L);
              const dd=Math.hypot(n.x-pt.x, n.y-pt.y);
              if(dd<best.d){ best={d:dd,t}; }
            }
            return best.t;
          }
          const withT = arr.map(n=>({n,t:tOf(n)}));
          withT.push({n:d, t:candidateSeg.t});
          withT.sort((a,b)=> a.t-b.t);
          withT.forEach((o,i)=>{ o.n.order=i; });
        }
        ensureStagingConsistency();
        layoutNodes(nodes); refreshAll(); saveState();
      }
      hideGhost(); setWashHighlight(null); candidateSeg=null;
    });
  sel.call(dragBehavior);
}
svg.on('click', ()=>{ if(appMode===MODES.EDIT){ selectedNode=null; selectedLinkId=null; refreshAll(); populateEditForm(null); syncLinkUIForLink(); }});
