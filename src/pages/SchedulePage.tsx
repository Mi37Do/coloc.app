import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Clock, MapPin, Plus } from 'lucide-react'
import { AvatarStack } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { TopPanel } from '@/components/ui/TopPanel'
import { WeekStrip } from '@/components/ui/WeekStrip'
import { CreateHousehold } from '@/features/chores'
import { EventSheet } from '@/features/events/EventSheet'
import { eventDays, eventEmoji, formatTimeRange } from '@/features/events/event-utils'
import { useEvents } from '@/services/events'
import { useActiveHousehold, useChores, useMembers } from '@/services/households'
import type { Chore, HouseholdEvent, Member } from '@/types/api'
import { choreEmoji } from '@/utils/chore-art'
import { formatClock, isSameDay, startOfDay, toISODate, weekOf } from '@/utils/dates'
import { cn } from '@/utils/cn'

const dayTitle = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const shortDay = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

export function SchedulePage() {
  const { active, isPending } = useActiveHousehold()
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [adding, setAdding] = useState(false)

  // Events for the visible week, for the dots and the day agenda
  const week = weekOf(day)
  const weekEnd = new Date(week[6].getFullYear(), week[6].getMonth(), week[6].getDate(), 23, 59, 59)
  const { data: weekEvents = [] } = useEvents(active?.id, week[0], weekEnd)
  const marked = useMemo(() => new Set(weekEvents.filter((e) => !e.cancelledAt).flatMap(eventDays)), [weekEvents])

  return (
    <>
      <TopPanel
        bar={
          <>
            <p className="min-w-0 flex-1 truncate font-display text-xl">Schedule</p>
            <AddButton onClick={() => setAdding(true)} disabled={!active} />
          </>
        }
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[30px] leading-[1.1]">Schedule</h1>
          <AddButton onClick={() => setAdding(true)} disabled={!active} />
        </div>
        <WeekStrip day={day} onDay={setDay} marked={marked} />
      </TopPanel>

      {isPending ? (
        <div className="panel h-40 animate-pulse" aria-busy="true" />
      ) : !active ? (
        <CreateHousehold />
      ) : (
        <>
          <DayAgenda householdId={active.id} day={day} events={weekEvents} onAdd={() => setAdding(true)} />
          <Upcoming householdId={active.id} />
          <EventSheet householdId={active.id} open={adding} onClose={() => setAdding(false)} day={day} />
        </>
      )}
    </>
  )
}

function AddButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button className="icon-btn" onClick={onClick} disabled={disabled} aria-label="New event">
      <Plus size={22} aria-hidden />
    </button>
  )
}

type AgendaItem = { kind: 'event'; at: number; event: HouseholdEvent } | { kind: 'chore'; at: number; chore: Chore }

