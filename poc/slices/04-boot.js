// Modes and basic UI wiring
const MODES = { PLAYER:'player', GM:'gm', EDIT:'edit' };
const MODE_KEY = 'iweb.mode.v1';
let appMode = localStorage.getItem(MODE_KEY) || MODES.PLAYER;
if (!Object.values(MODES).includes(appMode))  appMode = MODES.PLAYER;

function setMode(m){
  appMode = m;
  document.body.classList.toggle('mode-edit', m === MODES.EDIT);
  document.querySelectorAll('#modeSeg button').forEach(b=> b.classList.toggle('on', b.dataset.mode===appMode));
  document.querySelectorAll('.gm-player-only').forEach(el=> el.style.display = (appMode===MODES.EDIT)?'none':'' );
  document.querySelectorAll('.edit-only').forEach(el=> el.style.display = (appMode===MODES.EDIT)?'':'none' );
  hideTip();
  if (appMode !== MODES.EDIT) {
    if (searchEl) searchEl.value = '';
    activeSources = new Set(currentSources());
  }
  rebuildChips();
  localStorage.setItem(MODE_KEY, appMode);
  refreshAll();
}

document.getElementById('modeSeg').addEventListener('click', (e)=>{
  const b = e.target.closest('button[data-mode]'); if(!b) return; setMode(b.dataset.mode);
});
