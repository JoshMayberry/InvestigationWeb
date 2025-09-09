<template>
  <g class="links">
    <template v-for="l in store.links" :key="l.id">
      <!-- Straight -->
      <template v-if="l.type === 'straight'">
        <line
          v-if="getNode(l.from) && getNode(l.to)"
          v-bind="lineBind(l.from, l.to, l.pad || 0)"
          class="hit"
          stroke="rgba(0,0,0,0)"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <line
          v-if="getNode(l.from) && getNode(l.to)"
          v-bind="lineBind(l.from, l.to, l.pad || 0)"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>

      <!-- Curved -->
      <template v-else-if="l.type === 'curved'">
        <path
          v-if="curvedPath(l)"
          :d="curvedPath(l)!"
          class="hit"
          stroke="rgba(0,0,0,0)"
          fill="none"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <path
          v-if="curvedPath(l)"
          :d="curvedPath(l)!"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          fill="none"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>

      <!-- Bezier -->
      <template v-else-if="l.type === 'bezier'">
        <path
          v-if="bezierPath(l)"
          :d="bezierPath(l)!"
          class="hit"
          stroke="rgba(0,0,0,0)"
          fill="none"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <path
          v-if="bezierPath(l)"
          :d="bezierPath(l)!"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          fill="none"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>

      <!-- Spline -->
      <template v-else-if="l.type === 'spline'">
        <path
          v-if="splinePath(l)"
          :d="splinePath(l)!"
          class="hit"
          stroke="rgba(0,0,0,0)"
          fill="none"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <path
          v-if="splinePath(l)"
          :d="splinePath(l)!"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          fill="none"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>

      <!-- Corkscrew (still supported) -->
      <template v-else-if="l.type === 'corkscrew'">
        <path
          v-if="corkscrewPath(l)"
          :d="corkscrewPath(l)!"
          class="hit"
          stroke="rgba(0,0,0,0)"
          fill="none"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <path
          v-if="corkscrewPath(l)"
          :d="corkscrewPath(l)!"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          fill="none"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>

      <!-- Spiral (true Archimedean between A and B) -->
      <template v-else>
        <path
          v-if="spiralPath(l)"
          :d="spiralPath(l)!"
          class="hit"
          stroke="rgba(0,0,0,0)"
          fill="none"
          :stroke-width="hitWidth"
          vector-effect="non-scaling-stroke"
          pointer-events="stroke"
          @pointerdown.stop="onLinkPointerDown(l.id)"
          @click.stop
          @mouseenter="onEnter(l.id)"
          @mouseleave="onLeave(l.id)"
        />
        <path
          v-if="spiralPath(l)"
          :d="spiralPath(l)!"
          :class="{ sel: isSel(l.id), hovered: isHover(l.id) }"
          :style="{ color: l.color }"
          stroke="currentColor"
          fill="none"
          :stroke-dasharray="dash(l.stroke)"
          stroke-width="2"
          stroke-opacity="0.9"
          vector-effect="non-scaling-stroke"
          :marker-end="l.arrowHead ? 'url(#iw-arrow-head)' : undefined"
        />
      </template>
    </template>
  </g>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import { RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "WebLinks",
  data(){ return { runtime: inject(RUNTIME_KEY, null) as any }; },
  computed:{
    store(): any { return this.runtime?.store; },
    nodes(): any[] { return this.store?.nodes || []; },
    selId(): string|null { return this.runtime?.controllers?.selection?.id || null; },
    hoverId(): string|null { return this.runtime?.controllers?.hover?.id || null; },
    hitWidth(): number {
      const base = 2;
      const r = Number(this.store?.settings?.linkHitRadius ?? 10);
      return base + Math.max(0, r) * 2;
    }
  },
  methods:{
    getNode(id:string){ return this.nodes.find(n => n.id === id); },
    isSel(id:string){ return this.selId === id; },
    isHover(id:string){ return this.hoverId === id; },
    onLinkPointerDown(id:string){
      if (this.store?.tools?.addLink) return;
      this.runtime?.controllers?.selection?.set(id);
    },
    onEnter(id:string){ this.runtime?.controllers?.hover?.set(id); },
    onLeave(id:string){ this.runtime?.controllers?.hover?.clear(); },
    dash(s:string){ return s === "dashed" ? "6 4" : (s === "dotted" ? "2 4" : undefined); },

    lineBind(fromId:string, toId:string, pad:number){
      const a = this.getNode(fromId); const b = this.getNode(toId);
      if (!a || !b) return {};
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len, uy = dy / len;
      const aOff = (a.r || 12) + (pad || 0);
      const bOff = (b.r || 12) + (pad || 0);
      return { x1: a.x + ux * aOff, y1: a.y + uy * aOff, x2: b.x - ux * bOff, y2: b.y - uy * bOff };
    },

    curvedPath(l:any): string | null {
      const a = this.getNode(l.from); const b = this.getNode(l.to);
      if (!a || !b) return null;
      const pad = l.pad || 0;

      // Trim endpoints
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx/dist, uy = dy/dist;
      const nx = -uy, ny = ux;
      const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
      const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
      const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;

      let ctrls: {x:number;y:number}[] = [];
      if (Array.isArray(l.midControls) && l.midControls.length) {
        ctrls = l.midControls.map((c:any) => {
          const t = Math.max(0, Math.min(100, Number(c.t))) / 100;
          const off = Math.max(-100, Math.min(100, Number(c.off))) / 100;
          const px = s.x + ux * (t * segLen);
          const py = s.y + uy * (t * segLen);
          const ox = nx * (off * segLen);
          const oy = ny * (off * segLen);
          return { x: px + ox, y: py + oy };
        });
      } else if (Array.isArray(l.midpoints) && l.midpoints.length) {
        ctrls = l.midpoints.slice();
      }

      const pts = [s, ...ctrls, e];
      let d = `M ${pts[0].x} ${pts[0].y}`;
      if (pts.length === 2) { d += ` L ${pts[1].x} ${pts[1].y}`; return d; }
      for (let i = 1; i < pts.length - 1; i++) {
        const ctrl = pts[i];
        const next = pts[i+1];
        const end = i < pts.length - 2 ? { x:(ctrl.x+next.x)/2, y:(ctrl.y+next.y)/2 } : next;
        d += ` Q ${ctrl.x} ${ctrl.y} ${end.x} ${end.y}`;
      }
      return d;
    },

    // Old “spiral” kept as corkscrew
    corkscrewPath(l:any): string | null {
      const a = this.getNode(l.from); const b = this.getNode(l.to);
      if (!a || !b) return null;
      const turns = l.turns ?? 1;
      const startR = l.startRadius ?? 10;
      const endR = l.endRadius ?? 60;
      const dir = l.direction ?? 1;
      const pad = l.pad || 0;

      const vx = b.x - a.x, vy = b.y - a.y;
      const L = Math.hypot(vx, vy) || 1;
      const ux = vx / L, uy = vy / L;
      const nx = -uy, ny = ux;

      const sOff = (a.r||12) + pad;
      const eOff = (b.r||12) + pad;
      const A = { x: a.x + ux * sOff, y: a.y + uy * sOff };
      const B = { x: b.x - ux * eOff, y: b.y - uy * eOff };
      const seg = { x: B.x - A.x, y: B.y - A.y };
      const len = Math.hypot(seg.x, seg.y) || 1;

      const steps = Math.max(40, Math.floor(Math.abs(turns) * 60));
      const pts: {x:number;y:number}[] = [];
      for (let i=0;i<=steps;i++){
        const t = i / steps;
        const theta = dir * (2*Math.PI*turns) + 0 * t; // sweep along; amplitude below
        const r = startR + (endR - startR) * t;
        const sx = r * Math.cos(theta * t);
        const sy = r * Math.sin(theta * t);
        const px = (len) * t;
        const lx = px + sx * 0.2;
        const ly = sy * 0.2;
        pts.push({ x: A.x + lx*ux + ly*nx, y: A.y + lx*uy + ly*ny });
      }
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i=1;i<pts.length;i++){ d += ` L ${pts[i].x} ${pts[i].y}`; }
      return d;
    },

    // True Archimedean spiral segment: ends stay on nodes.
    spiralPath(l:any): string | null {
      const a = this.getNode(l.from); 
      const b = this.getNode(l.to);
      if (!a || !b) return null;

      // inputs
      const turns = Number.isFinite(l.turns) ? Math.max(0, l.turns) : 1;
      const dir: 1|-1 = (l.direction ?? 1) as any;
      const r1i = Math.max(1, Number(l.startRadius ?? 10));
      const r2i = Math.max(1, Number(l.endRadius ?? 60));
      const pad = l.pad || 0;

      // Trim endpoints to node borders
      const dx = b.x - a.x, dy = b.y - a.y;
      const L = Math.hypot(dx, dy) || 1;
      const ux = dx / L, uy = dy / L;
      const A = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
      const B = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };

      // Build center C so that |A-C|=r1, |B-C|=r2 (choose side by dir)
      let r1 = r1i, r2 = r2i;
      const D = Math.hypot(B.x - A.x, B.y - A.y) || 1e-6;
      const vx = (B.x - A.x) / D, vy = (B.y - A.y) / D;
      const px = -vy, py = vx; // unit perp
      const aLen = (r1*r1 - r2*r2 + D*D) / (2*D);
      let h2 = r1*r1 - aLen*aLen;
      // If infeasible, clamp to tangential solution
      if (h2 < 0) h2 = 0;
      const P = { x: A.x + vx * aLen, y: A.y + vy * aLen };
      const h = Math.sqrt(h2);
      const C = dir === 1
        ? { x: P.x + px * h, y: P.y + py * h }
        : { x: P.x - px * h, y: P.y - py * h };

      // Polar at C
      const thA = Math.atan2(A.y - C.y, A.x - C.x);
      const thB0 = Math.atan2(B.y - C.y, B.x - C.x);
      const rA = Math.hypot(A.x - C.x, A.y - C.y);
      const rB = Math.hypot(B.x - C.x, B.y - C.y);

      // Smallest rotation from thA to thB0 in chosen direction
      let base = thB0 - thA;
      // normalize to (-PI, PI]
      base = Math.atan2(Math.sin(base), Math.cos(base));
      const baseDir = dir === 1 ? (base < 0 ? base + 2*Math.PI : base)
                                : (base > 0 ? base - 2*Math.PI : base);
      const thB = thA + baseDir + dir * (2*Math.PI * turns);

      // Solve r = a0 + c*theta for (thA,rA) and (thB,rB)
      const denom = (thB - thA) || (dir*1e-6);
      const c = (rB - rA) / denom;
      const a0 = rA - c * thA;

      // Sample spiral
      const steps = Math.max(80, Math.floor(Math.abs(thB - thA) * 24));
      const pts: {x:number;y:number}[] = [];
      for (let i=0;i<=steps;i++){
        const t = i/steps;
        const th = thA + (thB - thA) * t;
        const r = a0 + c * th;
        pts.push({ x: C.x + r*Math.cos(th), y: C.y + r*Math.sin(th) });
      }
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i=1;i<pts.length;i++){ d += ` L ${pts[i].x} ${pts[i].y}`; }
      return d;
    },

    bezierPath(l:any): string | null {
      const a = this.getNode(l.from), b = this.getNode(l.to);
      if (!a || !b) return null;
      const pad = l.pad || 0;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const nx = -uy, ny = ux;
      const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
      const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
      const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;
      let c1 = l.c1 || { t:25, off:30 }, c2 = l.c2 || { t:75, off:-30 };
      if (l.symmetric) {
        c2 = { t: 100 - c1.t, off: -c1.off };
      }
      const p1 = { x: s.x + ux * (Math.max(0,Math.min(100,c1.t))/100*segLen) + nx * ((Math.max(-100,Math.min(100,c1.off))/100)*segLen),
                   y: s.y + uy * (Math.max(0,Math.min(100,c1.t))/100*segLen) + ny * ((Math.max(-100,Math.min(100,c1.off))/100)*segLen) };
      const p2 = { x: s.x + ux * (Math.max(0,Math.min(100,c2.t))/100*segLen) + nx * ((Math.max(-100,Math.min(100,c2.off))/100)*segLen),
                   y: s.y + uy * (Math.max(0,Math.min(100,c2.t))/100*segLen) + ny * ((Math.max(-100,Math.min(100,c2.off))/100)*segLen) };
      return `M ${s.x} ${s.y} C ${p1.x} ${p1.y} ${p2.x} ${p2.y} ${e.x} ${e.y}`;
    },

    splinePath(l:any): string | null {
      const a = this.getNode(l.from), b = this.getNode(l.to);
      if (!a || !b) return null;
      const pad = l.pad || 0;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist, uy = dy / dist;
      const nx = -uy, ny = ux;
      const s = { x: a.x + ux * ((a.r||12)+pad), y: a.y + uy * ((a.r||12)+pad) };
      const e = { x: b.x - ux * ((b.r||12)+pad), y: b.y - uy * ((b.r||12)+pad) };
      const segLen = Math.hypot(e.x - s.x, e.y - s.y) || 1;

      const controls = (l.controls && l.controls.length ? l.controls : [{ t: 50, off: 0 }]).map((c:any)=>{
        const t = Math.max(0, Math.min(100, Number(c.t))) / 100;
        const off = Math.max(-100, Math.min(100, Number(c.off))) / 100;
        return {
          x: s.x + ux * (t * segLen) + nx * (off * segLen),
          y: s.y + uy * (t * segLen) + ny * (off * segLen)
        };
      });

      const pts = [s, ...controls, e];
      if (pts.length === 2) return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;

      // Catmull-Rom to cubic Bezier (uniform, with tension)
      const tParam = Math.max(0, Math.min(1, Number(l.tension ?? 0.25)));
      const k = (1 - tParam) / 6; // scale for handles
      const P = (i:number) => pts[Math.max(0, Math.min(pts.length-1, i))];
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i=0;i<pts.length-1;i++){
        const p0 = P(i-1), p1 = P(i), p2 = P(i+1), p3 = P(i+2);
        const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k };
        const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k };
        d += ` C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
      }
      return d;
    },
  }
});
</script>

<style scoped>
.links path.hovered:not(.sel),
.links line.hovered:not(.sel) {
  filter: drop-shadow(0 0 4px rgba(96,165,250,0.65));
}
.links path.sel,
.links line.sel {
  stroke: var(--accent);
  stroke-width: 3;
  stroke-opacity: 1;
  filter: drop-shadow(0 0 6px rgba(96,165,250,0.9));
}
.hit { cursor: pointer; }
</style>