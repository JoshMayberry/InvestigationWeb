<template>
  <g
    class="node"
    :data-id="node.id"
    :class="{ dim, sel: isSelected, hovered: isHovered, undiscovered: (!node.discovered && store.currentMode==='discovery') }"
    :transform="`translate(${node.x},${node.y})`"
    ref="el"
    @pointerdown="onPointerDown"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @click.stop
  >
    <circle
      v-if="isSelected"
      class="halo"
      :r="(node.r||12)+8"
      fill="rgba(96,165,250,0.18)"
      stroke="rgba(96,165,250,0.5)"
      stroke-width="1.5"
      pointer-events="none"
    />
    <circle
      class="core"
      :r="node.r || 12"
      :fill="node.color || '#10b981'"
      stroke="#15204e"
      stroke-width="2"
    />
    <circle
      v-if="(node.bonuses?.length || 0) > 0"
      class="bonus-dot"
      :cx="(node.r||12) * 0.7"
      :cy="-(node.r||12) * 0.7"
      r="3.5"
      fill="var(--ok, #10b981)"
      stroke="rgba(255,255,255,0.9)"
      stroke-width="1"
      pointer-events="none"
    />
    <circle
      v-if="canEdit && node.locked"
      class="lock-dot"
      :cx="-(node.r||12) * 0.7"
      :cy="-(node.r||12) * 0.7"
      r="3.5"
      fill="#f59e0b"
      stroke="rgba(255,255,255,0.9)"
      stroke-width="1"
      pointer-events="none"
    />
    <circle
      v-if="(canEdit || isSimulationMode) && (node.kind!=='snap')"
      :class="node.sim?.enabled ? 'sim-ring' : ''"
      :r="(node.r||12)+4"
      fill="none"
      :stroke="node.sim?.enabled ? '#f59e0b' : '#999999'"
      stroke-width="1.5"
      stroke-dasharray="4 3"
      pointer-events="none"
    />
    <text
      v-if="showLabel"
      class="label"
      :transform="labelTransform"
      :text-anchor="textAnchor"
      :style="labelCss"
      pointer-events="none"
    >{{ node.label }}</text>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import type { NodeAny } from "../../types/node";
import { RUNTIME_KEY } from "../../context/runtime";
import { useInvestigationWebStore } from "../../stores/web";
import { projectPointToTrack, fastProjectPointToTrack, getTrackBBox } from "../../stores/util/trackGeometry"; // ADD

const MOVE_THRESHOLD = 3;

