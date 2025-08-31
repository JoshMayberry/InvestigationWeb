import { RouteDefinition } from '@shared/types'
import SoundboardPage from '../pages/SoundboardPage.vue'


export const routeDefinitions: Array<RouteDefinition> = [
  {
    path: '/soundboard',
    component: SoundboardPage,
    meta: { navigationLabel: 'Soundboard' }
  },
];
