import type { RouteObject } from 'react-router'
import { AppLayout } from '@/layouts/AppLayout'
import { guestOnly, requireAuth } from './guards'

// The routes array, like Vue Router's. Differences worth knowing:
//   - children render where the parent layout puts <Outlet /> (= <RouterView />)
//   - lazy() is the dynamic import: component: () => import('...')
//   - handle is meta: read it with useMatches() (see AppLayout)
//   - loader runs before the route renders, so it is where beforeEnter / guards live
export const routes: RouteObject[] = [
  {
    path: '/',
    Component: AppLayout,
    children: [
      {
        index: true,
        handle: { title: 'Home' },
        lazy: async () => ({ Component: (await import('@/pages/HomePage')).HomePage }),
      },
      {
        path: 'login',
        handle: { title: 'Login' },
        loader: guestOnly,
        lazy: async () => ({ Component: (await import('@/pages/LoginPage')).LoginPage }),
      },
      {
        path: 'profile',
        handle: { title: 'Profile' },
        loader: requireAuth, // meta: { requiresAuth: true }
        lazy: async () => ({ Component: (await import('@/pages/ProfilePage')).ProfilePage }),
      },
      {
        path: 'counter',
        handle: { title: 'Counter' },
        lazy: async () => ({ Component: (await import('@/pages/CounterPage')).CounterPage }),
      },
      {
        path: 'about',
        handle: { title: 'About' },
        lazy: async () => ({ Component: (await import('@/pages/AboutPage')).AboutPage }),
      },
      {
        path: '*', // Vue: path: '/:pathMatch(.*)*'
        handle: { title: 'Not found' },
        lazy: async () => ({ Component: (await import('@/pages/NotFoundPage')).NotFoundPage }),
      },
    ],
  },
]
