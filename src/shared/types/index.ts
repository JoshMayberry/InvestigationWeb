import { RouteRecordRaw } from "vue-router"

export type RouteDefinition = Omit<RouteRecordRaw, 'meta'> &  {
  path: string
  pathBase?: string
  props?: boolean
  component: any
  meta: {
    navigationLabel: string
    navOrder?: number
  }
}

export type DrawerMeta = { icon?: string; label?: string };
