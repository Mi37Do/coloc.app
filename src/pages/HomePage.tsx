import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Bell, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TopPanel } from '@/components/ui/TopPanel'
import { WeekStrip } from '@/components/ui/WeekStrip'
import { CreateHousehold, TaskCard, monthProgress } from '@/features/chores'
import {
  useActiveHousehold,
  useChores,
  useDeleteChore,
  useMembers,
  useToggleChore,
} from '@/services/households'
import { useUnreadCount } from '@/services/notifications'
import { useShoppingLists } from '@/services/shopping'
import { useBalances } from '@/services/bills'
import { formatMoney } from '@/utils/money'
import { useAuthStore, useUiStore } from '@/stores'
import type { Chore, Household } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { greeting, isSameDay, startOfDay } from '@/utils/dates'
import { cn } from '@/utils/cn'

const longDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long' })

export function HomePage() {
  const { active, isPending, isError, refetch } = useActiveHousehold()
  const [day, setDay] = useState(() => startOfDay(new Date()))

  return (
    <>
      <Header day={day} onDay={setDay} />
      {isPending ? (
        <PanelSkeleton />
      ) : isError ? (
        <LoadError onRetry={refetch} />
      ) : !active ? (
        <CreateHousehold />
      ) : (
        <Board household={active} day={day} />
      )}
    </>
  )
}

function Header({ day, onDay }: { day: Date; onDay: (d: Date) => void }) {
  const user = useAuthStore((state) => state.user)
  const { data: unread = 0 } = useUnreadCount()
  const bell = (
    <Link to="/notifications" className="icon-btn relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
      <Bell size={20} aria-hidden />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-mint bg-blush" aria-hidden />
      )}
    </Link>
  )

  return (
    <TopPanel
      bar={
        <>
          {user && <Avatar person={user} />}
          <p className="min-w-0 flex-1 truncate text-[17px] font-bold">
            {greeting()}, {user?.firstname}
          </p>
          {bell}
        </>
      }
    >
      <div className="flex items-center gap-3">
        {user && <Avatar person={user} size="lg" />}
        <h1 className="min-w-0 flex-1 text-[22px] leading-tight font-bold">
          {greeting()},
          <br />
          <span className="truncate">{user?.firstname}</span>
        </h1>
        {bell}
      </div>

      <WeekStrip day={day} onDay={onDay} />
    </TopPanel>
  )
}

type Tab = 'mine' | 'roomies'

/** Chores for a day: due that day; on today, also anything overdue or undated that's still open. */
function choresForDay(chores: Chore[], day: Date) {
  const today = startOfDay(new Date())
  const isToday = isSameDay(day, today)
  return chores
    .filter((c) => {
      if (c.dueAt && isSameDay(new Date(c.dueAt), day)) return true
      if (!isToday || c.status === 'done') return false
      return !c.dueAt || new Date(c.dueAt) < today
    })
    .sort((a, b) => (a.status === b.status ? (a.dueAt ?? '').localeCompare(b.dueAt ?? '') : a.status === 'todo' ? -1 : 1))
}

