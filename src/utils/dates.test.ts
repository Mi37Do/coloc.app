import { formatDue, isOverdue, monthGrid, parseISODate, toISODate } from './dates'

const now = new Date(2026, 9, 12, 10, 0) // Monday 12 Oct 2026, 10:00

describe('formatDue', () => {
  it('labels nearby days relatively', () => {
    expect(formatDue(new Date(2026, 9, 12, 18, 0).toISOString(), now)).toMatch(/^Today, /)
    expect(formatDue(new Date(2026, 9, 13, 9, 0).toISOString(), now)).toBe('Tomorrow')
    expect(formatDue(new Date(2026, 9, 11, 9, 0).toISOString(), now)).toBe('Yesterday')
  })

  it('falls back to a short date beyond a week', () => {
    expect(formatDue(new Date(2026, 9, 30).toISOString(), now)).not.toMatch(/Today|Tomorrow/)
  })
})

describe('isOverdue', () => {
  it('compares against now', () => {
    expect(isOverdue(new Date(2026, 9, 12, 9, 0).toISOString(), now)).toBe(true)
    expect(isOverdue(new Date(2026, 9, 12, 11, 0).toISOString(), now)).toBe(false)
  })
})

describe('calendar helpers', () => {
  it('round-trips local dates', () => {
    const d = new Date(2026, 0, 5)
    expect(toISODate(d)).toBe('2026-01-05')
    expect(parseISODate('2026-01-05')?.getTime()).toBe(d.getTime())
    expect(parseISODate('nope')).toBeUndefined()
  })

  it('builds a Monday-first 6-week grid', () => {
    const grid = monthGrid(2026, 9) // October 2026 starts on a Thursday
    expect(grid).toHaveLength(42)
    expect(grid[0].getDay()).toBe(1) // Monday
    expect(toISODate(grid[0])).toBe('2026-09-28')
    expect(toISODate(grid[3])).toBe('2026-10-01')
  })
})
