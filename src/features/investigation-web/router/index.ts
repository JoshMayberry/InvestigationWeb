import { RouteDefinition } from '@shared/types'
import InvestigationWebPage from '../pages/InvestigationWebPage.vue'


export const routeDefinitions: Array<RouteDefinition> = [
  {
    path: '/web',
    component: InvestigationWebPage,
    meta: { navigationLabel: 'Web' }
  },
];
