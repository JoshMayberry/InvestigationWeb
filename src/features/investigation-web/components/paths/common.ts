import { computed, inject } from "vue";
import { useInvestigationWebStore } from "../../stores/web";
import { RUNTIME_KEY } from "../../context/runtime";

export function useLinkCommon() {
  const runtime: any = inject(RUNTIME_KEY, null);
  const store = useInvestigationWebStore();
  const nodes = computed<any[]>(() => store.nodes || []);
  const settings = computed<any>(() => store.settings || {});
  const selection = computed<any>(() => runtime?.controllers?.selection);
  const hover = computed<any>(() => runtime?.controllers?.hover);

  const hitWidth = computed(() => {
    const base = 2;
    const r = Number(settings.value?.linkHitRadius ?? 10);
    return base + Math.max(0, r) * 2;
  });

  function getNode(id: string) { return nodes.value.find(n => n.id === id); }
  function isSel(id: string) { return selection.value?.id === id; }
  function isHover(id: string) { return hover.value?.id === id; }
  function onLinkPointerDown(id: string) {
    if (store?.tools?.addLink) return;
    selection.value?.set?.(id);
  }
  function onEnter(id: string) { hover.value?.set?.(id); }
  function onLeave() { hover.value?.clear?.(); }

  function lineBind(fromId: string, toId: string, pad: number) {
    const a = getNode(fromId); const b = getNode(toId);
    if (!a || !b) return {};
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const aOff = (a.r || 12) + (pad || 0);
    const bOff = (b.r || 12) + (pad || 0);
    return { x1: a.x + ux * aOff, y1: a.y + uy * aOff, x2: b.x - ux * bOff, y2: b.y - uy * bOff };
  }

  return { runtime, store, nodes, settings, hitWidth, getNode, isSel, isHover, onLinkPointerDown, onEnter, onLeave, lineBind };
}