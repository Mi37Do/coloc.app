import type { HouseholdEvent, RsvpResponse } from '@/types/api'
import { isSameDay, toISODate } from '@/utils/dates'

const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })
const day = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' })

/** "7:00 PM – 9:30 PM", "7:00 PM", or across days "Fri 9 Oct, 8 PM – Sat 10 Oct, 2 AM" */
export function formatTimeRange(startsAt: string, endsAt: string | null) {
  const start = new Date(startsAt)
  if (!endsAt) return time.format(start)
  const end = new Date(endsAt)
  if (isSameDay(start, end)) return `${time.format(start)} – ${time.format(end)}`
  return `${day.format(start)}, ${time.format(start)} – ${day.format(end)}, ${time.format(end)}`
}

/** Every calendar day an event touches, as "YYYY-MM-DD" (for the week strip dots) */
export function eventDays(event: HouseholdEvent): string[] {
  const start = new Date(event.startsAt)
  const end = event.endsAt ? new Date(event.endsAt) : start
  const days: string[] = []
  for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(toISODate(d))
    if (days.length > 60) break // guard against bad data
  }
  return days
}

export const rsvpLabels: Record<RsvpResponse, string> = {
  going: 'Going',
  maybe: 'Maybe',
  declined: "Can't go",
}

export const rsvpEmoji: Record<RsvpResponse, string> = { going: '🙌', maybe: '🤔', declined: '🙅' }

/** Pick an emoji from words in the title, like chores do */
export function eventEmoji(title: string) {
  const rules: [RegExp, string][] = [
    [/birthday|bday|anniv/i, '🎂'],
    [/party|drinks|celebrat/i, '🎉'],
    [/dinner|lunch|brunch|breakfast|bbq|barbecue|cook|pizza/i, '🍝'],
    [/movie|film|cinema|netflix/i, '🎬'],
    [/game|board|quiz/i, '🎲'],
    [/meeting|house ?meeting|talk|discuss/i, '🗣️'],
    [/clean|tidy/i, '🧽'],
    [/guest|visit|parents|friend/i, '👋'],
    [/move|moving/i, '📦'],
    [/repair|plumber|electric|landlord|inspection/i, '🔧'],
    [/trip|travel|holiday|vacation/i, '✈️'],
    [/sport|gym|run|football|match/i, '⚽'],
  ]
  return rules.find(([re]) => re.test(title))?.[1] ?? '📅'
}
