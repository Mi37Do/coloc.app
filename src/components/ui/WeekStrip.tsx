import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { ChevronDown } from 'lucide-react'
import { Calendar } from './Calendar'
import { isSameDay, startOfDay, toISODate, weekOf } from '@/utils/dates'
import { cn } from '@/utils/cn'

const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' })
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' })
const longDayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })

type Props = {
  day: Date
  onDay: (d: Date) => void
  /** "YYYY-MM-DD" days that get a dot (e.g. days with events) */
  marked?: Set<string>
}

/** Month button (opens the calendar) + Mon–Sun strip; the selected day is a black pill. */
export function WeekStrip({ day, onDay, marked }: Props) {
  const today = startOfDay(new Date())

  return (
    <>
      <div className="mt-6 mb-3 flex items-center justify-between">
        <Popover>
          <PopoverButton
            className="group flex items-center gap-1 rounded-full text-xl font-bold"
            aria-label={`Choose a day, showing ${monthFmt.format(day)}`}
          >
            {monthFmt.format(day)}{' '}
            <ChevronDown size={20} className="transition-transform group-data-open:rotate-180" aria-hidden />
          </PopoverButton>
          <PopoverPanel anchor="bottom start" transition className="popover">
            {({ close }) => (
              <Calendar
                value={day}
                onChange={(d) => {
                  onDay(d)
                  close()
                }}
              />
            )}
          </PopoverPanel>
        </Popover>
        {!isSameDay(day, today) && (
          <button className="text-sm font-bold underline underline-offset-4" onClick={() => onDay(today)}>
            Today
          </button>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Pick a day">
        {weekOf(day).map((d) => {
          const selected = isSameDay(d, day)
          const dot = marked?.has(toISODate(d))
          return (
            <button
              key={d.toISOString()}
              onClick={() => onDay(d)}
              aria-pressed={selected}
              aria-label={longDayFmt.format(d) + (dot ? ', has events' : '')}
              className={cn(
                'relative flex flex-col items-center gap-1 rounded-full py-2.5 text-sm transition-colors',
                selected ? 'bg-ink text-paper' : 'hover:bg-ink/5',
              )}
            >
              <span className="font-medium">{dayFmt.format(d)}</span>
              <span className={cn('font-bold tabular-nums', isSameDay(d, today) && !selected && 'underline underline-offset-4')}>
                {d.getDate()}
              </span>
              {dot && (
                <span className={cn('absolute bottom-1 size-1.5 rounded-full', selected ? 'bg-sage' : 'bg-ink')} aria-hidden />
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
