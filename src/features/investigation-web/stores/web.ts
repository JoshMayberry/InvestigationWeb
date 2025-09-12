import { defineStore } from "pinia";
import { createInitialState } from "./web.state";
import { webGetters } from "./web.getters";
import { settingsActions } from "./slices/web.actions.settings";
import { policyActions } from "./slices/web.actions.policy";
import { filterActions } from "./slices/web.actions.filters";
import { nodeActions } from "./slices/web.actions.nodes";
import { linkActions } from "./slices/web.actions.links";
import { snapshotActions } from "./slices/web.actions.snapshot";
import { discoveryActions } from "./slices/web.actions.discovery";
import { trackActions } from "./slices/web.actions.tracks";
import { calcGroupActions } from "./slices/web.actions.calcGroups";
import { simulationActions } from "./slices/web.actions.simulation";
import { presetActions } from "./slices/web.actions.presets";
import { customFieldActions } from "./slices/web.actions.customFields";

export const useInvestigationWebStore = defineStore("investigationWeb", {
  state: () => createInitialState(),
  getters: webGetters as any,
  actions: {
    ...settingsActions,
    ...policyActions,
    ...filterActions,
    ...nodeActions,
    ...linkActions,
    ...trackActions,
    ...calcGroupActions,
    ...snapshotActions,
    ...discoveryActions,
    ...simulationActions,
    ...presetActions,
    ...customFieldActions,
  },
  setRuntime(runtime: any) {
    (this as any).runtime = runtime;
  },
});