// Tooltip (Popper)
const tip = d3.select('#tip');
let popperInstance=null;
function svgToClient(x, y){
  const pt = svg.node().createSVGPoint();
  pt.x = x; pt.y = y;
  // Use the zoomed <g> (root) CTM, which includes pan/zoom
  const m = root.node().getScreenCTM() || svg.node().getScreenCTM();
  const p = m ? pt.matrixTransform(m) : { x, y };
  return { x: p.x, y: p.y };
}
function ensurePopper(d){
  if (!window.Popper) return null;
  const pos=svgToClient(d.x,d.y);
  const virtualRef={ getBoundingClientRect:()=>({x:pos.x,y:pos.y,left:pos.x,top:pos.y,right:pos.x,bottom:pos.y,width:0,height:0}), contextElement:svg.node() };
  if(!popperInstance){
    popperInstance=Popper.createPopper(virtualRef, tip.node(), {
      placement:'top',
      modifiers:[{name:'offset',options:{offset:[0,10]}},{name:'preventOverflow',options:{boundary:document.body}},{name:'flip',options:{fallbackPlacements:['top','right','left','bottom']}}]
    });
  } else {
    popperInstance.state.elements.reference=virtualRef;
    popperInstance.update();
  }
  return popperInstance;
}
function showTip(d, ev){
  if(appMode===MODES.EDIT) return;

  const shiftPeek = !!(ev && ev.shiftKey);
  const undiscovered = (appMode === MODES.PLAYER && !d.unlocked);

  if (undiscovered && !shiftPeek){
    tip.html(`<h3>?</h3>`);
  } else if (shiftPeek){
    // Minimal: title, source, DC/Test only
    const dcLine = (d.dc != null || d.test)
      ? `<span style="padding:1px 6px;border:1px solid #30408e;border-radius:999px;background:#0e1537;color:#c8d3ff;font-size:11px;">
           ${d.dc != null ? `DC ${d.dc}` : ''}${(d.dc != null && d.test)?' · ':''}${d.test?d.test:''}
         </span>`
      : '';
    tip.html(
      `<h3>${d.title}</h3>
       ${dcLine ? `<div style="margin-top:6px;">${dcLine}</div>` : ''}
       <p class='bonus' style='opacity:.8'>Source: ${d.source||'—'}</p>`
    );
  } else {
    // Full details (your previous content)
    const dcLine = d.dc
      ? `<span style="padding:1px 6px;border:1px solid #30408e;border-radius:999px;background:#0e1537;color:#c8d3ff;font-size:11px;">DC ${d.dc}${d.test?` · ${d.test}`:''}</span>`
      : '';
    const tagsLine = (d.tags && d.tags.length)
      ? `<div style="margin-top:6px;opacity:.8;font-size:11px">Tags: ${d.tags.join(', ')}</div>`
      : '';
    const loreLink = d.loreUrl
      ? `<div style="margin-top:6px;"><a href="${d.loreUrl}" target="_blank" rel="noreferrer noopener">Lore</a></div>`
      : '';
    tip.html(
      `<h3>${d.title}</h3>
       <p>${d.text||''}</p>
       ${dcLine}
       ${tagsLine}
       ${d.bonus?`<div class='bonus'>Bonus: ${d.bonus}</div>`:''}
       <p class='bonus' style='opacity:.8'>Source: ${d.source||'—'}</p>
       ${loreLink}`
    );
  }

  ensurePopper(d);
  tip.style('opacity',1);
}


function hideTip(){ tip.style('opacity',0); }
