<template>
  <div
    ref="tipRef"
    class="iw-node-tooltip"
    role="tooltip"
    :data-node="displayNode ? displayNode.id : null"
    :class="{ active: activeInternal }"
    :style="wrapperStyle"
  >
    <div class="inner" v-if="displayNode">
      <slot :node="displayNode">
        <div class="title">{{ displayNode.label || displayNode.id }}</div>
        <div v-if="displayNode.label" class="sub muted">ID: {{ displayNode.id }}</div>
        <div class="meta">
          <span class="pill">r={{ displayNode.r }}</span>
          <span class="pill" v-if="displayNode.color">{{ displayNode.color }}</span>
        </div>
      </slot>
      <div class="arrow" data-popper-arrow></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, watch, nextTick, ref } from "vue";
import type { NodeAny } from "../../types/node";
import { createPopper, Instance, VirtualElement } from "@popperjs/core";
import { InvestigationRuntime, RUNTIME_KEY } from "../../context/runtime";

export default defineComponent({
  name: "NodeTooltip",
  props: {
    node: { type: Object as () => NodeAny | null, required: false, default: null },
    active: { type: Boolean, default: false },
    placement: { type: String, default: "top" },
    padding: { type: Number, default: 4 },
    fadeMs: { type: Number, default: 140 }
  },
  setup(props){
    const runtime = inject(RUNTIME_KEY, null) as InvestigationRuntime | null;
    const inst = ref<Instance|null>(null);
    const virt = ref<VirtualElement|null>(null);
    const displayNode = ref<NodeAny|null>(null);
    const activeInternal = ref(false);
    const hidingTimer = ref<number|undefined>(undefined);
    const frozenRect = ref<DOMRect|null>(null);

    function view(){ return runtime?.controllers?.view; }

    function makeVirtual(node:NodeAny): VirtualElement {
      return {
        getBoundingClientRect: () => {
          if (frozenRect.value) return frozenRect.value;
          const svg = view()?.getSvgEl();
            if (!svg) {
              console.warn("No SVG element");
              return new DOMRect(0,0,0,0);
            }
          const t = view()?.transform;
          if (!t) {
            console.warn("No view transform");
            return new DOMRect(0,0,0,0);
          }
          const sx = node.x * t.k + t.x;
          const sy = node.y * t.k + t.y;
          const r = node.r || 12;
          const svgRect = svg.getBoundingClientRect();
          const x = svgRect.left + sx - r;
          const y = svgRect.top + sy - r;
          const size = r * 2;
          return new DOMRect(x, y, size, size);
        },
        contextElement: view()?.getSvgEl() || undefined
      };
    }

    function ensurePopper(node:NodeAny){
      const el = tipEl();
      if (!el) return;
      destroyPopper(false);
      virt.value = makeVirtual(node);
      inst.value = createPopper(virt.value, el, {
        placement: props.placement as any,
        strategy: "fixed",
        modifiers: [
          { name: "offset", options: { offset: [0, 10] } },
          { name: "preventOverflow", options: { padding: props.padding } },
          { name: "arrow", options: { padding: 6 } },
        ]
      });
    }

    function tipEl(){ return (tipRef.value as HTMLElement|null) || null; }

    function destroyPopper(clearRect:boolean){
      if (inst.value){
        inst.value.destroy();
        inst.value = null;
      }
      virt.value = null;
      if (clearRect) frozenRect.value = null;
    }

    function freeze(){
      if (!virt.value) return;
      frozenRect.value = virt.value.getBoundingClientRect();
    }

    function onEnterNode(node:NodeAny){
      if (hidingTimer.value) { clearTimeout(hidingTimer.value); hidingTimer.value = undefined; }
      frozenRect.value = null;
      displayNode.value = node;
      activeInternal.value = props.active;
      nextTick(()=> {
        ensurePopper(node);
        inst.value?.update();
      });
    }

    function onLeaveNode(){
      // Start fade-out but keep last rect
      freeze();
      activeInternal.value = false;
      hidingTimer.value = window.setTimeout(()=>{
        destroyPopper(false);
        displayNode.value = null;
        frozenRect.value = null;
        hidingTimer.value = undefined;
      }, props.fadeMs);
    }

    // Watchers
    watch(()=> props.node, (n, prev)=>{
      if (n) onEnterNode(n);
      else if (prev) onLeaveNode();
    });

    watch(()=> props.active, (a)=>{
      if (!displayNode.value) return;
      if (a){
        // reactivate same node
        frozenRect.value = null;
        activeInternal.value = true;
        inst.value?.update();
      } else {
        onLeaveNode();
      }
    });

    // Update on pan/zoom while visible
    watch(()=> [
      view()?.transform.k,
      view()?.transform.x,
      view()?.transform.y
    ], ()=>{
      if (activeInternal.value) inst.value?.update();
    });

    const tipRef = ref<HTMLElement|null>(null);

    return {
      runtime,
      tipRef,
      displayNode,
      activeInternal,
      wrapperStyle: {
        transition: `opacity ${props.fadeMs}ms`,
      },
      frozenRect
    };
  }
});
</script>

<style scoped>
.iw-node-tooltip {
  position: fixed;
  z-index: 3000;
  top:0;
  left:0;
  opacity:0;
  pointer-events:none;
  will-change: opacity;
}
.iw-node-tooltip.active { opacity:1; }
.inner {
  background: var(--panel);
  color: var(--text);
  font-size: 12px;
  line-height: 1.2;
  padding: 8px 10px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.10);
  box-shadow: 0 4px 18px -4px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06) inset;
  max-width: 220px;
}
.title { font-weight:600; font-size:13px; margin-bottom:2px; color: var(--accent); }
.sub { font-size:11px; margin-bottom:6px; }
.meta { display:flex; flex-wrap:wrap; gap:4px; margin-top:6px; }
.pill {
  background: rgba(255,255,255,0.06);
  padding: 2px 6px 3px;
  border-radius:6px;
  font-size:10px;
  letter-spacing:.3px;
  border:1px solid rgba(255,255,255,0.08);
}
.muted { color: var(--muted); }
.arrow {
  position:absolute;
  width:10px; height:10px;
  background: var(--panel);
  transform: rotate(45deg);
  z-index:-1;
}
[data-popper-placement^='top'] .arrow { bottom:-5px; }
[data-popper-placement^='bottom'] .arrow { top:-5px; }
[data-popper-placement^='left'] .arrow { right:-5px; }
[data-popper-placement^='right'] .arrow { left:-5px; }
</style>