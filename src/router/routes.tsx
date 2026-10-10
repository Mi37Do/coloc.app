import type { RouteObject } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { RouteErrorPage } from '@/pages/RouteErrorPage'
import { guestOnly, requireAuth, requireUnverified } from './guards'

// The routes array, like Vue Router's. Differences worth knowing:
//   - children render where the parent layout puts <Outlet /> (= <RouterView />)
//   - lazy() is the dynamic import: component: () => import('...')
//   - handle is meta: read it with useMatches() (see AppLayout)
//   - loader runs before the route renders, so it is where beforeEnter / guards live
// Shown while the first route's loader/lazy import resolves on page load.
function HydrateFallback() {
  return <div className="canvas" aria-busy="true" />
}

export const routes: RouteObject[] = [
  {
    // Full-screen, no tab bar
    path: '/login',
    handle: { title: 'Sign in' },
    loader: guestOnly,
    HydrateFallback,
    ErrorBoundary: RouteErrorPage,
    lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
  },
  {
    path: '/register',
    handle: { title: 'Create account' },
    loader: guestOnly,
    HydrateFallback,
    ErrorBoundary: RouteErrorPage,
    lazy: async () => ({ Component: (await import('@/pages/RegisterPage')).RegisterPage }),
  },
  {
    path: '/verify',
    handle: { title: 'Confirm your email' },
    loader: requireUnverified,
    HydrateFallback,
    ErrorBoundary: RouteErrorPage,
    lazy: async () => ({ Component: (await import('@/pages/VerifyEmailPage')).VerifyEmailPage }),
  },
  {
    // Opened from a shared invite link; works signed in or out
    path: '/join/:token',
    handle: { title: 'Join a household' },
    HydrateFallback,
    ErrorBoundary: RouteErrorPage,
    lazy: async () => ({ Component: (await import('@/pages/JoinPage')).JoinPage }),
  },
  {
    path: '/',
    Component: AppLayout,
    HydrateFallback,
    ErrorBoundary: RouteErrorPage,
    loader: requireAuth, // meta: { requiresAuth: true }, inherited by every tab
    children: [
      {
        index: true,
        handle: { title: 'Home' },
        lazy: async () => ({ Component: (await import('@/pages/HomePage')).HomePage }),
      },
      {
        path: 'household',
        handle: { title: 'Household' },
        lazy: async () => ({ Component: (await import('@/pages/HouseholdPage')).HouseholdPage }),
      },
      {
        path: 'shopping',
        handle: { title: 'Shopping' },
        lazy: async () => ({ Component: (await import('@/pages/ShoppingPage')).ShoppingPage }),
      },
      {
        path: 'shopping/:listId',
        handle: { title: 'Shopping list' },
        lazy: async () => ({ Component: (await import('@/pages/ShoppingListPage')).ShoppingListPage }),
      },
      {
        path: 'bills',
        handle: { title: 'Bills' },
        lazy: async () => ({ Component: (await import('@/pages/BillsPage')).BillsPage }),
      },
      {
        path: 'chat',
        handle: { title: 'Chat' },
        lazy: async () => ({ Component: (await import('@/pages/ChatPage')).ChatPage }),
      },
      {
        path: 'chat/:conversationId',
        handle: { title: 'Chat', hideTabBar: true },
        lazy: async () => ({ Component: (await import('@/pages/ChatThreadPage')).ChatThreadPage }),
      },
      {
        path: 'events',
        handle: { title: 'Schedule' },
        lazy: async () => ({ Component: (await import('@/pages/SchedulePage')).SchedulePage }),
      },
      {
        path: 'events/:eventId',
        handle: { title: 'Event' },
        lazy: async () => ({ Component: (await import('@/pages/EventPage')).EventPage }),
      },
      {
        path: 'notifications',
        handle: { title: 'Notifications' },
        lazy: async () => ({ Component: (await import('@/pages/NotificationsPage')).NotificationsPage }),
      },
      {
        path: 'profile',
        handle: { title: 'Settings' },
        lazy: async () => ({ Component: (await import('@/pages/ProfilePage')).ProfilePage }),
      },
      {
        path: '*', // Vue: path: '/:pathMatch(.*)*'
        handle: { title: 'Not found' },
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
]
