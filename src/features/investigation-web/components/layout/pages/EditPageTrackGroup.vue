<template>
  <div class="form" v-if="group">
    <div class="block-title">{{ mode==='draft' ? 'Track Group Defaults' : 'Track Group' }}</div>
    <div v-if="mode==='selected'" class="row">
      <button class="secondary small" @click="setAsDefault">Set As Default</button>
    </div>

    <label>
      <span>ID</span>
      <input class="txt" :value="group.id" disabled />
    </label>

    <label>
      <span>Type</span>
      <select class="sel" :value="group.type" @change="onType(($event.target as HTMLSelectElement).value)">
        <option value="horizontal-lines">horizontal-lines</option>
        <option value="spiral-set">spiral-set</option>
      </select>
    </label>

    <div class="block-title sm">Parameters</div>

    <template v-if="group.type==='horizontal-lines'">
      <ParamNum label="Center X" :value="p.cx" @change="setParam('cx',$event)" />
      <ParamNum label="Center Y" :value="p.cy" @change="setParam('cy',$event)" />
      <ParamNum label="Width" :value="p.width" @change="setParam('width',$event)" />
      <ParamNum label="Lines" :value="p.lines" :min="1" @change="setParam('lines',$event,true)" />
      <ParamNum label="Gap" :value="p.gap" @change="setParam('gap',$event)" />
      <ParamNum label="Rotation" :value="deg(p.rotation)" @change="v=>setParam('rotation', rad(v))" />
    </template>

    <template v-else>
      <ParamNum label="Center X" :value="p.cx" @change="setParam('cx',$event)" />
      <ParamNum label="Center Y" :value="p.cy" @change="setParam('cy',$event)" />
      <ParamNum label="Turns" :value="p.turns" :step="0.1" @change="setParam('turns',$event)" />
      <ParamNum label="Spirals" :value="p.spirals" :min="1" @change="setParam('spirals',$event,true)" />
      <ParamNum label="r0" :value="p.r0" @change="setParam('r0',$event)" />
      <ParamNum label="k" :value="p.k" @change="setParam('k',$event)" />
      <ParamNum label="Samples" :value="p.samples" :min="16" @change="setParam('samples',$event,true)" />
      <ParamNum label="Rotation" :value="deg(p.rotation)" @change="v=>setParam('rotation', rad(v))" />
    </template>

    <div class="block-title sm">Tracks</div>
    <div class="pill-row" v-if="childTracks.length">
      <button
        v-for="t in childTracks"
        :key="t.id"
        class="pill link"
        @click="selectTrack(t.id)"
        :title="t.id"
      >{{ t.id }}</button>
    </div>
    <p v-else class="muted small">No tracks generated.</p>

    <div class="block-title sm">Palette</div>
    <div class="palette">
      <div v-for="(c,i) in group.colorPalette" :key="i" class="pal-item">
        <input type="color" :value="c" @input="onPalette(i, ($event.target as HTMLInputElement).value)" />
        <button class="small danger" @click="removePalette(i)" v-if="group.colorPalette.length>1">✕</button>
      </div>
      <button class="secondary small" @click="addPalette">+ Color</button>
    </div>

    <div class="actions">
      <button class="secondary" @click="recenter">Recenter</button>
      <button class="secondary" @click="duplicateGroup">Duplicate</button>
      <button class="danger" @click="explode">Explode</button>
      <button class="danger" @click="deleteGroup">Delete</button>
      <button class="secondary" @click="stageAll">Stage All Nodes</button>
    </div>
  </div>
  <div v-else class="muted small">No group selected.</div>
</template>

<script lang="ts">
import { defineComponent, inject, h } from "vue";  // added h
import { useInvestigationWebStore } from "../../../stores/web";
import { RUNTIME_KEY } from "../../../context/runtime";

const ParamNum = defineComponent({
  name:"ParamNum",
  props:{ label:String, value:[Number,String], min:[Number,String], step:{type:[Number,String],default:1} },
  emits:["change"],
  setup(props,{emit}){
    function on(e:any){
      const v = Number(e.target.value);
      emit("change", v);
    }
    return () => h('label',
      { class:'row' },
      [
        h('span', props.label),
        h('input', {
          class:'num',
          type:'number',
          value: props.value as any,
          min: props.min as any,
            step: props.step as any,
          onInput: on
        })
      ]
    );
  }
});

