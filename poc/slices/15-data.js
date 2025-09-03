// DATA (same dataset)
const handsNodes = [
  { id:'farm-pacts', tier:'shallow', virtue:'Endurance', boundary:0, title:'Farm Pacts', source:'Polder', bridge:0, text:'Farmers survive by pooling labor, food, and tools.', fixed:true },
  { id:'pack-tactics', tier:'mid', virtue:'Endurance', boundary:0, title:'Pack Tactics', source:'Road to Cradlelace', bridge:0, text:'Crawling claws work in packs, creating a deadly unity.', fixed:true },
  { id:'merged-identity', tier:'deep', virtue:'Endurance', boundary:0, title:'Merged Identity', source:'Kianna’s Drawings', bridge:0, text:'People with hand-pupils blur into one mass — unity → fusion.', fixed:true, links:['painspren-nirvana'] },
  { id:'painspren-nirvana', tier:'center', virtue:'Endurance', boundary:0, title:'Painspren Nirvana', source:'—', bridge:0, text:'Enlightened painspren gather people to create their ‘utopia’.', bonus:'Advantage vs fusion (grapple/pull).', fixed:true, initiallyHidden:true },
];
const songNodes = [
  { id:'shared-song', tier:'shallow', virtue:'Remembrance', boundary:2, title:'A Shared Song', source:'Ward', bridge:1, text:'The Song is known and sung by all; each family’s history lives in it.', fixed:true },
  { id:'rhythm-grasping', tier:'mid', virtue:'Remembrance', boundary:2, title:'Rhythm of Grasping', source:'Observed in battle', bridge:1, text:'Claws attack in a rhythm that lets them manipulate matter.', fixed:true },
  { id:'rewritten-song', tier:'deep', virtue:'Remembrance', boundary:2, title:'Rewritten Song', source:'Kianna’s papers', bridge:1, text:'Kianna rewrites the verse where Culley dies — memory over reality.', fixed:true, links:['culleys-will'] },
  { id:'culleys-will', tier:'center', virtue:'Remembrance', boundary:2, title:'Culley’s Will', source:'—', bridge:1, text:'With a gemheart, Culley makes the rewrite partly real.', bonus:'Identify gemheart as anchor; attacks/drain vs gemheart gain Advantage.', fixed:true, initiallyHidden:true },
];
const dollNodes = [
  { id:'burning-doll', tier:'shallow', virtue:'Harmony', boundary:1, title:'Burning Doll', source:'Dellie', bridge:2, text:'Dolls are burned at Weeping’s end to let go; Kianna keeps hers.', fixed:true },
  { id:'abandoned-doll', tier:'mid', virtue:'Harmony', boundary:1, title:'Abandoned Doll', source:'Farm search', bridge:2, text:'A doll sits where someone should be — claws take people, leave tokens.', fixed:true },
  { id:'kianna-dolls', tier:'deep', virtue:'Harmony', boundary:1, title:"Kianna’s Doll Collection", source:'Kianna’s shrine', bridge:2, text:'She hoards the past; cannot let go.', fixed:true, links:['amalgam-hoard'] },
  { id:'amalgam-hoard', tier:'center', virtue:'Harmony', boundary:1, title:'Amalgamation’s Hoard', source:'—', bridge: 2, text:'The horror hoards cognitive shadows like Kianna hoards dolls.', fixed:true, initiallyHidden:true, bonus:'Use the doll ritual to argue with Kianna (“let him go”).' },
];
[...handsNodes, ...songNodes, ...dollNodes].forEach(n=>{ const p = anchorXYBoundary(n.boundary, n.tier); n.x=p.x; n.y=p.y; });