export default defineComponent({
  name: "NodeDot",
  props: {
    node: { type: Object as () => NodeAny, required: true },
    dim: { type: Boolean, default: false },
  },
  data(){
    return {
      runtime: null as any,
      store: useInvestigationWebStore(),
      pointerDown:false,
      moved:false,
      startClient:{ x:0, y:0 },
      wasSelectedAtDragStart: false,
      snapDragging: false,
      snapDragTrack: null as any,
      snapDragT: 0,
      // added placeholders used during snap drag
      storeRef: null as any,
      view: null as any,
      thresh: () => 32,
      simDragActive:false,
      simDragLast:{ x:0, y:0 },
      simDragOffset:{ x:0, y:0 },
    };
  },
  computed:{
    selCtrl(): any { return this.runtime?.controllers?.selection; },
    hoverCtrl(): any { return this.runtime?.controllers?.hover; },
    dragCtrl(): any { return this.runtime?.controllers?.drag; },
    stashCtrl(): any { return this.runtime?.controllers?.stash; },
    viewCtrl(): any { return this.runtime?.controllers?.view; },
    canEdit(): boolean { return !!this.store?.policy?.canEditStructure; },
    canDiscover(): boolean { return !!this.store?.policy?.canDiscover; },
    isSelected(): boolean { return !!this.selCtrl?.is(this.node.id); },
    isHovered(): boolean { return !!this.hoverCtrl?.is(this.node.id); },
    placingActive(): boolean {
      const ghost = this.dragCtrl?.ghost;
      return !!ghost && (ghost.mode === "add-free" || ghost.mode === "place-staged");
    },
    addLinkActive(): boolean { return !!this.store?.tools?.addLink; },
    isSimulationMode(): boolean { return this.store.currentMode === 'simulation'; },
    discovered(): boolean { return !!this.node.discovered; },
    showLabel(): boolean {
      if (!this.node.label) return false;
      const mode = this.node.labelStyle?.mode || 'angle';
      if (mode === 'hidden') return false;
      return true;
    },
    labelConfig(): any {
      const ls = this.node.labelStyle || {};
      return {
        mode: ls.mode || 'angle',
        angle: typeof ls.angle === 'number' ? ls.angle : 0,
        offsetX: ls.offsetX ?? 0,
        offsetY: ls.offsetY ?? 0,
        rotation: ls.rotation ?? 0,
        fontSize: ls.fontSize ?? 11,
        fontWeight: ls.fontWeight || 'normal',
        fontStyle: ls.fontStyle || 'normal',
        color: ls.color || '#c8d3ff',
        margin: ls.margin ?? 4
      };
    },
    labelTransform(): string {
      if (!this.showLabel) return '';
      const r = this.node.r || 12;
      const cfg = this.labelConfig;
      if (cfg.mode === 'free'){
        return `translate(${cfg.offsetX},${cfg.offsetY}) rotate(${cfg.rotation})`;
      }
      // angle mode
      // angle 0 = top (subtract 90° to convert to standard)
      const rad = (cfg.angle - 90) * Math.PI / 180;
      const dist = r + cfg.margin + 2;
      const x = Math.cos(rad) * dist;
      const y = Math.sin(rad) * dist;
      return `translate(${x.toFixed(2)},${y.toFixed(2)})`;
    },
    textAnchor(): string {
      const m = this.labelConfig.mode;
      if (m === 'free') return 'middle';
      // angle-based dynamic anchor (optional simple heuristic)
      const a = ((this.labelConfig.angle % 360)+360)%360;
      if (a > 45 && a < 135) return 'middle';
      if (a > 225 && a < 315) return 'middle';
      return 'middle';
    },
    labelCss(): string {
      const cfg = this.labelConfig;
      const dim = (!this.discovered && this.store.currentMode === 'discovery');
      return `
        font-size:${cfg.fontSize}px;
        font-weight:${cfg.fontWeight};
        font-style:${cfg.fontStyle};
        fill:${cfg.color};
        opacity:${dim ? 0.35 : 0.95};
      `;
    }
  },
  created(){ this.runtime = inject(RUNTIME_KEY, null); },
  methods:{
    onEnter(){ this.hoverCtrl?.set(this.node.id); },
    onLeave(){ this.hoverCtrl?.clear(); },
    onPointerDown(e:PointerEvent){
      // Simulation-mode direct drag (bypasses normal edit restrictions)
      if (this.isSimulationMode){
        if (!this.store.simulation.running){
          this.store.startSimulation();
          this.store.updateSimSettings({ alpha: Math.max(this.store.simulation.alpha, this.store.simulation.minAlphaOnInteract || 0.25) });
        }

        e.stopPropagation(); e.preventDefault();
        // Only allow free nodes (snap nodes stay fixed) – adjust if you want snaps movable too
        if (this.node.kind === 'snap') return;
        const w = this.viewCtrl.worldFromClient(e.clientX, e.clientY);
        this.simDragActive = true;
        this.simDragLast = { x: w.x, y: w.y };
        this.simDragOffset = { x: this.node.x - w.x, y: this.node.y - w.y };
        if (!this.node.sim) this.node.sim = { enabled:false };
        this.node.sim.dragging = true;
        // Zero velocity while grabbed
        this.node.sim.vx = 0; this.node.sim.vy = 0;
        window.addEventListener("pointermove", this.onSimDragMove);
        window.addEventListener("pointerup", this.onSimDragUp, { once:true });
        return;
      }

      // --- Relink mode handling: intercept clicks and reassign link endpoint instead of selecting node ---
      try {
        if (this.store.currentEditState === "relink" && this.store.tools?.relinkTarget) {
          e.stopPropagation(); e.preventDefault();
          const linkId = this.store.tools.relinkTarget as string;
          const link = (this.store.links || []).find((l:any)=> l.id === linkId);
          if (!link) {
            // nothing to relink -> cancel
            this.store.tools.relinkTarget = null;
            this.store.setCurrentEditState?.("none");
            return;
          }
          const clickedId = this.node.id;
          // Clicking the same node as an existing endpoint cancels relink per spec
          if (clickedId === link.from || clickedId === link.to) {
            this.store.tools.relinkTarget = null;
            this.store.setCurrentEditState?.("none");
            return;
          }
          // Default behavior: replace the "to" endpoint with the clicked node
          const before = { from: link.from, to: link.to };
          const after = { from: link.from, to: clickedId };
          // Push undo if available
          try {
            const u = this.runtime?.controllers?.undo;
            if (u?.push) {
              u.push({
                label: "relink",
                before, after,
                do: ()=> this.store.patchLink(linkId, after),
                undo: ()=> this.store.patchLink(linkId, before)
              });
            } else {
              this.store.patchLink(linkId, after);
            }
          } catch (err) {
            this.store.patchLink(linkId, after);
          }
          // Finish relinking
          this.store.tools.relinkTarget = null;
          this.store.setCurrentEditState?.("edit-selected-node");
          // keep selection on the link: select it if selection controller exists
          try { this.runtime?.controllers?.selection?.set?.(linkId); } catch(e){}
          return;
        }
      } catch (e) { console.log("possible error?", e); /* non-fatal - fall through to normal behavior */ }

      // --- existing non-simulation logic below (unchanged) ---
      // Discovery mode: toggle discovered state (respect mode rules)
      if (this.canDiscover && !this.canEdit) {
        e.stopPropagation(); e.preventDefault();
        this.store?.toggleDiscover?.(this.node.id);
        return;
      }
      if (!this.canEdit) return;
      if (this.node.locked) { // do not drag locked nodes
        e.stopPropagation();
        // toggle selection only
        if (this.isSelected) this.selCtrl?.clear(); else this.selCtrl?.set(this.node.id);
        return;
      }
      // In Add Link mode, clicking nodes should set source/target, not toggle or drag
      if (this.addLinkActive) {
        e.stopPropagation();
        e.preventDefault();
        const lp = this.runtime?.controllers?.linkPlacement;
        if (lp && !lp.isActive()) {
          const d = this.store.linkDraft;
          lp.start(d.type, d.color, d.stroke);
        }
        this.runtime?.controllers?.linkPlacement?.tryCommit(this.node.id, { shift: e.shiftKey });
        return;
      }
      if (this.placingActive) return; // disable interaction while placing nodes
      e.stopPropagation();
      e.preventDefault();
      this.pointerDown = true;
      this.moved = false;
      this.startClient = { x:e.clientX, y:e.clientY };
      window.addEventListener("pointermove", this.onMove);
      window.addEventListener("pointerup", this.onUp, { once:true });
      window.addEventListener("keydown", this.onEsc);
    },
    onMove(e:PointerEvent){
      if (!this.pointerDown) return;
      const dx = e.clientX - this.startClient.x;
      const dy = e.clientY - this.startClient.y;
      if (!this.moved && (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD)) {
        this.moved = true;
        if (this.node.kind === "snap") {
          this.store?.setCurrentEditState?.("drag-snap-node");
        } else {
          this.store?.setCurrentEditState?.("drag-free-node");
        }
        this.wasSelectedAtDragStart = this.isSelected;
        this.dragCtrl?.startNode(this.node.id, {
          x:this.node.x, y:this.node.y, r:this.node.r,
          color:this.node.color, label:this.node.label
        });
        // Snap validator only for snap nodes
        if (this.node.kind === "snap") {
          this.storeRef = this.store;
          this.view = this.viewCtrl;
          this.thresh = () => this.storeRef.settings.snapPlacementThreshold || this.storeRef.settings.slideTrackThreshold || 32;
          this.dragCtrl?.setValidator((g:any)=>{
            const thresh = this.thresh();
            let best = Infinity;
            // quick pass: bbox rejection
            for (const t of this.storeRef.tracks){
              const bb = getTrackBBox(t);
              // expand bbox by threshold once (inflate)
              const dx = g.x < bb.x ? bb.x - g.x : (g.x > bb.x+bb.w ? g.x - (bb.x+bb.w) : 0);
              const dy = g.y < bb.y ? bb.y - g.y : (g.y > bb.y+bb.h ? g.y - (bb.y+bb.h) : 0);
              const approxDist = dx || dy ? Math.hypot(dx,dy) : 0;
              if (approxDist > thresh) continue;
              const proj = fastProjectPointToTrack(t, g.x, g.y);
              if (proj.dist < best) best = proj.dist;
              if (best <= 2) break;
            }
            return { valid: best <= thresh };
          });
        } else {
          this.dragCtrl?.setValidator(()=>({ valid:true }));
        }
      }
      if (this.moved){
        this.dragCtrl?.updatePointer(e.clientX, e.clientY);
      }
    },
    onUp(e:PointerEvent){
      const wasMoved = this.moved;
      const ghost = this.dragCtrl?.ghost;
      const wasSelectedBefore = this.isSelected;
      this.cleanup();
      if (!wasMoved){
        if (!this.addLinkActive) {
          if (wasSelectedBefore) {
            this.selCtrl?.clear();
            this.store?.setCurrentEditState?.("none");
          } else {
            this.selCtrl?.set(this.node.id);
            this.store?.setCurrentEditState?.("edit-selected-node");
          }
        }
        if (ghost?.active && ghost.mode === "drag-node") this.dragCtrl?.cancel();
        return;
      }
      if (!ghost?.active || ghost.mode !== "drag-node"){
        this.dragCtrl?.cancel(); this.store?.setCurrentEditState?.("none"); return;
      }
      const svg = this.viewCtrl?.getSvgEl();
      if (svg){
        const r = svg.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom){
          this.dragCtrl?.cancel(); this.store?.setCurrentEditState?.("none"); return;
        }
      }
      // stash drop
      if (this.stashCtrl?.isClientPointIn(e.clientX, e.clientY)){
        this.store?.moveNodeToStaging?.(ghost.sourceId);
        if (this.selCtrl?.get() === ghost.sourceId) this.selCtrl?.clear();
        this.dragCtrl?.cancel();
        this.store?.setCurrentEditState?.("none");
        return;
      }
      if (ghost.invalid){
        this.dragCtrl?.cancel(); this.store?.setCurrentEditState?.("none"); return;
      }
      const id = this.node.id;
      const before = { x: this.node.x, y: this.node.y };
      const after = { x: ghost.x, y: ghost.y };
      // INSERT inside onUp before undo push for snap nodes:
      if (this.node.kind === "snap"){
        const afterPos = { x: ghost.x, y: ghost.y };
        let proj = null as any;
        for (const t of this.store.tracks){
          const p = projectPointToTrack(t, afterPos.x, afterPos.y);
            if (!proj || p.dist < proj.dist) proj = { ...p, track: t };
        }
        if (proj){
          const segCount = Math.max(1, (proj.track.segments||1));
          const segIdx = Math.min(segCount-1, Math.floor(proj.t * segCount));
          this.node.trackSegment = segIdx;
          
          const moveThresh = 64;
          const oldTrack = this.node.trackId;
          const newTrack = proj.track.id;
          if (newTrack !== oldTrack && proj.dist <= moveThresh){
            this.node.trackId = newTrack;
            this.store._recalcSnapTrackLayout(oldTrack);
            this.store._recalcSnapTrackLayout(newTrack, proj.t, this.node.id);
          } else {
            this.store._recalcSnapTrackLayout(oldTrack, proj.t, this.node.id);
          }
        }
        // keep selection if it was selected at start
        if (this.wasSelectedAtDragStart) this.selCtrl?.set(this.node.id);
        this.dragCtrl?.cancel();
        this.store?.setCurrentEditState?.("edit-selected-node");
        return;
      }
      this.runtime.controllers.undo.push({
        label: "move-node",
        _coalesceKey: `move-node:${id}`,
        before,
        after,
        do: () => this.store?.patchNode?.(id, after),
        undo: () => this.store?.patchNode?.(id, before)
      });
      this.dragCtrl?.cancel();
      if (this.wasSelectedAtDragStart) {
        this.selCtrl?.set(this.node.id);
        this.store.suppressClearSelectionUntil = Date.now() + 150;
      }
      this.store?.setCurrentEditState?.(this.wasSelectedAtDragStart ? "edit-selected-node" : "none");
    },
    onEsc(e:KeyboardEvent){
      if (e.key === "Escape"){
        this.dragCtrl?.cancel();
        this.dragCtrl?.setValidator(()=>({ valid:true }));
        // cancel relink if active
        if (this.store.currentEditState === "relink") {
          this.store.tools.relinkTarget = null;
        }
        this.store?.setCurrentEditState?.("none");
        this.cleanup();
      }
    },
    projectT(ev:PointerEvent, track:any){
      const w = this.viewCtrl.worldFromClient(ev.clientX, ev.clientY);
      const dx = track.p2.x - track.p1.x;
      const dy = track.p2.y - track.p1.y;
      const len2 = dx*dx + dy*dy || 1;
      let t = ((w.x - track.p1.x)*dx + (w.y - track.p1.y)*dy)/len2;
      if (t < 0) t = 0; else if (t > 1) t = 1;
      return t;
    },
    cleanup(){
      this.pointerDown = false;
      window.removeEventListener("pointermove", this.onMove);
      window.removeEventListener("keydown", this.onEsc);
      if (this.snapDragging){
        window.removeEventListener("pointermove", this.onSnapMove);
      }
    },
    onSimDragMove(e:PointerEvent){
      if (!this.simDragActive) return;
      const w = this.viewCtrl.worldFromClient(e.clientX, e.clientY);
      const nx = w.x + this.simDragOffset.x;
      const ny = w.y + this.simDragOffset.y;
      // Compute instantaneous velocity (simple)
      const vx = (w.x - this.simDragLast.x);
      const vy = (w.y - this.simDragLast.y);
      this.node.x = nx;
      this.node.y = ny;
      this.node.sim.vx = vx;
      this.node.sim.vy = vy;
      this.simDragLast = { x: w.x, y: w.y };
      if (this.store.simulation){
        if (!this.store.simulation.running) this.store.startSimulation();
        if (this.store.simulation.alpha < (this.store.simulation.minAlphaOnInteract||0.25)){
          this.store.simulation.alpha = this.store.simulation.minAlphaOnInteract||0.25;
        }
      }
    },
    onSimDragUp(){
      if (!this.simDragActive) return;
      this.simDragActive = false;
      if (this.node.sim){
        // Release: allow physics to take over with last set velocity
        delete this.node.sim.dragging;
      }
      window.removeEventListener("pointermove", this.onSimDragMove);
    },
  }
});
</script>

<style scoped>
.node { cursor: pointer; user-select: none; transition: filter .15s, opacity .15s; }
.mode-dragging .node { cursor: grabbing; }
.node.dim .core, .node.dim .label { opacity:.25; }
.node.hovered:not(.sel) .core { filter: drop-shadow(0 0 4px rgba(96,165,250,0.6)); }
.halo { pointer-events:none; }
.node.sel .core { filter: drop-shadow(0 0 6px rgba(96,165,250,0.9)); }
.bonus-dot { filter: drop-shadow(0 0 4px rgba(16,185,129,0.8)); }
.sim-ring { animation: pulse 2.2s linear infinite; opacity:0.7; }
.node.undiscovered .core { opacity:.35; }
@keyframes pulse {
  0% { stroke-dashoffset:0; }
  100% { stroke-dashoffset: -14; }
}
</style>