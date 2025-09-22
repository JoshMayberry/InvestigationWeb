// Filters (defs) for glow (node halo)
const defs = svg.append('defs');
defs.append('filter').attr('id','halo').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%')
  .html(`<feGaussianBlur stdDeviation="3" in="SourceAlpha" result="blur"/><feFlood flood-color="#ffd166" result="color"/><feComposite in="color" in2="blur" operator="in" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>`);
