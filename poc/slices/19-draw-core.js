// Drawing + selection (nodes + links)
let prevVisibility = new Map();
function willRevealNow(n){ const prev = prevVisibility.get(n.id) || false; const now = (appMode!==MODES.PLAYER) || isNodeRevealedForPlayer(n); return (!prev && now); }
function rememberVisibility(){ nodes.forEach(n=> prevVisibility.set(n.id, (appMode!==MODES.PLAYER) || isNodeRevealedForPlayer(n))); }

let selectedNode = null;
let selectedLinkId = null;

function selectNode(n){
  selectedNode = n;
  selectedLinkId = null; // clear link selection when changing node
  refreshAll();
  populateEditForm(n);
  syncLinkUIForLink();
}

function updateBonuses(){
  const list=document.getElementById('bonuses'); if(!list) return;
  const current=nodes.filter(n=>n.unlocked && n.bonus);
  const currIds=new Set(current.map(n=>n.id));
  [...list.querySelectorAll('li[data-id]')].forEach(li=>{ if(!currIds.has(li.dataset.id)) li.remove(); });
  current.forEach(n=>{
    let li=list.querySelector(`li[data-id="${n.id}"]`);
    if(!li){ li=document.createElement('li'); li.dataset.id=n.id; li.textContent=`${n.title}: ${n.bonus}`; list.appendChild(li);
      if(window.gsap){ gsap.fromTo(li, {opacity:0, y:-6}, {opacity:1, y:0, duration:0.25, ease:'power2.out'}); }
    } else { li.textContent=`${n.title}: ${n.bonus}`; }
  });
}

function rebuildLinks(){ links = buildLinks(); incomingMap = buildIncomingMap(); drawLinks(); }

function drawLinks(){
  computeLinkLaneOffsets();

  const visibleIds = new Set(nodes.filter(n=> (appMode!==MODES.PLAYER) || isNodeRevealedForPlayer(n)).map(n=>n.id));
  const inFilter = (n) => {
    const txtKey = `${n.title} ${n.text||''} ${n.source||''} ${(n.tags||[]).join(' ')}`.toLowerCase();
    const q=(searchEl && (searchEl.value||'').trim().toLowerCase())||'';

    // Player mode: for revealed but not-yet-unlocked, ignore source chips
    const srcAllowed = (appMode === MODES.PLAYER && !n.unlocked)
      ? true
      : (activeSources.size===0 || activeSources.has(n.source||'—'));

    const qOk   = !q || txtKey.includes(q);
    return srcAllowed && qOk;
  };

  gLinks.selectAll('path.link').data(links, d=>d.id)
    .join(
      enter=>enter.append('path')
        .attr('class','link')
        .attr('fill','none')
        .style('pointer-events','stroke')
        .attr('stroke-linecap','round')
        .on('click', function(ev,d){
          if (appMode !== MODES.EDIT) return;
          ev.stopPropagation();
          // Select link on path click too; also focus the source node in the form so its pills show.
          selectedNode = nodesById.get(d.source) || selectedNode;
          selectedLinkId = (selectedLinkId === d.id) ? null : d.id;
          populateEditForm(selectedNode);
          syncLinkUIForLink();
          drawLinks();
        }),
      update=>update,
      exit=>exit.remove()
    )
    /* Base appearance */
    .attr('stroke', d => linkColor(d))
    .attr('stroke-width', d=> d.id===selectedLinkId ? 3 : 2)
    .attr('stroke-opacity', d=> d.id===selectedLinkId ? 0.95 : 0.55)
    .attr('d', d=>getLinkPath(d))
    .attr('display', d=>{
      const s=nodesById.get(d.source), t=nodesById.get(d.target);
      if (appMode===MODES.PLAYER){
        if(!visibleIds.has(s.id) || !visibleIds.has(t.id)) return 'none';
      }
      return (inFilter(s) && inFilter(t)) ? null : 'none';
    })
    /* Edit-mode highlights via classes (CSS is scoped to body.mode-edit) */
    .classed('is-selected', d => d.id === selectedLinkId)
    .classed('is-override', d => !!getLinkCfgObj(d.source, d.target));
}

