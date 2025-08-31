// src/app/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import GlobalDashboard from '@app/pages/GlobalDashboard.vue';
import { routeDefinitions as investigationWebRoutes } from '@features/player/router';
import { routeDefinitions as soundboardRoutes } from '@features/soundboard/router';
import { routeDefinitions as playerRoutes } from '@features/investigation-web/router';
import { RouteDefinition } from '@shared/types';

const baseRoutes: Array<RouteDefinition> = [
  {
    path: '/',
    name: 'dashboard',
    component: GlobalDashboard,
    meta: { navigationLabel: 'Dashboard', navOrder: 0 },
  },
];

export const routeDefinitions: Array<RouteDefinition> = [
  ...baseRoutes,
  ...playerRoutes,
  ...investigationWebRoutes,
  ...soundboardRoutes
];

const router = createRouter({
  history: createWebHistory(),
  routes: routeDefinitions,
});

export default router;
