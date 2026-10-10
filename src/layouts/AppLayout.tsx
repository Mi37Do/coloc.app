import { useEffect } from 'react'
import { NavLink, Outlet, useMatches } from 'react-router'
import { CalendarDays, House, MessageCircle, Plus, Settings } from 'lucide-react'
import { AddChoreSheet } from '@/features/chores'
import { useActiveHousehold } from '@/services/households'
import { useRealtime } from '@/services/realtime'
import { useUiStore } from '@/stores'
import { cn } from '@/utils/cn'
import type { RouteMeta } from '@/types/router'

const left = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/events', label: 'Schedule', icon: CalendarDays },
]
const right = [
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/profile', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  // route.meta.title -> document.title (the deepest matching route wins)
  const matches = useMatches()
  const title = [...matches]
    .reverse()
    .map((match) => (match.handle as RouteMeta | undefined)?.title)
    .find(Boolean)
  const hideTabBar = matches.some((match) => (match.handle as RouteMeta | undefined)?.hideTabBar)
  useEffect(() => {
    document.title = title ? title + ' · coloc' : 'coloc'
  }, [title])

  useRealtime()
  const { active } = useActiveHousehold()
  const addChoreOpen = useUiStore((state) => state.addChoreOpen)
  const setAddChoreOpen = useUiStore((state) => state.setAddChoreOpen)

  return (
    <div className="canvas">
      <main className="flex flex-1 flex-col gap-1.5">
        <Outlet />
      </main>

      {!hideTabBar && (
        <nav
          aria-label="Primary"
          className="sticky bottom-0 z-20 bg-ink px-3 pt-2 pb-[max(0.75rem,var(--safe-bottom))]"
        >
          <ul className="grid grid-cols-5 items-center">
            {left.map((tab) => (
              <Tab key={tab.to} {...tab} />
            ))}
            <li className="flex justify-center">
              <button
                onClick={() => setAddChoreOpen(true)}
                disabled={!active}
                aria-label="New chore"
                className="grid size-13 place-items-center rounded-full bg-paper text-ink transition-transform active:scale-95 disabled:opacity-40"
              >
                <Plus size={26} strokeWidth={2.5} aria-hidden />
              </button>
            </li>
            {right.map((tab) => (
              <Tab key={tab.to} {...tab} />
            ))}
          </ul>
        </nav>
      )}

      {active && <AddChoreSheet householdId={active.id} open={addChoreOpen} onClose={() => setAddChoreOpen(false)} />}
    </div>
  )
}

type TabProps = {
  to: string
  label: string
  icon: typeof House
  end?: boolean
}

function Tab({ to, label, icon: Icon, end }: TabProps) {
  return (
    <li className="flex justify-center">
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex h-14 w-16 flex-col items-center justify-center gap-0.5 rounded-2xl border-[1.5px] text-[11px] font-bold transition-colors',
            isActive ? 'border-sage text-paper' : 'border-transparent text-neutral-gray hover:text-paper',
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon size={22} strokeWidth={isActive ? 2.25 : 1.75} aria-hidden />
            <span className={cn(!isActive && 'sr-only')}>{label}</span>
          </>
        )}
      </NavLink>
    </li>
  )
}
