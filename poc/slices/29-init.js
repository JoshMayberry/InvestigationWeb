// Init
function setSubtitleDirty(dirty){ const sub=document.getElementById('subtitle'); if(!sub) return; sub.textContent = 'The Three Virtues of Promise — Endurance · Harmony · Remembrance' + (dirty?' • ● unsaved':''); }
setMode(appMode);
rememberVisibility();
rebuildChips();
refreshAll();

/* Try loading last local storage snapshot (if present) */
try{
  const raw = localStorage.getItem('investigationWeb.v4');
  if(raw){ const doc = JSON.parse(raw); applyPayload(doc); }
}catch(e){ /* ignore */ }
