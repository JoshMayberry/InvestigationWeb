/* Node script to split proof-of-concept.html into smaller slices by section headers */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'proof-of-concept.html');
const OUT = path.join(__dirname, 'slices');

function ensureDir(p){ if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

const text = fs.readFileSync(SRC, 'utf8');
ensureDir(OUT);

// Extract pre-JS parts
function extractBetween(startStr, endStr){
  const s = text.indexOf(startStr);
  const e = text.indexOf(endStr, s >= 0 ? s : 0);
  if (s < 0 || e < 0) return null;
  return text.slice(s, e + endStr.length);
}
function extractTag(tag){
  const re = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'i');
  const m = text.match(re);
  return m ? m[0] : null;
}

// 00-head (doctype..header close), 01-styles, 02-body shell, 03-libs
const headToHeader = (() => {
  const start = '<!doctype html>';
  const end = '</header>';
  const s = text.indexOf(start);
  const e = text.indexOf(end);
  return (s >= 0 && e >= 0) ? text.slice(s, e + end.length) : null;
})();

const styles = extractTag('style');
const asideToMain = extractBetween('<aside id="aside">', '</main>');
const libsBlock = extractBetween('<!-- libs -->', '<script>/* simple focus style reset */');

if (headToHeader) fs.writeFileSync(path.join(OUT, '00-head.html'), headToHeader);
if (styles)      fs.writeFileSync(path.join(OUT, '01-styles.css'), styles);
if (asideToMain) fs.writeFileSync(path.join(OUT, '02-body-shell.html'), asideToMain);
if (libsBlock)   fs.writeFileSync(path.join(OUT, '03-libs.html'), libsBlock);

// Main inline script (last <script> in file)
const scriptBlocks = [...text.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const mainJs = scriptBlocks[scriptBlocks.length - 1] || '';

/* Split mainJs by the banner comment lines */
const bannerRe = /\/\*\s*=+\s*\n\s*([^\n]+)\n\s*=+\s*\*\//g; // matches /* === ... === */
const parts = [];
let lastIndex = 0;
let m;
while ((m = bannerRe.exec(mainJs)) !== null) {
  const title = m[1].trim();
  const start = m.index;
  if (parts.length > 0) {
    const prev = parts[parts.length - 1];
    prev.code = mainJs.slice(prev.start, start);
  }
  parts.push({ title, start: bannerRe.lastIndex, code: '' });
}
// Tail after last banner
if (parts.length > 0) {
  parts[parts.length - 1].code = mainJs.slice(parts[parts.length - 1].start);
}

// Map titles to filenames
const nameMap = new Map([
  ['Modes and basic UI wiring', '04-boot.js'],
  ['SVG / Zoom / Layers', '05-svg-zoom.js'],
  ['Tooltip (Popper)', '06-tooltip.js'],
  ['Filters (defs) for glow (node halo)', '07-defs-halo.js'],
  ['Spiral geometry', '08-spiral-geom.js'],
  ['Helpers', '10-helpers.js'],
  ['Link defaults & overrides', '11-link-defaults.js'],
  ['Colors', '14-colors.js'],
  ['DATA (same dataset)', '15-data.js'],
  ['Links & prerequisites', '16-links.js'],
  ['Visibility rules', '17-visibility.js'],
  ['Search & Filters', '18-search-filters.js'],
  ['Drawing + selection (nodes + links)', '19-draw-core.js'],
  ['JSON Open/Save', '22-json-io.js'],
  ['Init', '29-init.js'],
]);

// Write slices
let seq = 4;
parts.forEach(p => {
  const base = nameMap.get(p.title) || `${String(seq).padStart(2, '0')}-${p.title.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.js`;
  seq++;
  fs.writeFileSync(path.join(OUT, base), `// ${p.title}\n${p.code.trim()}\n`);
});

console.log(`Wrote slices to ${OUT}`);