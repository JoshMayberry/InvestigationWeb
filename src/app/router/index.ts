// src/app/router/index.ts
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import GlobalDashboard from '@app/pages/GlobalDashboard.vue';
import {
  routeDefinitions as investigationWebRoutes,
 } from '@features/investigation-web/router';
import { RouteDefinition } from '@shared/types/router';

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
  ...investigationWebRoutes,
];

const router = createRouter({
  history: createWebHistory(),
  routes: routeDefinitions,
});

export default router;
