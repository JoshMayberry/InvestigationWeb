import { RouteDefinition } from '@shared/types/router'
import PlayerPage from '../pages/PlayerPage.vue'


export const routeDefinitions: Array<RouteDefinition> = [
  {
    path: '/player',
    component: PlayerPage,
    meta: { navigationLabel: 'Player' }
  },
];
