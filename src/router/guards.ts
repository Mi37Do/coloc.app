import { redirect, type LoaderFunctionArgs } from 'react-router'
import { useAuthStore } from '@/stores'

// Navigation guards. In Vue this is router.beforeEach((to) => { ... return '/login' }).
// Here a guard is a loader: return null to continue, throw redirect() to go elsewhere.
// Stores are readable outside components with getState(), like useAuthStore() in a guard.

/** Signed in with a confirmed email */
export function requireAuth({ request }: LoaderFunctionArgs) {
  const { user } = useAuthStore.getState()
  if (!user) {
    const { pathname, search } = new URL(request.url)
    throw redirect('/login?redirect=' + encodeURIComponent(pathname + search))
  }
  if (user.emailVerified === false) throw redirect('/verify')
  return null
}

/** Signed in, email not confirmed yet */
export function requireUnverified() {
  const { user } = useAuthStore.getState()
  if (!user) throw redirect('/login')
  if (user.emailVerified !== false) throw redirect('/')
  return null
}

export function guestOnly() {
  if (useAuthStore.getState().user) throw redirect('/')
  return null
}
