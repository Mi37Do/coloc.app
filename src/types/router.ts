// The shape of a route's handle, the equivalent of Vue Router's RouteMeta.
export interface RouteMeta {
  title?: string
  /** Full-screen views (e.g. a chat thread) hide the bottom tab bar */
  hideTabBar?: boolean
}
