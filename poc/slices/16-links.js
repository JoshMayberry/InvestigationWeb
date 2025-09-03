// Links & prerequisites
let nodesById = new Map(nodes.map(n=>[n.id,n]));
function buildLinks(){
  const out=[]; const ids=new Set(nodes.map(n=>n.id));
  nodes.forEach(n=>{
    (n.links||[]).forEach(link=>{
      const tid = (typeof link==='string') ? link : link.to;
      if(ids.has(tid)) out.push({ id: linkKey(n.id, tid), source:n.id, target:tid });
    });
  });
  return out;
}
let links = buildLinks();

function buildIncomingMap(){
  const incoming = new Map(nodes.map(n=>[n.id, []]));
  links.forEach(l=>{ const arr=incoming.get(l.target); if(arr){ arr.push(l.source); } });
  return incoming;
}
let incomingMap = buildIncomingMap();