export default defineComponent({
  name:"EditPageTrackGroup",
  components:{ ParamNum },
  props:{ groupId:{ type:String, required:false }, mode:{ type:String, default:"selected"} },
  data(){
    return {
      store: useInvestigationWebStore(),
      runtime: inject(RUNTIME_KEY, null) as any
    };
  },
  computed:{
    group(): any | null {
      if (this.mode === 'draft') return this.store.groupDraft;
      return this.store.calcGroups.find((g:any)=> g.id===this.groupId) || null;
    },
    p(): any { return this.group?.params || {}; },
    childTracks(): any[] {
      if (!this.group) return [];
      return this.store.tracks.filter((t:any)=> t.groupId === this.group.id);
    }
  },
  methods:{
    deg(r:number){ return Math.round((r||0) * 180 / Math.PI); },
    rad(d:number){ return (d||0) * Math.PI / 180; },
    onType(v:string){
      if (!this.group) return;
      if (this.mode === 'draft'){
        this.store.setGroupDraft({ type: v });
        return;
      }
      this.store.updateCalculatedGroup(this.group.id, { type: v });
    },
    setParam(key:string, val:any, int=false){
      if (!this.group) return;
      const v = int ? Math.max((key==='samples'?16:1), Math.floor(val)) : val;
      if (this.mode === 'draft'){
        const next = { ...this.store.groupDraft, params:{ ...this.store.groupDraft.params, [key]: v } };
        this.store.setGroupDraft(next);
        return;
      }
      this.store.updateCalculatedGroup(this.group.id, { [key]: v });
    },
    onPalette(i:number, color:string){
      if (!this.group) return;
      if (this.mode === 'draft'){
        const cp = [...this.store.groupDraft.colorPalette]; cp[i]=color;
        this.store.setGroupDraft({ colorPalette: cp });
        return;
      }
      const cp = this.group.colorPalette.slice(); cp[i]=color;
      this.group.colorPalette = cp;
      this.store.updateCalculatedGroup(this.group.id, {});
    },
    addPalette(){
      if (!this.group) return;
      if (this.mode === 'draft'){
        this.store.setGroupDraft({ colorPalette:[...this.store.groupDraft.colorPalette, "#ffffff"] });
        return;
      }
      this.group.colorPalette = [...this.group.colorPalette, "#ffffff"];
      this.store.updateCalculatedGroup(this.group.id, {});
    },
    removePalette(i:number){
      if (!this.group) return;
      if (this.mode === 'draft'){
        const cp = [...this.store.groupDraft.colorPalette]; cp.splice(i,1);
        if (!cp.length) cp.push("#ffffff");
        this.store.setGroupDraft({ colorPalette: cp });
        return;
      }
      const cp = this.group.colorPalette.slice(); cp.splice(i,1);
      if (!cp.length) cp.push("#ffffff");
      this.group.colorPalette = cp;
      this.store.updateCalculatedGroup(this.group.id, {});
    },
    recenter(){
      if (!this.group) return;
      // compute bbox center shift to origin-ish by keeping world pos; here just zero out rotation center
      const bbox = this.group.bbox;
      if (!bbox) return;
      const cx = bbox.x + bbox.w/2;
      const cy = bbox.y + bbox.h/2;
      this.store.updateCalculatedGroup(this.group.id, { cx, cy });
    },
    explode(){
      if (!this.group) return;
      this.store.explodeCalculatedGroup(this.group.id);
      // keep selection on first former track if available
      const first = this.store.tracks.find((t:any)=> !t.groupId && t.kind==='free');
      if (first) this.runtime?.controllers?.selection?.set(first.id);
    },
    deleteGroup(){
      if (!this.group) return;
      this.store.removeCalculatedGroup(this.group.id);
      this.runtime?.controllers?.selection?.clear();
    },
    selectTrack(id:string){ this.runtime?.controllers?.selection?.set(id); },
    duplicateGroup(){
      if (!this.group) return;
      const g = JSON.parse(JSON.stringify(this.group));
      g.id = `${g.id}-copy`;
      g.params.cx += 40;
      g.params.cy += 40;
      this.store.calcGroups.push(g);
      this.store._regenerateCalculatedGroups?.();
      this.runtime?.controllers?.selection?.set(g.id);
    },
    stageAll(){
      if (!this.group) return;
      this.store.stageAllGroupSnapNodes(this.group.id);
    },
    setAsDefault(){
      if (this.mode !== 'selected' || !this.group) return;
      this.store.setGroupDefaultsFromGroup(this.group.id);
    },
  }
});
</script>

<style scoped>
.form { display:flex; flex-direction:column; gap:10px; }
.block-title { font-weight:600; font-size:14px; }
.block-title.sm { font-size:12px; opacity:.7; margin-top:4px; }
.row { display:flex; align-items:center; gap:8px; }
.row span { font-size:12px; color:var(--muted); }
.txt, .sel, .num {
  background:#0f172a;
  border:1px solid rgba(255,255,255,0.15);
  color:var(--text);
  padding:4px 6px;
  border-radius:6px;
  font-size:12px;
}
.pill-row { display:flex; flex-wrap:wrap; gap:6px; }
.pill.link { background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.4); padding:2px 8px; border-radius:999px; cursor:pointer; font-size:11px; }
.palette { display:flex; flex-wrap:wrap; gap:8px; }
.pal-item { display:flex; align-items:center; gap:4px; }
.pal-item input[type=color]{ width:38px; height:28px; padding:0; border:none; background:transparent; }
.actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:6px; }
.danger { color:#ef4444; }
.secondary { color:#93c5fd; }
.small { font-size:11px; }
.muted.small { font-size:11px; opacity:.6; }
</style>