import { reactive } from "vue";
import type { ViewPolicy } from "../types";
import { createSelectionController } from "./controllers/selectionController";
import { createHoverController } from "./controllers/hoverController";
import { createViewController } from "./controllers/viewController";
import { createDragController } from "./controllers/dragController";
import { createNodePlacementController } from "./controllers/nodePlacementController";
import { createStashController } from "./controllers/stashController";
import { createShortcutsController } from "./controllers/shortcutsController";
import { createUndoController } from "./controllers/undoController";
import { createLinkPlacementController } from "./controllers/linkPlacementController";

export const RUNTIME_KEY = "investigationRuntime";

export interface InvestigationRuntime {
  controllers: {
    selection: ReturnType<typeof createSelectionController>;
    hover: ReturnType<typeof createHoverController>;
    view: ReturnType<typeof createViewController>;
    drag: ReturnType<typeof createDragController>;
    nodePlacement: ReturnType<typeof createNodePlacementController>;
    stash: ReturnType<typeof createStashController>;
    shortcuts: ReturnType<typeof createShortcutsController>;
    undo: ReturnType<typeof createUndoController>;
    linkPlacement: ReturnType<typeof createLinkPlacementController>;
  };
  store: any;
  policy: ViewPolicy;
  setPolicy(p: ViewPolicy): void;
  setStore(store: any): void;
}

export function createInvestigationRuntime(store: any | null, policy: ViewPolicy): InvestigationRuntime {
  // Define mutable holder BEFORE passing to controllers (fix TDZ error)
  let storeHolder: any = store;

  const selection = createSelectionController();
  const hover = createHoverController();
  const view = createViewController();
  const drag = createDragController(view);
  const stash = createStashController(view);
  const shortcuts = createShortcutsController();
  const nodePlacement = createNodePlacementController(drag, selection, view, storeHolder);
  const linkPlacement = createLinkPlacementController(view, storeHolder, { set: (id: string) => selection.set(id) });
  const undo = createUndoController(() => (storeHolder?.settings?.undoCoalesceMs ?? 300));

  function assertStore(op: string) {
    if (!storeHolder) {
      console.error(`[runtime] store is null during ${op}. Call runtime.setStore(store) after Pinia init.`);
      return false;
    }
    return true;
  }

  shortcuts.register("escape", () => {
    if (drag.isActive()) drag.cancel();
    if (linkPlacement.isActive()) linkPlacement.cancel();
  });
  shortcuts.register("ctrl+z", () => undo.undo());
  shortcuts.register("ctrl+shift+z", () => undo.redo());
  shortcuts.register("ctrl+y", () => undo.redo());
  shortcuts.register("delete", () => {
    if (!assertStore("delete")) return;
    const id = selection.get();
    if (!id) return;
    storeHolder.deleteLink?.(id);
    storeHolder.deleteNode?.(id);
    selection.clear();
  });

  function nudge(dx: number, dy: number) {
    if (!assertStore("nudge")) return;
    const id = selection.get();
    if (!id) return;
    const node = storeHolder.nodes?.find((n: any) => n.id === id);
    if (!node) return;
    const before = { x: node.x, y: node.y };
    const after = { x: node.x + dx, y: node.y + dy };
    undo.push({
      label: "move-node-nudge",
      do: () => storeHolder.patchNode(id, after),
      undo: () => storeHolder.patchNode(id, before)
    });
  }
  shortcuts.register("arrowup", () => nudge(0, -1));
  shortcuts.register("arrowdown", () => nudge(0, 1));
  shortcuts.register("arrowleft", () => nudge(-1, 0));
  shortcuts.register("arrowright", () => nudge(1, 0));

  const runtime = reactive<InvestigationRuntime>({
    controllers: {
      selection,
      hover,
      view,
      drag,
      nodePlacement,
      stash,
      shortcuts,
      undo,
      linkPlacement
    },
    store: storeHolder,
    policy,
    setPolicy(p) { runtime.policy = p; },
    setStore(s) {
      storeHolder = s;
      runtime.store = s;
      nodePlacement.setStore(s);
      linkPlacement.setStore(s);
    }
  });

  window.addEventListener("keydown", (e) => {
    runtime.controllers.shortcuts.handle(e);
  });

  return runtime;
}