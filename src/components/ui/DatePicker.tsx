import { useState } from 'react'
import { Field as HField, Label, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { CalendarDays, X } from 'lucide-react'
import { Calendar } from './Calendar'
import { Select } from './Select'
import { parseISODate, startOfDay, toISODate } from '@/utils/dates'
import { cn } from '@/utils/cn'

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

type DateProps = {
  label: string
  /** "YYYY-MM-DD", or "" for none */
  value: string
  onChange: (value: string) => void
  min?: Date
  max?: Date
  placeholder?: string
  error?: string
  hint?: string
  /** Month/year dropdowns in the calendar, for dates far from today */
  jumpers?: boolean
  clearable?: boolean
  /** Where the calendar opens when empty, e.g. ~25 years ago for a birthday */
  defaultDate?: Date
}

/** Date field: a button that opens the app's calendar in a popover (Headless UI Popover). */
export function DatePicker({
  label,
  value,
  onChange,
  min,
  max,
  placeholder = 'Pick a date',
  error,
  hint,
  jumpers,
  clearable,
  defaultDate,
}: DateProps) {
  const date = parseISODate(value)

  return (
    <HField className="flex flex-col gap-1.5">
      <Label className="text-sm font-bold">{label}</Label>
      <div className="relative">
        <Popover>
          <PopoverButton
            className={cn(
              'field flex items-center gap-2 text-left data-open:shadow-[0_0_0_4px_rgb(181_220_141/60%)]',
              clearable && date && 'pr-11',
            )}
            aria-invalid={!!error}
          >
            <CalendarDays size={18} className="shrink-0" aria-hidden />
            <span className={cn('truncate', !date && 'text-neutral-gray')}>
              {date ? dateFmt.format(date) : placeholder}
            </span>
          </PopoverButton>
          <PopoverPanel anchor="bottom start" transition className="popover">
            {({ close }) => (
              // Close only when a day is picked, not on month/year navigation
              <Calendar
                value={date}
                min={min}
                max={max}
                jumpers={jumpers}
                defaultDate={defaultDate}
                onChange={(d) => {
                  onChange(toISODate(d))
                  close()
                }}
              />
            )}
          </PopoverPanel>
        </Popover>
        {clearable && date && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full hover:bg-ivory"
            aria-label={`Clear ${label.toLowerCase()}`}
          >
            <X size={16} aria-hidden />
          </button>
        )}
      </div>
      {error ? (
        <span className="text-sm font-semibold text-red-700">{error}</span>
      ) : (
        hint && <span className="muted text-sm font-medium">{hint}</span>
      )}
    </HField>
  )
}

// 06:00 → 23:30 every 30 minutes; covers chores without a 96-row list
const TIMES = Array.from({ length: 36 }, (_, i) => {
  const minutes = 6 * 60 + i * 30
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
})
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const timeLabel = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return timeFmt.format(new Date(2000, 0, 1, h, m))
}

type DateTimeProps = {
  label: string
  /** "YYYY-MM-DDTHH:mm" local (same shape as <input type="datetime-local">), or "" */
  value: string
  onChange: (value: string) => void
  min?: Date
  defaultTime?: string
  /** Show a chip that clears the date (e.g. "No due date"); omit when a date is required */
  emptyLabel?: string
}

/** Date + time, with Today/Tomorrow shortcuts. */
export function DateTimePicker({ label, value, onChange, min, defaultTime = '18:00', emptyLabel }: DateTimeProps) {
  const [datePart = '', timePart = ''] = value ? value.split('T') : []
  // Remember a time picked before the day, and apply it once a day is chosen
  const [pendingTime, setPendingTime] = useState(timePart.slice(0, 5) || defaultTime)
  const time = timePart.slice(0, 5) || pendingTime
  const set = (d: string, t = time) => onChange(d ? `${d}T${t}` : '')
  const setTime = (t: string) => {
    setPendingTime(t)
    if (datePart) set(datePart, t)
  }

  const today = startOfDay(new Date())
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
  const quick = [
    { label: 'Today', date: toISODate(today) },
    { label: 'Tomorrow', date: toISODate(tomorrow) },
  ]
  const timeOptions = (TIMES.includes(time) ? TIMES : [...TIMES, time].sort()).map((t) => ({
    value: t,
    label: timeLabel(t),
  }))

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {quick.map((q) => (
          <button
            key={q.label}
            type="button"
            aria-pressed={datePart === q.date}
            onClick={() => set(q.date)}
            className={cn(
              'min-h-10 rounded-full border-[1.5px] border-ink px-3.5 text-sm font-bold transition-colors',
              datePart === q.date ? 'bg-ink text-paper' : 'bg-paper',
            )}
          >
            {q.label}
          </button>
        ))}
        {emptyLabel && (
          <button
            type="button"
            aria-pressed={!datePart}
            onClick={() => set('')}
            className={cn(
              'min-h-10 rounded-full border-[1.5px] border-ink px-3.5 text-sm font-bold transition-colors',
              !datePart ? 'bg-ink text-paper' : 'bg-paper',
            )}
          >
            {emptyLabel}
          </button>
        )}
      </div>
      <div className="grid grid-cols-[1fr_8.5rem] gap-2">
        <DatePicker label="Day" value={datePart} onChange={(d) => set(d)} min={min} placeholder="Another day…" />
        <Select label="Time" value={time} onChange={setTime} options={timeOptions} />
      </div>
    </fieldset>
  )
}
