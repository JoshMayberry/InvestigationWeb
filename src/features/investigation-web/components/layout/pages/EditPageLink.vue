<template>
  <div class="form">
    <div class="block-title">{{ mode === 'draft' ? 'New Link' : 'Link' }}</div>

    <label v-if="mode==='selected'">
      <span>ID</span>
      <input class="txt" :value="link?.id" @input="onId(($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Type</span>
      <select class="sel" :value="typeVal" @change="onChange('type', ($event.target as HTMLSelectElement).value)">
        <option value="straight">Straight</option>
        <option value="curved">Curved</option>
        <option value="bezier">Bezier</option>
        <option value="spline">Spline</option>
        <option value="corkscrew">Corkscrew</option>
      </select>
    </label>

    <label>
      <span>Color</span>
      <input class="color" type="color" :value="colorVal" @input="onChange('color', ($event.target as HTMLInputElement).value)" />
    </label>

    <label>
      <span>Stroke</span>
      <select class="sel" :value="strokeVal" @change="onChange('stroke', ($event.target as HTMLSelectElement).value)">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
      </select>
    </label>

    <label>
      <span>Arrow Head</span>
      <input type="checkbox" :checked="arrowVal" @change="onChange('arrowHead', ($event.target as HTMLInputElement).checked)" />
    </label>

    <label class="range">
      <span>Edge Padding</span>
      <input class="rng" type="range" min="0" max="24" :value="padVal" @input="onChange('pad', Number(($event.target as HTMLInputElement).value))" />
      <span class="pill">{{ padVal }}</span>
    </label>

    <!-- Curved options (selected only) -->
    <div v-if="typeVal==='curved' && mode==='selected'" class="block">
      <div class="block-title sm">Curved midpoints</div>
      <div class="row">
        <button class="secondary" @click="addCtrl()">+ Add control</button>
        <button class="secondary" @click="clearCtrls()" :disabled="(ctrls.length||0)===0">Clear</button>
        <span class="muted small">Controls: {{ ctrls.length }}</span>
      </div>
      <div class="ctrl-list">
        <div class="ctrl" v-for="(c,i) in ctrls" :key="i">
          <label class="inline">
            <span>Pos %</span>
            <input class="rng" type="range" min="0" max="100" :value="c.t" @input="setCtrl(i,'t', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="0" max="100" :value="c.t" @change="setCtrl(i,'t', Number(($event.target as HTMLInputElement).value))" />
          </label>
          <label class="inline">
            <span>Offset %</span>
            <input class="rng" type="range" min="-100" max="100" :value="c.off" @input="setCtrl(i,'off', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="-100" max="100" :value="c.off" @change="setCtrl(i,'off', Number(($event.target as HTMLInputElement).value))" />
          </label>
          <button class="danger small" @click="removeCtrl(i)">Remove</button>
        </div>
      </div>
    </div>

    <!-- Bezier options -->
    <div v-if="typeVal==='bezier' && mode==='selected'" class="block">
      <div class="block-title sm">Bezier</div>
      <label class="row">
        <span>Symmetric</span>
        <input type="checkbox" :checked="beSym" @change="setBezier('symmetric', ($event.target as HTMLInputElement).checked)" />
      </label>
      <div class="grid-auto">
        <label class="inline">
          <span>C1 Pos %</span>
          <input class="rng" type="range" min="0" max="100" :value="beC1.t" @input="setBezierC(1,'t', Number(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="0" max="100" :value="beC1.t" @change="setBezierC(1,'t', Number(($event.target as HTMLInputElement).value))" />
        </label>
        <label class="inline">
          <span>C1 Offset %</span>
          <input class="rng" type="range" min="-100" max="100" :value="beC1.off" @input="setBezierC(1,'off', Number(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" min="-100" max="100" :value="beC1.off" @change="setBezierC(1,'off', Number(($event.target as HTMLInputElement).value))" />
        </label>

        <template v-if="!beSym">
          <label class="inline">
            <span>C2 Pos %</span>
            <input class="rng" type="range" min="0" max="100" :value="beC2.t" @input="setBezierC(2,'t', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="0" max="100" :value="beC2.t" @change="setBezierC(2,'t', Number(($event.target as HTMLInputElement).value))" />
          </label>
          <label class="inline">
            <span>C2 Offset %</span>
            <input class="rng" type="range" min="-100" max="100" :value="beC2.off" @input="setBezierC(2,'off', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="-100" max="100" :value="beC2.off" @change="setBezierC(2,'off', Number(($event.target as HTMLInputElement).value))" />
          </label>
        </template>
      </div>
    </div>

    <!-- Spline options -->
    <div v-if="typeVal==='spline' && mode==='selected'" class="block">
      <div class="block-title sm">Spline</div>
      <label class="inline">
        <span>Tension</span>
        <input class="rng" type="range" min="0" max="1" step="0.01" :value="splTension" @input="setSpline('tension', Number(($event.target as HTMLInputElement).value))" />
        <input class="num" type="number" min="0" max="1" step="0.01" :value="splTension" @change="setSpline('tension', Number(($event.target as HTMLInputElement).value))" />
      </label>
      <div class="row">
        <button class="secondary" @click="addSplineCtrl()">+ Add control</button>
        <button class="secondary" @click="clearSplineCtrls()" :disabled="(splCtrls.length||0)===0">Clear</button>
        <span class="muted small">Controls: {{ splCtrls.length }}</span>
      </div>
      <div class="ctrl-list">
        <div class="ctrl" v-for="(c,i) in splCtrls" :key="i">
          <label class="inline">
            <span>Pos %</span>
            <input class="rng" type="range" min="0" max="100" :value="c.t" @input="setSplineCtrl(i,'t', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="0" max="100" :value="c.t" @change="setSplineCtrl(i,'t', Number(($event.target as HTMLInputElement).value))" />
          </label>
          <label class="inline">
            <span>Offset %</span>
            <input class="rng" type="range" min="-100" max="100" :value="c.off" @input="setSplineCtrl(i,'off', Number(($event.target as HTMLInputElement).value))" />
            <input class="num" type="number" min="-100" max="100" :value="c.off" @change="setSplineCtrl(i,'off', Number(($event.target as HTMLInputElement).value))" />
          </label>
          <button class="danger small" @click="removeSplineCtrl(i)">Remove</button>
        </div>
      </div>
    </div>

    <!-- Corkscrew options -->
    <div v-if="typeVal==='corkscrew'" class="block">
      <div class="block-title sm">Corkscrew</div>
      <div class="grid-auto">
        <label class="inline">
          <span>Turns</span>
          <input class="rng" type="range" min="0" max="20" step="1"
                 :value="turnsCorkSlider"
                 @input="onChange('turns', Number(($event.target as HTMLInputElement).value))" />
          <input class="num" type="number" step="1"
                 :value="turnsVal"
                 @change="onChange('turns', Math.round(Number(($event.target as HTMLInputElement).value)))" />
        </label>
        <label class="inline">
          <span>Direction</span>
          <select class="sel" :value="dirVal" @change="onChange('direction', Number(($event.target as HTMLSelectElement).value))">
            <option :value="1">Clockwise</option>
            <option :value="-1">Counter</option>
          </select>
        </label>
        <label class="inline">
          <span>Start r</span>
          <input class="num" type="number" min="1" step="1"
                 :value="startRVal" @change="onChange('startRadius', Number(($event.target as HTMLInputElement).value))" />
        </label>
        <label class="inline">
          <span>End r</span>
          <input class="num" type="number" min="1" step="1"
                 :value="endRVal" @change="onChange('endRadius', Number(($event.target as HTMLInputElement).value))" />
        </label>
      </div>
    </div>

    <p v-if="mode==='draft'" class="muted small">Click first node, then second. Shift to keep adding.</p>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { useInvestigationWebStore } from "../../../stores/web";
