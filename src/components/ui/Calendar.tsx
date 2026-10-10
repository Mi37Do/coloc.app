import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Select } from './Select'
import { isSameDay, monthGrid, startOfDay, toISODate } from '@/utils/dates'
import { cn } from '@/utils/cn'

const weekdayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'narrow' })
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' })
const fullFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

type Props = {
  value?: Date
  onChange: (date: Date) => void
  min?: Date
  max?: Date
  /** Show month and year dropdowns, for far-away dates such as birthdays */
  jumpers?: boolean
  /** Where the calendar opens when there is no value yet */
  defaultDate?: Date
}

/**
 * Month grid, Monday first, styled like Home's week strip: the selected day is
 * a black pill. Arrow keys move by day/week, PageUp/PageDown by month.
 */
export function Calendar({ value, onChange, min, max, jumpers = false, defaultDate }: Props) {
  const today = startOfDay(new Date())
  const [focused, setFocused] = useState(() => value ?? clamp(defaultDate ?? today, min, max))
  const [view, setView] = useState({ year: focused.getFullYear(), month: focused.getMonth() })
  const gridRef = useRef<HTMLDivElement>(null)
  const keyboardMove = useRef(false)

  const days = monthGrid(view.year, view.month)
  const inView = (d: Date) => d.getFullYear() === view.year && d.getMonth() === view.month
  // The one day reachable with Tab (roving tabindex): the focused day if shown, else the 1st
  const tabStop = inView(focused) ? focused : new Date(view.year, view.month, 1)
  const allowed = (d: Date) => (!min || d >= startOfDay(min)) && (!max || d <= startOfDay(max))

  // After a keyboard move, put focus on the new day
  useEffect(() => {
    if (!keyboardMove.current) return
    keyboardMove.current = false
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${toISODate(focused)}"]`)?.focus()
  }, [focused, view])

  const moveTo = (d: Date) => {
    const next = clamp(d, min, max)
    setFocused(next)
    setView({ year: next.getFullYear(), month: next.getMonth() })
  }

  const shiftMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  const onKeyDown = (e: KeyboardEvent) => {
    const step: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next: Date | undefined
    if (e.key in step) next = new Date(focused.getFullYear(), focused.getMonth(), focused.getDate() + step[e.key])
    else if (e.key === 'PageUp') next = new Date(focused.getFullYear(), focused.getMonth() - 1, focused.getDate())
    else if (e.key === 'PageDown') next = new Date(focused.getFullYear(), focused.getMonth() + 1, focused.getDate())
    else if (e.key === 'Home') next = new Date(focused.getFullYear(), focused.getMonth(), focused.getDate() - ((focused.getDay() + 6) % 7))
    else if (e.key === 'End') next = new Date(focused.getFullYear(), focused.getMonth(), focused.getDate() + (6 - ((focused.getDay() + 6) % 7)))
    if (!next) return
    e.preventDefault()
    keyboardMove.current = true
    moveTo(next)
  }

  const prevDisabled = !!min && new Date(view.year, view.month, 0) < startOfDay(min)
  const nextDisabled = !!max && new Date(view.year, view.month + 1, 1) > startOfDay(max)

  const years = (() => {
    const from = min?.getFullYear() ?? today.getFullYear() - 100
    const to = max?.getFullYear() ?? today.getFullYear() + 5
    return Array.from({ length: to - from + 1 }, (_, i) => to - i)
  })()

  return (
    <div className="w-[19rem] max-w-full p-1.5">
      <div className="mb-2 flex items-center gap-1">
        <button type="button" onClick={() => shiftMonth(-1)} disabled={prevDisabled} className="grid size-10 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" aria-label="Previous month">
          <ChevronLeft size={20} aria-hidden />
        </button>
        {jumpers ? (
          <div className="flex flex-1 gap-1.5">
            <Select
              label="Month"
              srLabel
              className="flex-1"
              buttonClassName="min-h-10 py-1.5 px-3 text-sm"
              value={view.month}
              onChange={(month) => setView((v) => ({ ...v, month }))}
              options={Array.from({ length: 12 }, (_, m) => ({ value: m, label: monthFmt.format(new Date(2000, m, 1)) }))}
            />
            <Select
              label="Year"
              srLabel
              className="w-24"
              buttonClassName="min-h-10 py-1.5 px-3 text-sm"
              value={view.year}
              onChange={(year) => setView((v) => ({ ...v, year }))}
              options={years.map((y) => ({ value: y, label: String(y) }))}
            />
          </div>
        ) : (
          <p className="flex-1 text-center font-display text-lg" aria-live="polite">
            {monthFmt.format(new Date(view.year, view.month, 1))} {view.year}
          </p>
        )}
        <button type="button" onClick={() => shiftMonth(1)} disabled={nextDisabled} className="grid size-10 place-items-center rounded-full hover:bg-ivory disabled:opacity-30" aria-label="Next month">
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-xs font-bold text-muted-ink" aria-hidden>
        {days.slice(0, 7).map((d) => (
          <span key={d.getDay()} className="py-1">
            {weekdayFmt.format(d)}
          </span>
        ))}
      </div>

      <div ref={gridRef} role="grid" aria-label="Calendar" className="grid grid-cols-7 gap-y-0.5" onKeyDown={onKeyDown}>
        {days.map((d) => {
          const inMonth = d.getMonth() === view.month
          const selected = !!value && isSameDay(d, value)
          const isToday = isSameDay(d, today)
          const enabled = allowed(d)
          return (
            <button
              key={d.toISOString()}
              type="button"
              role="gridcell"
              data-day={toISODate(d)}
              tabIndex={isSameDay(d, tabStop) ? 0 : -1}
              disabled={!enabled}
              aria-selected={selected}
              aria-label={fullFmt.format(d)}
              onClick={() => {
                setFocused(d)
                onChange(d)
              }}
              className={cn(
                'mx-auto grid size-10 place-items-center rounded-full text-sm font-bold tabular-nums transition-colors',
                !inMonth && 'text-neutral-gray',
                enabled && !selected && 'hover:bg-ivory',
                isToday && !selected && 'ring-[1.5px] ring-ink',
                selected && 'bg-ink text-paper',
                !enabled && 'cursor-not-allowed opacity-30',
              )}
            >
              {d.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function clamp(d: Date, min?: Date, max?: Date) {
  if (min && d < startOfDay(min)) return startOfDay(min)
  if (max && d > startOfDay(max)) return startOfDay(max)
  return startOfDay(d)
}