const endNodes = [
  { id:'end-ribbon-rattle', virtue:'Endurance', tier:'shallow', title:'The Ribbon & the Rattle', source:'Polder', text:'Ribbon fertility wanes; farmers are pushed into the Rattle.' },
  { id:'end-more-vanish', virtue:'Endurance', tier:'shallow', title:'Each Weeping, More Vanish', source:'Polder', text:'Disappearances increase during the Weeping.' },
  { id:'end-polder-survived', virtue:'Endurance', tier:'shallow', title:'Polder Survived Drowning', source:'Polder', text:'He survived the Cradlelace incident.' },
  { id:'end-culley-died', virtue:'Endurance', tier:'shallow', title:'Culley Died in the Weeping', source:'Dellie', text:'His death occurred at Cradlelace during the Weeping.' },
  { id:'end-sparkles-storm', virtue:'Endurance', tier:'shallow', title:'Lake Sparkles in Highstorms', source:'Ward', text:'Cradlelace gleams when the storms pass.' },
  { id:'end-hands-pulled', virtue:'Endurance', tier:'mid', title:'The Hands Pulled Us', source:'Polder (Difficult)', text:'Waters weren’t empty—hands dragged us down.', bonus:'Advantage vs grapples from claws/Amalgamation.' },
  { id:'end-claws-made', virtue:'Endurance', tier:'mid', title:'Claws of Debris', source:'Observed in battle', text:'Refuse & mud form claws; they reform after destruction.' },
  { id:'end-pond-gleams', virtue:'Endurance', tier:'mid', title:'Gleam Even in Weeping', source:'Skill Check', text:'Pond still gleams as if gems never run out of Stormlight.' },
  { id:'end-drag-furrows', virtue:'Endurance', tier:'mid', title:'Dragging Furrows', source:'Skill Check', text:'Soil grooves show bodies pulled toward the pond.' },
  { id:'end-survival-guilt', virtue:'Endurance', tier:'deep', title:'Survival Guilt', source:'Polder (Difficult)', text:'He saved himself instead of Culley.' },
  { id:'end-gemheart', virtue:'Endurance', tier:'deep', title:'The Gemheart', source:'Boss', text:'A gemheart anchors the horror at the pond’s core.' },
];

const harmNodes = [
  { id:'harm-hands-symbols', virtue:'Harmony', tier:'shallow', title:'Hands as Symbols', source:'Friend of Polder', text:'Joined hands = unity in Promise.' },
  { id:'harm-goddaughter', virtue:'Harmony', tier:'shallow', title:'Kianna is Dellie’s Goddaughter', source:'Dellie', text:'Dellie seeks to protect her.' },
  { id:'harm-pact-promise', virtue:'Harmony', tier:'shallow', title:'Polder’s Pact in Promise', source:'Polder', text:'They’re waiting out the Weeping together.' },
  { id:'harm-spren-namesake', virtue:'Harmony', tier:'shallow', title:'Spren Seek Their Namesake', source:'Ward', text:'Painspren gather where pain is present.' },
  { id:'harm-paired-spren', virtue:'Harmony', tier:'shallow', title:'Statues of Paired Spren', source:'Dellie', text:'Common in homes — what ‘good harmony’ looks like.' },
  { id:'harm-approx-location', virtue:'Harmony', tier:'mid', title:'Kianna’s Approx. Location', source:'Dellie', text:'Guidance toward the right area.' },
  { id:'harm-not-returned', virtue:'Harmony', tier:'mid', title:'Kianna Hasn’t Returned', source:'Dellie', text:'She promised last year but hasn’t come.' },
  { id:'harm-knows-kianna-pact', virtue:'Harmony', tier:'mid', title:'Knows Kianna’s Pact', source:'Polder', text:'Pacts stick together; he can point you there.', bonus:'Detailed directions to Kianna’s Pact.' },
  { id:'harm-kianna-lonely', virtue:'Harmony', tier:'mid', title:'Kianna’s Loneliness', source:'Dellie', text:'Isolation made her vulnerable.' },
  { id:'harm-pact-collapsed', virtue:'Harmony', tier:'mid', title:'Cradlelace Pact Collapsed', source:'Skill Check', text:'Empty not from neglect — they were lured away.' },
  { id:'harm-marked-x', virtue:'Harmony', tier:'mid', title:'Marked with an X', source:'Farmhouse', text:'Abandoned houses bear a muddy X.' },
  { id:'harm-missing-x', virtue:'Harmony', tier:'mid', title:'Kianna’s House Missing X', source:'Farmhouse', text:'Her house lacks the mark.' },
  { id:'harm-melded-identities', virtue:'Harmony', tier:'deep', title:'Melded Identities', source:'Boss', text:'Spren + shadows feeding; identities blend.' },
];

