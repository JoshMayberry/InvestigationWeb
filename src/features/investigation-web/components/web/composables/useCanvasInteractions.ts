// Replace file with this orchestrator
import { onMounted, onBeforeUnmount, watch, reactive, Ref } from "vue";
import { makeOverlapValidator } from "../../../context/validators/overlap";
import { useStashOverlay } from "./useStashOverlay";
import { useTrackInteractions } from "./useTrackInteractions";
import { useNodeInteractions } from "./useNodeInteractions";
import { useLinkInteractions } from "./useLinkInteractions";
import { useKeys } from "./useKeys";
import { useGridSnap } from "./useGridSnap";

export function useCanvasInteractions(params: {
  runtime: any;
  store: any;
  svgRef: Ref<any>;
}) {
  const { runtime, store, svgRef } = params;

  const state = reactive({
    overlayRect: { x: 0, y: 0, w: 120, h: 0 },
    shiftDown: false,
    altDown: false,
  });

  function getSvg(): SVGSVGElement | null {
    return svgRef?.value?.getSvg?.() || null;
  }

  // sub-composables
  const stash = useStashOverlay({ runtime, store });
  const tracks = useTrackInteractions({ runtime, store, getSvg });
  const nodes = useNodeInteractions({ runtime, store });
  const links = useLinkInteractions({ runtime, store });
  const keys = useKeys({ runtime, store });
  useGridSnap({ runtime, store, keys });

  // expose key state
  watch(() => keys.state.shiftDown, v => { state.shiftDown = v; });
  watch(() => keys.state.altDown, v => { state.altDown = v; });

  function installValidator() {
    if (!runtime) return;
    const drag = runtime.controllers?.drag;
    if (!store.settings.enforceNoOverlap) {
      drag?.setValidator(() => ({ valid: true }));
      return;
    }
    drag?.setValidator(
      makeOverlapValidator(
        () => store.nodes.map((n: any) => ({ id: n.id, x: n.x, y: n.y, r: n.r })),
        store.settings.nodePadding
      )
    );
  }

  function onResize(sz: { w: number; h: number }) {
    state.overlayRect = stash.onResize(sz);
  }

  function onContextMenu() {
    tracks.cancelAll?.();
    nodes.cancelAll?.();
    links.cancelAll?.();
    store.resetTools?.();
  }

  function isBackgroundClick(e: MouseEvent) {
    const el = e.target as Element | null;
    if (!el) return true;
    if (el.closest(".node")) return false;
    if (el.closest(".track")) return false;
    if (el.closest(".link")) return false;
    return true;
  }

  function onSvgClick(e: MouseEvent) {
    if (!runtime?.policy?.canEditStructure) return;
    if (tracks.onClick(e)) return;
    if (links.onClick(e)) return;
    if (nodes.onClick(e)) return;

    // background clears selection
    if (isBackgroundClick(e)) runtime.controllers.selection?.clear?.();
  }

  function onSvgPointerMove(e: PointerEvent) {
    if (!runtime?.policy?.canEditStructure) return;
    tracks.onPointerMove(e);
    links.onPointerMove(e);
    nodes.onPointerMove(e);
  }

  function onSvgPointerLeave(e: PointerEvent) {
    if (!runtime?.policy?.canEditStructure) return;
    nodes.onPointerLeave(e);
  }

  // lifecycle
  onMounted(() => {
    const svg = getSvg();
    if (svg) {
      svg.addEventListener("click", onSvgClick);
      svg.addEventListener("pointermove", onSvgPointerMove);
      svg.addEventListener("pointerleave", onSvgPointerLeave);
    }
    installValidator();
  });

  onBeforeUnmount(() => {
    const svg = getSvg();
    if (svg) {
      svg.removeEventListener("click", onSvgClick);
      svg.removeEventListener("pointermove", onSvgPointerMove);
      svg.removeEventListener("pointerleave", onSvgPointerLeave);
    }
    keys.dispose?.();
    tracks.dispose?.();
  });

  // watches
  watch(() => store.settings.enforceNoOverlap, installValidator);
  watch(() => store.settings.nodePadding, installValidator);
  watch(() => store.nodes, installValidator, { deep: true });

  return {
    state,
    onResize,
    onContextMenu,
  };
}