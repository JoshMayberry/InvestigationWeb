// Visibility rules
function isNodeRevealedForPlayer(n){
  if (appMode !== MODES.PLAYER) return true;
  if (!n.initiallyHidden) return true;
  const prereqs = incomingMap.get(n.id) || [];
  if (prereqs.length === 0) return true;
  return prereqs.every(pid => (nodesById.get(pid)?.unlocked));
}
