import type { HouseholdEvent } from '@/types/api'
import { eventDays, formatTimeRange } from './event-utils'

const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString()
const event = (startsAt: string, endsAt: string | null) => ({ startsAt, endsAt }) as HouseholdEvent

describe('formatTimeRange', () => {
  it('shows a single time without an end', () => {
    expect(formatTimeRange(at(10, 19), null)).not.toContain('–')
  })

  it('shows times only for same-day events, and days for multi-day ones', () => {
    expect(formatTimeRange(at(10, 19), at(10, 21)).split('–')).toHaveLength(2)
    expect(formatTimeRange(at(10, 20), at(11, 2))).toMatch(/,.*–.*,/)
  })
})

describe('eventDays', () => {
  it('lists every day the event touches', () => {
    expect(eventDays(event(at(10, 20), null))).toEqual(['2026-10-10'])
    expect(eventDays(event(at(10, 20), at(12, 2)))).toEqual(['2026-10-10', '2026-10-11', '2026-10-12'])
  })
})
