import { createRouter, createWebHistory } from 'vue-router'
import { RouteDefinition } from '@shared/types/router'
import GmPage from '../pages/GmPage.vue'
import PlayerPage from '../pages/PlayerPage.vue'
import TestPage from '../pages/Test3.vue'
import LegacyPage from '../pages/TestLegacy.vue'


export const routeDefinitions: Array<RouteDefinition> = [

  {
    path: '/player',
    component: PlayerPage,
    meta: { navigationLabel: 'Player' }
  },
  {
    path: '/gm',
    component: GmPage,
    meta: { navigationLabel: 'GM' }
  },
  {
    path: '/test',
    component: TestPage,
    meta: { navigationLabel: 'Test' }
  },
  {
    path: '/legacy',
    component: LegacyPage,
    meta: { navigationLabel: 'Legacy' }
  },
]