function Board({ household, day }: { household: Household; day: Date }) {
  const me = useAuthStore((state) => state.user)
  const setAddChoreOpen = useUiStore((state) => state.setAddChoreOpen)
  const openAddChore = () => setAddChoreOpen(true)
  const { data: chores, isPending, isError, refetch } = useChores(household.id)
  const { data: members = [] } = useMembers(household.id)
  const toggle = useToggleChore(household.id)
  const remove = useDeleteChore(household.id)
  const [tab, setTab] = useState<Tab>('mine')
  const [deleting, setDeleting] = useState<Chore>()

  const all = useMemo(() => chores ?? [], [chores])
  const progress = monthProgress(all)
  const dayChores = useMemo(() => choresForDay(all, day), [all, day])
  const visible = dayChores.filter((c) => (tab === 'mine' ? c.assigneeId === me?.id : c.assigneeId !== me?.id))
  const isAdmin = members.some((m) => m.userId === me?.id && m.role === 'admin')
  const isToday = isSameDay(day, new Date())

  const onToggle = (chore: Chore) =>
    toggle.mutate(chore, {
      onSuccess: () => chore.status === 'todo' && toast.success(`Nice, "${chore.title}" is done`),
      onError: (e) => toast.error(apiErrorMessage(e, 'Could not update the chore')),
    })

  return (
    <>
      <Link to="/household" className="panel flex flex-col gap-3" aria-label={`${household.name}, ${progress.percent}% of chores done this month`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-[17px] font-bold">{household.name}</h2>
          <span className="flex items-center gap-1">
            <AvatarStack people={members.map((m) => m.user)} />
            <ChevronRight size={18} aria-hidden />
          </span>
        </div>
        <div className="meter meter--light">
          <span style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="text-sm font-semibold">
          {progress.percent}% of this month's chores are completed
        </p>
      </Link>

      <QuickTiles householdId={household.id} />

      <section className="panel panel--butter flex flex-1 flex-col gap-4 pb-6" aria-labelledby="tasks-title">
        <h2 id="tasks-title" className="text-[17px] font-bold">
          {isToday ? "Today's tasks" : `${longDayFmt.format(day)}'s tasks`}
        </h2>

        <div className="segmented" role="tablist" aria-label="Whose tasks">
          <button role="tab" aria-selected={tab === 'mine'} onClick={() => setTab('mine')}>
            My tasks
          </button>
          <button role="tab" aria-selected={tab === 'roomies'} onClick={() => setTab('roomies')}>
            Roomies tasks
          </button>
        </div>

        {isPending ? (
          <TileSkeleton />
        ) : isError ? (
          <LoadError onRetry={refetch} inline />
        ) : visible.length === 0 ? (
          <div className="tile flex flex-col items-center gap-3 py-8 text-center">
            <span className="text-5xl" aria-hidden>
              {all.length === 0 ? '🧽' : '🌿'}
            </span>
            <p className="font-bold">
              {all.length === 0
                ? 'No chores yet'
                : tab === 'mine'
                  ? 'Nothing on your list'
                  : 'Your roomies are all clear'}
            </p>
            <p className="muted max-w-60 text-sm font-medium">
              {all.length === 0 ? 'Add the first one and share the load.' : 'Pick another day, or add something new.'}
            </p>
            <Button className="mt-1" onClick={openAddChore}>
              Add a chore
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2.5">
              {visible.map((chore) => (
                <TaskCard
                  key={chore.id}
                  chore={chore}
                  meId={me?.id}
                  showAssignee={tab === 'roomies'}
                  canDelete={isAdmin || chore.createdById === me?.id}
                  onToggle={onToggle}
                  onDelete={setDeleting}
                />
              ))}
            </ul>
            <p className="muted text-center text-xs font-semibold">Tap or swipe a task for actions</p>
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!deleting}
        title="Delete this chore?"
        description={deleting ? `"${deleting.title}" will be removed for everyone.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting, { onError: (e) => toast.error(apiErrorMessage(e, 'Could not delete the chore')) })
        }
        onClose={() => setDeleting(undefined)}
      />
    </>
  )
}

/** Shopping and Bills at a glance, one tap from Home */
function QuickTiles({ householdId }: { householdId: string }) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: lists } = useShoppingLists(householdId)
  const { data: balances } = useBalances(householdId)
  const toBuy = lists?.reduce((sum, l) => sum + (l.remainingCount ?? 0), 0)
  const mine = balances?.[0]
  const net = mine?.members.find((m) => m.userId === meId)?.netCents ?? 0

  const tile = 'panel flex min-h-28 flex-col justify-between gap-3 p-4 transition-transform active:scale-[0.98]'
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Link to="/shopping" className={cn(tile, 'panel--sky')}>
        <span className="flex items-center justify-between">
          <span className="text-3xl" aria-hidden>
            🛒
          </span>
          <ChevronRight size={18} aria-hidden />
        </span>
        <span>
          <span className="block font-bold">Shopping</span>
          <span className="block text-sm font-semibold">
            {toBuy === undefined ? '…' : toBuy ? `${toBuy} to buy` : 'Nothing to buy'}
          </span>
        </span>
      </Link>
      <Link to="/bills" className={cn(tile, net < 0 ? 'panel--blush' : 'panel--mint')}>
        <span className="flex items-center justify-between">
          <span className="text-3xl" aria-hidden>
            🧾
          </span>
          <ChevronRight size={18} aria-hidden />
        </span>
        <span>
          <span className="block font-bold">Bills</span>
          <span className="block text-sm font-semibold tabular-nums">
            {!balances
              ? '…'
              : net > 0
                ? `You're owed ${formatMoney(net, mine!.currency)}`
                : net < 0
                  ? `You owe ${formatMoney(-net, mine!.currency)}`
                  : 'All square'}
          </span>
        </span>
      </Link>
    </div>
  )
}

function TileSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[84px] animate-pulse rounded-tile bg-paper/70" />
      ))}
    </div>
  )
}

function PanelSkeleton() {
  return (
    <>
      <div className="panel h-28 animate-pulse bg-paper/80" />
      <div className="panel panel--butter flex-1">
        <TileSkeleton />
      </div>
    </>
  )
}

function LoadError({ onRetry, inline = false }: { onRetry: () => void; inline?: boolean }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 text-center', inline ? 'tile py-8' : 'panel flex-1 justify-center')}>
      <span className="text-5xl" aria-hidden>
        🔌
      </span>
      <p className="font-bold">Couldn't load your chores</p>
      <p className="muted text-sm font-medium">Check your connection, then try again.</p>
      <Button variant="light" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