import type { InvestigationRuntime } from "../../../context/runtime";
import { RUNTIME_KEY } from "../../../context/runtime";

export default defineComponent({
  name: "EditPageLink",
  props: {
    mode: { type: String as () => "draft"|"selected", required:true },
    linkId: { type: String, required: false }
  },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as InvestigationRuntime | null
    };
  },
  computed:{
    selection(): any { return this.runtime?.controllers?.selection; },
    undo(): any { return this.runtime?.controllers?.undo; },
    link(): any | null {
      if (this.mode !== "selected") return null;
      return this.store.links.find((l:any)=>l.id===this.linkId) || null;
    },
    typeVal(): string { return this.mode==='draft' ? this.store.linkDraft.type : this.link.type; },
    colorVal(): string { return this.mode==='draft' ? this.store.linkDraft.color : this.link.color; },
    strokeVal(): string { return this.mode==='draft' ? this.store.linkDraft.stroke : this.link.stroke; },
    arrowVal(): boolean { return this.mode==='draft' ? !!this.store.linkDraft.arrowHead : !!this.link.arrowHead; },
    padVal(): number { return this.mode==='draft' ? (this.store.linkDraft.pad || 0) : (this.link.pad || 0); },
    turnsVal(): number { return this.mode==='draft' ? (this.store.linkDraft.turns ?? 3) : (this.link?.turns ?? 3); },
    startRVal(): number { return this.mode==='draft' ? (this.store.linkDraft.startRadius ?? 10) : (this.link?.startRadius ?? 10); },
    endRVal(): number { return this.mode==='draft' ? (this.store.linkDraft.endRadius ?? 60) : (this.link?.endRadius ?? 60); },
    dirVal(): 1|-1 { return this.mode==='draft' ? (this.store.linkDraft.direction ?? 1) as any : (this.link?.direction ?? 1); },
    ctrls(): {t:number; off:number}[] {
      if (this.mode !== 'selected' || !this.link) return [];
      return this.link.midControls || [];
    },
    turnsValClamped(): number {
      const v = this.turnsVal ?? 0;
      return Math.min(2, Math.max(0, Number(v)));
    },
    turnsSlider(): number {
      // slider shows clamped 0..2, but numeric input can exceed
      const v = this.turnsVal ?? 0;
      return Math.min(2, Math.max(0, Number(v)));
    },
    turnsCorkSlider(): number {
      const v = this.turnsVal ?? 0;
      return Math.min(20, Math.max(0, Number(v)));
    },
    beC1(): {t:number;off:number} {
      if (this.mode==='draft') return this.store.linkDraft.c1 ?? { t:25, off:30 };
      return this.link?.c1 ?? { t:25, off:30 };
    },
    beC2(): {t:number;off:number} {
      if (this.mode==='draft') return this.store.linkDraft.c2 ?? { t:75, off:-30 };
      return this.link?.c2 ?? { t:75, off:-30 };
    },
    beSym(): boolean {
      return this.mode==='draft' ? !!this.store.linkDraft.symmetric : !!this.link?.symmetric;
    },
    splCtrls(): {t:number;off:number}[] {
      if (this.mode!=='selected' || !this.link || this.link.type!=='spline') return [];
      return this.link.controls || [];
    },
    splTension(): number {
      if (this.mode==='draft') return this.store.linkDraft.tension ?? 0.25;
      if (this.link?.type==='spline') return this.link.tension ?? 0.25;
      return 0.25;
    }
  },
  methods:{
    onId(next:string){
      if (!this.link) return;
      const oldId = this.link.id;
      const ok = this.store.renameLinkId(oldId, next);
      if (ok && next !== oldId) this.selection?.set(next);
    },
    onChange(key:any, value:any){
      if (this.mode === "draft"){
        this.store.setLinkDraft({ [key]: value } as any);
        return;
      }
      if (!this.link) return;
      const id = this.link.id;
      const before = (this.link as any)[key];
      const after = value;
      this.undo.push({
        label:`edit-link-${key}`,
        _coalesceKey:`link-prop:${id}:${key}`,
        before:{ [key]: before }, after:{ [key]: after },
        do: ()=> this.store.patchLink(id, { [key]: after } as any),
        undo: ()=> this.store.patchLink(id, { [key]: before } as any),
      });
    },
    addCtrl(){
      if (!this.link || this.link.type!=='curved') return;
      const before = (this.link.midControls || []).slice();
      const after = [...before, { t: 50, off: 25 }];
      this.undo.push({
        label:"link-add-ctrl",
        before:{ midControls: before }, after:{ midControls: after },
        do: ()=> this.store.patchLink(this.link.id, { midControls: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midControls: before }),
      });
    },
    removeCtrl(i:number){
      if (!this.link || this.link.type!=='curved') return;
      const before = (this.link.midControls || []).slice();
      const after = before.slice(); after.splice(i,1);
      this.undo.push({
        label:"link-remove-ctrl",
        before:{ midControls: before }, after:{ midControls: after },
        do: ()=> this.store.patchLink(this.link.id, { midControls: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midControls: before }),
      });
    },
    clearCtrls(){
      if (!this.link || this.link.type!=='curved') return;
      const before = (this.link.midControls || []).slice();
      const after:any[] = [];
      this.undo.push({
        label:"link-clear-ctrls",
        before:{ midControls: before }, after:{ midControls: after },
        do: ()=> this.store.patchLink(this.link.id, { midControls: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midControls: before }),
      });
    },
    setCtrl(i:number, k:'t'|'off', v:number){
      if (!this.link || this.link.type!=='curved') return;
      const before = (this.link.midControls || []).slice();
      const after = before.slice();
      after[i] = { ...after[i], [k]: v };
      this.undo.push({
        label:"link-edit-ctrl",
        _coalesceKey:`link-ctrl:${this.link.id}:${i}:${k}`,
        before:{ midControls: before }, after:{ midControls: after },
        do: ()=> this.store.patchLink(this.link.id, { midControls: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midControls: before }),
      });
    },
    addMidpoint(){
      if (!this.link || this.link.type !== "curved") return;
      const a = this.store.nodes.find((n:any)=>n.id===this.link.from);
      const b = this.store.nodes.find((n:any)=>n.id===this.link.to);
      if (!a || !b) return;
      const mid = { x: (a.x + b.x)/2, y: (a.y + b.y)/2 };
      const before = (this.link.midpoints || []).slice();
      const after = [...before, mid];
      this.undo.push({
        label:"link-add-midpoint",
        before:{ midpoints: before }, after:{ midpoints: after },
        do: ()=> this.store.patchLink(this.link.id, { midpoints: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midpoints: before }),
      });
    },
    clearMidpoints(){
      if (!this.link || this.link.type !== "curved") return;
      const before = (this.link.midpoints || []).slice();
      const after:any[] = [];
      this.undo.push({
        label:"link-clear-midpoints",
        before:{ midpoints: before }, after:{ midpoints: after },
        do: ()=> this.store.patchLink(this.link.id, { midpoints: after }),
        undo: ()=> this.store.patchLink(this.link.id, { midpoints: before }),
      });
    },
    setTurnsFromSlider(raw:string){
      const v = Number(raw);
      this.onChange('turns', v);
    },
    setBezier(key:'symmetric', val:any){
      if (this.mode==='draft'){ this.store.setLinkDraft({ [key]: val } as any); return; }
      if (!this.link || this.link.type!=='bezier') return;
      const id = this.link.id; const before = (this.link as any)[key]; const after = val;
      this.undo.push({ label:`bezier-${key}`, _coalesceKey:`bezier:${id}:${key}`, before:{ [key]:before }, after:{ [key]:after },
        do:()=> this.store.patchLink(id, { [key]: after }), undo:()=> this.store.patchLink(id, { [key]: before }) });
    },
    setBezierC(which:1|2, key:'t'|'off', val:number){
      if (this.mode==='draft'){
        const patch:any = {};
        if (which===1) patch.c1 = { ...(this.store.linkDraft.c1 ?? { t:25, off:30 }), [key]: val };
        else patch.c2 = { ...(this.store.linkDraft.c2 ?? { t:75, off:-30 }), [key]: val };
        this.store.setLinkDraft(patch);
        return;
      }
      if (!this.link || this.link.type!=='bezier') return;
      const id = this.link.id;
      const cur = which===1 ? this.link.c1 : this.link.c2;
      const next = { ...cur, [key]: val };
      const field = which===1 ? "c1" : "c2";
      this.undo.push({
        label:`bezier-${field}-${key}`,
        _coalesceKey:`bezier:${id}:${field}:${key}`,
        before:{ [field]: cur }, after:{ [field]: next },
        do: ()=> this.store.patchLink(id, { [field]: next }),
        undo: ()=> this.store.patchLink(id, { [field]: cur }),
      });
    },
    setSpline(key:'tension', val:number){
      if (this.mode==='draft'){ this.store.setLinkDraft({ [key]: val } as any); return; }
      if (!this.link || this.link.type!=='spline') return;
      const id = this.link.id; const before = (this.link as any)[key]; const after = val;
      this.undo.push({ label:`spline-${key}`, _coalesceKey:`spline:${id}:${key}`, before:{ [key]:before }, after:{ [key]:after },
        do:()=> this.store.patchLink(id, { [key]: after }), undo:()=> this.store.patchLink(id, { [key]: before }) });
    },
    addSplineCtrl(){
      if (this.mode==='draft'){
        const arr = (this.store.linkDraft.controls ?? []).slice();
        arr.push({ t: 50, off: 0 });
        this.store.setLinkDraft({ controls: arr });
        return;
      }
      if (!this.link || this.link.type!=='spline') return;
      const before = (this.link.controls || []).slice();
      const after = [...before, { t: 50, off: 0 }];
      this.undo.push({ label:"spline-add-ctrl", before:{ controls: before }, after:{ controls: after },
        do:()=> this.store.patchLink(this.link.id, { controls: after }),
        undo:()=> this.store.patchLink(this.link.id, { controls: before }) });
    },
    removeSplineCtrl(i:number){
      if (!this.link || this.link.type!=='spline') return;
      const before = (this.link.controls || []).slice(); const after = before.slice(); after.splice(i,1);
      this.undo.push({ label:"spline-remove-ctrl", before:{ controls: before }, after:{ controls: after },
        do:()=> this.store.patchLink(this.link.id, { controls: after }),
        undo:()=> this.store.patchLink(this.link.id, { controls: before }) });
    },
    clearSplineCtrls(){
      if (!this.link || this.link.type!=='spline') return;
      const before = (this.link.controls || []).slice(); const after:any[] = [];
      this.undo.push({ label:"spline-clear-ctrls", before:{ controls: before }, after:{ controls: after },
        do:()=> this.store.patchLink(this.link.id, { controls: after }),
        undo:()=> this.store.patchLink(this.link.id, { controls: before }) });
    },
    setSplineCtrl(i:number, key:'t'|'off', v:number){
      if (!this.link || this.link.type!=='spline') return;
      const before = (this.link.controls || []).slice(); const after = before.slice();
      after[i] = { ...after[i], [key]: v };
      this.undo.push({ label:"spline-edit-ctrl", _coalesceKey:`spline:${this.link.id}:${i}:${key}`, before:{ controls: before }, after:{ controls: after },
        do:()=> this.store.patchLink(this.link.id, { controls: after }),
        undo:()=> this.store.patchLink(this.link.id, { controls: before }) });
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:10px; }
.block { display:flex; flex-direction:column; gap:8px; }
.block-title { font-size:12px; color:var(--muted); letter-spacing:.3px; }
.block-title.sm { margin-top:2px; }
label { display:flex; align-items:center; justify-content:space-between; gap:10px; }
label > span { font-size:12px; color: var(--muted); }
.txt, .sel {
  flex:1;
  background: rgba(255,255,255,0.06);
  border:1px solid rgba(255,255,255,0.12);
  color: var(--text);
  padding:6px 8px;
  border-radius:6px;
  font-size:12px;
  appearance: none;
}
.color { width: 44px; height: 24px; padding:0; border:1px solid rgba(255,255,255,0.15); border-radius:6px; background: transparent; }
.range { align-items:center; }
.rng { flex:1; }
.pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; }
.grid-auto {
  display:grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap:8px;
  align-items:center;
}
.inline { display:flex; align-items:center; gap:8px; justify-content:space-between; flex-wrap:wrap; }
.inline > .rng { flex:1 1 160px; min-width:140px; }
.inline > .num, .inline > .sel { flex:0 0 auto; }
.num {
  width:90px;
  background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.2);
  color:var(--text);
  padding:4px 6px;
  border-radius:6px;
  font-size:12px;
}
.muted.small { font-size:11px; color: var(--muted); }
.ctrl-list { display:flex; flex-direction:column; gap:8px; }
.ctrl { display:flex; gap:8px; align-items:center; flex-wrap:wrap; padding:6px; border:1px solid rgba(255,255,255,0.08); border-radius:8px; }
/* styled control */ .txt, .sel { appearance: none; color-scheme: dark; }
/* Style the popup options (best-effort across browsers) */
:deep(select.sel) { background:#0f172a; color:var(--text); border-color:rgba(255,255,255,0.2); }
:deep(select.sel option) { background:#0f172a; color:var(--text); }
</style>