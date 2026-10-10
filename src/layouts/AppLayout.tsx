import { useEffect } from 'react'
import { NavLink, Outlet, useMatches } from 'react-router'
import { UserMenu } from '@/features/auth'
import { useAuthStore } from '@/stores'
import type { RouteMeta } from '@/types/router'

const navClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'font-semibold text-slate-900 dark:text-white' : 'hover:text-slate-900 dark:hover:text-white'

export function AppLayout() {
  // Select only what you need: the Zustand version of storeToRefs().
  const user = useAuthStore((state) => state.user)

  // route.meta.title -> document.title (the deepest matching route wins)
  const matches = useMatches()
  const title = [...matches]
    .reverse()
    .map((match) => (match.handle as RouteMeta | undefined)?.title)
    .find(Boolean)
  useEffect(() => {
    document.title = title ? title + ' | coloc.app' : 'coloc.app'
  }, [title])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
        <strong>coloc.app</strong>
        <nav className="flex flex-1 gap-4 text-slate-500 dark:text-slate-400">
          <NavLink className={navClass} to="/" end>Home</NavLink>
          <NavLink className={navClass} to="/counter">Counter</NavLink>
          <NavLink className={navClass} to="/about">About</NavLink>
          {user ? <NavLink className={navClass} to="/profile">Profile</NavLink> : <NavLink className={navClass} to="/login">Login</NavLink>}
        </nav>
        <UserMenu />
      </header>
      <main className="mx-auto max-w-2xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
