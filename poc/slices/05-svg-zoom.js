// SVG / Zoom / Layers
const svg = d3.select('svg');
const { width:w, height:h } = svg.node().getBoundingClientRect();
svg.attr('viewBox', [0,0,w,h]);
const cx=w/2, cy=h/2;

const root    = svg.append('g');
const gWash   = root.append('g'); // edit spiral wash
const gLinks  = root.append('g');
const gNodes  = root.append('g');
const gLeader = root.append('g');
const gLabels = root.append('g').attr('pointer-events','none');

let currentZoomK = 1;
const zoom = d3.zoom().scaleExtent([0.5, 2.5]).on('zoom', e=> {
  root.attr('transform', e.transform); currentZoomK=e.transform.k;
  gLeader.selectAll('line.leader').attr('opacity', Math.max(0, 1 - (currentZoomK-1)/0.7) * 0.8);
});
svg.call(zoom);
function resetZoom(){ svg.transition().duration(300).call(zoom.transform, d3.zoomIdentity); }
document.getElementById('btnResetZoom').addEventListener('click', resetZoom);
