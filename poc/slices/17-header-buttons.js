// Header buttons
document.getElementById('btnUnlock').addEventListener('click', ()=>{
  nodes.forEach(n => {
    if (!n.staging) {
      n.unlocked = true;
    }
  });
  refreshAll();
  updateBonuses();
  saveState();
});

document.getElementById('btnClear').addEventListener('click', ()=>{
  nodes.forEach(n=> n.unlocked=false);
  refreshAll(); updateBonuses(); saveState();
});