function updateNodeAppearance(sel, d){
  const dot  = sel.select('circle.dot');
  const halo = sel.select('circle.halo');
  const fillTo = nodeColor(d);

  const unlocked = !!d.unlocked;
  const hasBonus = !!(d.bonus && String(d.bonus).trim());

  // --- ring logic (what gets shown in each mode) ---
  let showHalo = false;
  let dotHL    = false;

  if (appMode === MODES.GM){
    showHalo = unlocked;   // halo == players have unlocked it
    dotHL    = hasBonus;   // outline == this node grants a bonus (always on in GM)
  } else if (appMode === MODES.PLAYER){
    showHalo = false;                 // no halo in player
    dotHL    = unlocked && hasBonus;  // outline only for unlocked bonus
  } else { // MODES.EDIT
    showHalo = (d === selectedNode);  // selection = halo only
    dotHL    = hasBonus;              // outline still means “bonus” in edit
  }

  sel.classed('show-halo', showHalo)
     .classed('dot-hl',   dotHL)
     .classed('selected', (appMode === MODES.EDIT && d === selectedNode));

  // halo on/off
  halo.style('display', showHalo ? '' : 'none')
      .attr('opacity', showHalo ? 1 : 0)
      .attr('filter', showHalo ? 'url(#halo)' : null);

  // color + keep attributes from fighting the CSS ring
  dot.attr('fill', fillTo);
  if (dotHL){
    // remove any old presentational stroke so the .dot-hl CSS wins
    dot.attr('stroke', null).attr('stroke-width', 2).style('filter', null);
  } else {
    dot.attr('stroke', d.fixed ? '#fff' : '#0004')
       .attr('stroke-width', d.fixed ? 3 : 2)
       .style('filter', null);
  }
}

function setInitialLabelAnchors(){
  const LABEL_RADIAL_PAD = 18;
  gLabels.selectAll('text.label').each(function(d){
    const th=Math.atan2(d.y-cy, d.x-cx)-Math.PI/3;
    const rx=Math.cos(th), ry=Math.sin(th);
    d._baseX = d.x + rx*LABEL_RADIAL_PAD + (Math.cos(th)>=0?4:-4);
    d._baseY = d.y + ry*LABEL_RADIAL_PAD + 4;
  });
}
function updateLabelTexts(){
  gLabels.selectAll('text.label').text(d => {
    if (appMode===MODES.PLAYER && !d.unlocked) return '';
    return (d.title.length>30? d.title.slice(0,28)+'…' : d.title);
  });
}
function layoutLabels(){
  const LABEL_H=14;
  const obstacles = nodes.map(n=>({x:n.x,y:n.y,r:18}));
  gLabels.selectAll('text.label').each(function(d){
    const t=d3.select(this);
    const txt=this.textContent||'';
    const w=txt ? this.getComputedTextLength():0;
    if(!w){ t.attr('x',d.x).attr('y',d.y); return; }
    const th=Math.atan2(d.y-cy,d.x-cx)-Math.PI/3;
    const rvx=Math.cos(th), rvy=Math.sin(th);
    const tvx=-rvy, tvy=rvx;
    const RADS=[16,22,28,34]; const TANG=[0,10,-10,18,-18];
    let placed=null;
    outer: for(const R of RADS){ for(const T of TANG){
      const ax=d.x+rvx*R+tvx*T, ay=d.y+rvy*R+tvy*T;
      const right=Math.cos(th)>=0; const x1=right?ax:ax-w, x2=right?ax+w:ax, y1=ay-LABEL_H*0.6, y2=ay+LABEL_H*0.6;
      let bad=false;
      for(const ob of obstacles){
        const nx=Math.max(x1, Math.min(ob.x,x2));
        const ny=Math.max(y1, Math.min(ob.y,y2));
        const dx=ob.x-nx, dy=ob.y-ny;
        if(Math.hypot(dx,dy) < ob.r){ bad=true; break; }
      }
      if(!bad){ placed={ax,ay,right}; break outer; }
    } }
    const ax=placed?placed.ax:(d.x+rvx*RADS[0]); const ay=placed?placed.ay:(d.y+rvy*RADS[0]); const right=placed?placed.right:(Math.cos(th)>=0);
    t.attr('x',ax).attr('y',ay).attr('text-anchor', right?'start':'end');
  });
}
function updateLeaderLines(){
  const THRESH=20;
  const labelMap=new Map();
  gLabels.selectAll('text.label').each(function(d){
    const txt=this.textContent||'';
    const visible = !(appMode===MODES.PLAYER && !d.unlocked) && !!txt;
    const x=+this.getAttribute('x')||d.x; const y=+this.getAttribute('y')||d.y;
    labelMap.set(d.id,{x,y,visible});
  });
  const leaders=gLeader.selectAll('line.leader').data(nodes, d=>d.id);
  leaders.join(
    enter=>enter.append('line').attr('class','leader'),
    update=>update,
    exit=>exit.remove()
  )
  .attr('x1', d=>d.x).attr('y1',d=>d.y)
  .attr('x2', d=> (labelMap.get(d.id)||{x:d.x}).x)
  .attr('y2', d=> (labelMap.get(d.id)||{y:d.y}).y)
  .attr('opacity', Math.max(0, 1 - (currentZoomK-1)/0.7) * 0.8)
  .attr('visibility', d=>{
    const L=labelMap.get(d.id);
    if(!L||!L.visible) return 'hidden';
    const dx=L.x-d.x, dy=L.y-d.y;
    return (Math.hypot(dx,dy)>THRESH)?'visible':'hidden';
  });
}