const remNodes = [
  { id:'rem-straw-dolls', virtue:'Remembrance', tier:'shallow', title:'Straw Dolls', source:'Dellie', text:'Stand-ins for absent loved ones; normally burned after Weeping.' },
  { id:'rem-song-of-virtues', virtue:'Remembrance', tier:'shallow', title:'Song of Virtues', source:'Ward', text:'Records the people’s history.' },
  { id:'rem-song-variants', virtue:'Remembrance', tier:'shallow', title:'Song Variants Are Taboo', source:'Ward', text:'Altering the Song is forbidden.' },
  { id:'rem-art-style', virtue:'Remembrance', tier:'shallow', title:'Kianna’s Art Style', source:'Dellie', text:'She draws to cope; distinct style.' },
  { id:'rem-dislikes-burning', virtue:'Remembrance', tier:'mid', title:'Kianna Dislikes Burning Dolls', source:'Dellie', text:'She keeps them instead of letting go.' },
  { id:'rem-kianna-drawing', virtue:'Remembrance', tier:'mid', title:'Kianna’s Drawing', source:'Friend of Polder', text:'A telling piece recovered in Promise.' },
  { id:'rem-kianna-happy', virtue:'Remembrance', tier:'mid', title:'Kianna Was Happy Recently', source:'Polder', text:'She wouldn’t say why.' },
  { id:'rem-sinkhole', virtue:'Remembrance', tier:'mid', title:'Cradlelace Was a Sinkhole', source:'Ward', text:'A home fell in; the family drowned.' },
  { id:'rem-culley-innocence', virtue:'Remembrance', tier:'deep', title:'Culley = Lost Innocence', source:'Kianna’s Shrine', text:'Symbolic, not romantic; a shrine to the past.' },
  { id:'rem-painspren-link', virtue:'Remembrance', tier:'deep', title:'Painspren Link', source:'Combat (Skill Check)', text:'Claws are tied to painspren.', bonus:'Larkin drains their Investiture faster.' },
];

let nodes = [...handsNodes, ...songNodes, ...dollNodes, ...endNodes, ...harmNodes, ...remNodes];

/* Defaults & normalization */
nodes.forEach(n=>{
  n.dc ??= null; n.test ??= null; n.tags ??= []; n.links ??= [];
  n.fixed = !!n.fixed;
  n.unlocked ??= false;
  n.initiallyHidden = !!n.initiallyHidden;
  if(n.tier==='center' && !n.fixed){ const p=anchorXY(n.virtue,n.tier); n.x=p.x; n.y=p.y; }
});
function anchorXY(virtue, tier){ const start = startAngles[virtueIndex[virtue]]; const t = tierFrac[tier]*ONE_TURN; const th = start + t, r = r0 + k*t; return { x: cx + r*Math.cos(th), y: cy + r*Math.sin(th) }; }
function anchorXYBoundary(boundaryIdx, tier){
  const start = BOUNDARY_ANGLES[boundaryIdx];
  const t = tierFrac[tier] * ONE_TURN;
  const th = start - t;
  const r = r0 + k*t;
  return { x: cx + r*Math.cos(th), y: cy + r*Math.sin(th) };
}
function getSegPath(segId){ return document.getElementById(segId) || gWash.select(`[data-seg="${segId}"]`).node(); }

/* Layout along spiral/staging paths */
function layoutNodes(ds){
  const buckets = new Map();
  ds.forEach(n=>{
    if (n.fixed) return;
    if (n.tier==='center'){ const p=anchorXY(n.virtue,n.tier); n.x=p.x; n.y=p.y; return; }
    if (n.staging && typeof n.staging.lane==='number'){
      const segId = `staging-${n.staging.dir}-${n.staging.lane}`;
      if(!buckets.has(segId)) buckets.set(segId, []);
      buckets.get(segId).push(n);
      return;
    }
    const sIdx = virtueIndex[n.virtue];
    const seg  = segByTier[n.tier];
    const segId= `spiral-${sIdx}-${seg}`;
    if(!buckets.has(segId)) buckets.set(segId, []);
    buckets.get(segId).push(n);
  });

  buckets.forEach((arr, segId)=>{
    const pathEl = getSegPath(segId);
    if(!pathEl) return;
    arr.sort((a,b)=> (a.order??0) - (b.order??0));
    arr.forEach((n,i)=>{
      n.order = i;
      const t=(i+1)/(arr.length+1);
      const p=pointAt(pathEl, t);
      n.x=p.x; n.y=p.y;
    });
  });
}
layoutNodes(nodes);
