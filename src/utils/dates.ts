const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'long' })
const shortDate = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime()

/** "Today, 6:00 PM", "Tomorrow", "Wednesday", "12 Oct". Relative to `now`. */
export function formatDue(iso: string, now = new Date()) {
  const due = new Date(iso)
  const days = Math.round((startOfDay(due).getTime() - startOfDay(now).getTime()) / 86_400_000)

  if (days === 0) return 'Today, ' + time.format(due)
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  if (days > 1 && days < 7) return weekday.format(due)
  return shortDate.format(due)
}

export function isOverdue(iso: string, now = new Date()) {
  return new Date(iso).getTime() < now.getTime()
}

/** Monday-first week containing `day` */
export function weekOf(day: Date): Date[] {
  const start = startOfDay(day)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}

export function greeting(now = new Date()) {
  const h = now.getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })
const clock = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const dayMonth = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

/** "just now", "5 min ago", "3 hours ago", "yesterday", "12 Oct" */
export function formatRelative(iso: string, now = new Date()) {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 45) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute')
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), 'hour')
  if (abs < 7 * 86_400) return rtf.format(Math.round(seconds / 86_400), 'day')
  return dayMonth.format(new Date(iso))
}

/** Chat list time: "14:05" today, "Mon" this week, else "12 Oct" */
export function formatChatTime(iso: string, now = new Date()) {
  const d = new Date(iso)
  if (isSameDay(d, now)) return clock.format(d)
  const days = (startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000
  if (days < 7) return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d)
  return dayMonth.format(d)
}

export const formatClock = (iso: string) => clock.format(new Date(iso))

const pad = (n: number) => String(n).padStart(2, '0')

/** Local calendar date as "YYYY-MM-DD" (not toISOString, which shifts to UTC) */
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** "YYYY-MM-DD" -> local midnight; undefined if malformed */
export function parseISODate(value: string | undefined): Date | undefined {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return undefined
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** The 6×7 grid of days shown for a month, Monday first (includes spill-over days) */
export function monthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i))
}
