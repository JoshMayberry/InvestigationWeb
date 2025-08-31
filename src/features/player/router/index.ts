import { RouteDefinition } from '@shared/types'
import PlayerPage from '../pages/PlayerPage.vue'
import ImageSelectionPage from '../pages/ImageSelectionPage.vue'


export const routeDefinitions: Array<RouteDefinition> = [
  {
    path: '/player',
    component: PlayerPage,
    meta: { navigationLabel: 'Player' }
  },
  {
    path: '/image',
    component: ImageSelectionPage,
    meta: { navigationLabel: 'Image Selection' }
  },
];
