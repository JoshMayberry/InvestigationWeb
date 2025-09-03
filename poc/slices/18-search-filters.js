// Search & Filters
const searchEl = document.getElementById('search');
if (searchEl) searchEl.addEventListener('input', applyFilters);
const filterWrap = document.getElementById('filterChips');
let activeSources = new Set();

const FILTER_ALL_KEY = 'iweb.filterAll.v1';
let allSourcesMode = (localStorage.getItem(FILTER_ALL_KEY) ?? '1') === '1';
function setAllSourcesMode(v){
  allSourcesMode = !!v;
  try{ localStorage.setItem(FILTER_ALL_KEY, allSourcesMode ? '1' : '0'); }catch(e){}
}

function currentSources(){
  if (appMode === MODES.PLAYER){
    // Player: only show filters for *discovered* (unlocked) nodes
    const pool = nodes.filter(n => n.unlocked);
    return Array.from(new Set(pool.map(n => n.source || '—')))
      .sort((a,b)=> a.localeCompare(b));
  }
  // GM/Edit: as before (hide staging outside Edit)
  const pool = nodes.filter(n => !(appMode!==MODES.EDIT && n.staging));
  return Array.from(new Set(pool.map(n => n.source || '—')))
    .sort((a,b)=> a.localeCompare(b));
}

function renderChips(sources){
  if(!filterWrap) return;

  // Keep selection in sync with current sources
  if (allSourcesMode){
    activeSources = new Set(sources);                        // All = always expand to everything visible
  } else {
    activeSources = new Set([...activeSources].filter(s => sources.includes(s))); // prune removed
  }

  filterWrap.innerHTML='';

  // "All"
  const allChip=document.createElement('span');
  allChip.className='chip';
  allChip.textContent='All';
  allChip.addEventListener('click', ()=>{
    setAllSourcesMode(true);
    activeSources = new Set(sources);
    applyFilters();
    syncChipStates();
  });
  filterWrap.appendChild(allChip);

  // "None"
  const noneChip=document.createElement('span');
  noneChip.className='chip';
  noneChip.textContent='None';
  noneChip.addEventListener('click', ()=>{
    setAllSourcesMode(false);
    activeSources.clear();
    applyFilters();
    syncChipStates();
  });
  filterWrap.appendChild(noneChip);

  // Individual sources
  sources.forEach(name=>{
    const chip=document.createElement('span');
    chip.className='chip';
    chip.textContent=name;
    chip.dataset.name=name;
    chip.addEventListener('click', ()=>{
      setAllSourcesMode(false);                // touching individual chips leaves "All" mode
      if(activeSources.has(name)) activeSources.delete(name);
      else activeSources.add(name);
      applyFilters();
      syncChipStates();
    });
    filterWrap.appendChild(chip);
  });

  syncChipStates();
}

function syncChipStates(){
  if(!filterWrap) return;

  // Clear
  filterWrap.querySelectorAll('.chip').forEach(ch=> ch.classList.remove('active'));

  // Mark All/None
  const allChip = [...filterWrap.querySelectorAll('.chip')].find(c => c.textContent==='All');
  const noneChip = [...filterWrap.querySelectorAll('.chip')].find(c => c.textContent==='None');
  if (allChip) allChip.classList.toggle('active', allSourcesMode);
  if (noneChip) noneChip.classList.toggle('active', !allSourcesMode && activeSources.size===0);

  // Mark per-source
  filterWrap.querySelectorAll('.chip[data-name]').forEach(ch=>{
    const name = ch.dataset.name;
    const on = allSourcesMode ? true : activeSources.has(name);
    ch.classList.toggle('active', on);
  });
}

function rebuildChips(){
  renderChips(currentSources());
}