/** The selected day as a timeline: events and timed chores, in order */
function DayAgenda({ householdId, day, events, onAdd }: { householdId: string; day: Date; events: HouseholdEvent[]; onAdd: () => void }) {
  const { data: chores = [] } = useChores(householdId)
  const { data: members = [] } = useMembers(householdId)
  const key = toISODate(day)

  const items: AgendaItem[] = [
    ...events.filter((e) => eventDays(e).includes(key)).map((event) => ({ kind: 'event' as const, at: new Date(event.startsAt).getTime(), event })),
    ...chores
      .filter((c) => c.dueAt && isSameDay(new Date(c.dueAt), day))
      .map((chore) => ({ kind: 'chore' as const, at: new Date(chore.dueAt!).getTime(), chore })),
  ].sort((a, b) => a.at - b.at)

  return (
    <section className="panel flex flex-col gap-3" aria-labelledby="day-title">
      <h2 id="day-title" className="text-[17px] font-bold">
        {isSameDay(day, new Date()) ? 'Today' : dayTitle.format(day)}
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-4xl" aria-hidden>
            🌤️
          </span>
          <p className="font-bold">Nothing planned</p>
          <Button variant="light" className="mt-1" onClick={onAdd}>
            Plan something
          </Button>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-2.5 border-l-2 border-dashed border-line pl-4">
          {items.map((item) =>
            item.kind === 'event' ? (
              <li key={item.event.id} className="relative">
                <TimelineDot />
                <EventCard event={item.event} members={members} />
              </li>
            ) : (
              <li key={item.chore.id} className="relative">
                <TimelineDot light />
                <Link
                  to="/"
                  className={cn(
                    'flex items-center gap-3 rounded-tile bg-ivory p-3',
                    item.chore.status === 'done' && 'opacity-50',
                  )}
                >
                  <span className="text-2xl" aria-hidden>
                    {choreEmoji(item.chore.title)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block truncate font-bold', item.chore.status === 'done' && 'line-through')}>
                      {item.chore.title}
                    </span>
                    <span className="muted block text-sm font-semibold">
                      Chore · {formatClock(item.chore.dueAt!)}
                      {item.chore.assignee && ` · ${item.chore.assignee.firstname}`}
                    </span>
                  </span>
                </Link>
              </li>
            ),
          )}
        </ol>
      )}
    </section>
  )
}

function TimelineDot({ light = false }: { light?: boolean }) {
  return (
    <span
      className={cn('absolute top-5 -left-[23px] size-3 rounded-full border-2 border-ink', light ? 'bg-paper' : 'bg-butter')}
      aria-hidden
    />
  )
}

/** Next events from today on, beyond the selected week */
function Upcoming({ householdId }: { householdId: string }) {
  const [from] = useState(() => startOfDay(new Date()))
  const { data: events = [], isPending } = useEvents(householdId, from)
  const { data: members = [] } = useMembers(householdId)
  const upcoming = events.filter((e) => !e.cancelledAt).slice(0, 10)

  return (
    <section className="panel panel--butter flex flex-1 flex-col gap-3 pb-6" aria-labelledby="upcoming-title">
      <h2 id="upcoming-title" className="text-[17px] font-bold">
        Coming up
      </h2>
      {isPending ? (
        <div className="h-24 animate-pulse rounded-tile bg-paper/70" aria-busy="true" />
      ) : upcoming.length === 0 ? (
        <p className="muted py-4 text-center text-sm font-semibold">No upcoming events. Dinner on Friday? 🍝</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {upcoming.map((e) => (
            <li key={e.id}>
              <EventCard event={e} members={members} showDay />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EventCard({ event, members, showDay = false }: { event: HouseholdEvent; members: Member[]; showDay?: boolean }) {
  const going = event.participants
    .filter((p) => p.response === 'going')
    .map((p) => members.find((m) => m.userId === p.userId)?.user)
    .filter((u) => !!u)
  const cancelled = !!event.cancelledAt

  return (
    <Link
      to={`/events/${event.id}`}
      className={cn('tile tile--outline flex items-center gap-3 transition-transform active:scale-[0.99]', cancelled && 'opacity-60')}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-butter text-2xl" aria-hidden>
        {eventEmoji(event.title)}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[17px] font-bold', cancelled && 'line-through')}>{event.title}</span>
        <span className="flex flex-wrap items-center gap-x-3 text-sm font-semibold">
          <span className="flex items-center gap-1">
            <Clock size={14} aria-hidden />
            {showDay && `${shortDay.format(new Date(event.startsAt))}, `}
            {formatTimeRange(event.startsAt, event.endsAt)}
          </span>
          {event.location && (
            <span className="muted flex min-w-0 items-center gap-1 truncate">
              <MapPin size={14} aria-hidden /> {event.location}
            </span>
          )}
        </span>
        {cancelled && <span className="badge mt-1 bg-blush">Cancelled</span>}
      </span>
      {going.length > 0 && <AvatarStack people={going} max={3} />}
    </Link>
  )
}
