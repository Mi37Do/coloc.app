import { redirect, type LoaderFunctionArgs } from 'react-router'
import { useAuthStore } from '@/stores'

// Navigation guards. In Vue this is router.beforeEach((to) => { ... return '/login' }).
// Here a guard is a loader: return null to continue, throw redirect() to go elsewhere.
// Stores are readable outside components with getState(), like useAuthStore() in a guard.

export function requireAuth({ request }: LoaderFunctionArgs) {
  if (!useAuthStore.getState().user) {
    const { pathname, search } = new URL(request.url)
    throw redirect('/login?redirect=' + encodeURIComponent(pathname + search))
  }
  return null
}

export function guestOnly() {
  if (useAuthStore.getState().user) throw redirect('/')
  return null
}