function refreshAll(){
  ensureStagingConsistency();
  setEditWashVisible(appMode===MODES.EDIT);

  nodesById = new Map(nodes.map(n=>[n.id,n]));
  rebuildLinks();
  rebuildChips(); // keep activeSources expanded when All is on, before drawing links

  const toReveal = nodes.filter(n => willRevealNow(n));

  const visibleNodes = nodes.filter(n => {
    if (appMode !== MODES.EDIT && n.staging) return false;
    return (appMode!==MODES.PLAYER) || isNodeRevealedForPlayer(n);
  });

  const nodeSel = gNodes.selectAll('g.node').data(visibleNodes, d=>d.id);
  const nodeEnter = nodeSel.enter().append('g').attr('class','node')
    .attr('transform', d=>`translate(${d.x},${d.y})`).attr('tabindex',0)
    .on("click", function(ev, d){
      if (appMode === MODES.EDIT){ selectNode(d); ev.stopPropagation(); return; }
      if (appMode === MODES.PLAYER){
        d.unlocked = !d.unlocked;
        saveState();
        refreshAll(); updateBonuses();
        const n = nodesById.get(d.id); if (n) showTip(n);
      }
    })
    .on('mousemove', function(ev, d){ showTip(d, ev); })
    .on('mouseleave', function(){ hideTip(); });

  nodeEnter.append('circle')
    .attr('class','halo')
    .attr('r',16)
    .attr('fill','none'); // stroke/width come from CSS; opacity handled in update
  nodeEnter.append('circle').attr('class','dot').attr('r',12);

  nodeSel.merge(nodeEnter)
    .attr('transform', d=>`translate(${d.x},${d.y})`)
    .classed('fixed', d=>!!d.fixed)
    .each(function(d){ updateNodeAppearance(d3.select(this), d, false); });

  nodeSel.exit().remove();

  gLabels.selectAll('text.label').data(visibleNodes, d=>d.id).join('text').attr('class','label');
  setInitialLabelAnchors(); updateLabelTexts(); layoutLabels(); updateLeaderLines();

  drawLinks();
  applyFilters();

  if (window.gsap){
    toReveal.forEach(n=>{
      const g = gNodes.selectAll('g.node').filter(d=>d.id===n.id);
      const dot = g.select('circle.dot');
      if (!dot.empty()){
        gsap.fromTo(dot.node(), {scale:0, transformOrigin:'center'}, {scale:1, duration:0.3, ease:'back.out(2)'});
      }
    });
  }

  rememberVisibility();
  setupDragBehavior();
}

/* Apply search + filter to dim non-matching */
function applyFilters(){
  const q=(searchEl && (searchEl.value||'').trim().toLowerCase())||'';
  const matches=new Set();

  if (activeSources.size===0) activeSources = new Set(currentSources());

  nodes.forEach(n=>{
    const isVisible = ((appMode!==MODES.EDIT) && n.staging) ? false
      : ((appMode!==MODES.PLAYER) || isNodeRevealedForPlayer(n));

    if (!isVisible) { n._visible = false; return; }
    const srcOk = activeSources.has(n.source||'—');
    const srcAllowed = (appMode === MODES.PLAYER && !n.unlocked)
      ? true
      : activeSources.has(n.source||'—');
    const text = `${n.title} ${n.text||''} ${n.source||''} ${(n.tags||[]).join(' ')}`.toLowerCase();
    const qOk = !q || text.includes(q);
    const ok = srcAllowed && qOk;
    n._visible = ok;
    if(ok && q) matches.add(n.id);
  });

  gNodes.selectAll('g.node').classed('dim', d=> d._visible===false).classed('match', d=> matches.has(d.id));
  gLabels.selectAll('text.label').classed('dim', d=> d._visible===false);
  gLinks.selectAll('path.link').classed('dim', d=>{
    const s=nodesById.get(d.source), t=nodesById.get(d.target);
    return (s&&s._visible===false) || (t&&t._visible===false);
  });

  rebuildChips();
}
