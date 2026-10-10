import type { Chore, Member } from '@/types/api'
import { monthProgress, roomieScores } from './stats'

const now = new Date(2026, 9, 15)
const chore = (over: Partial<Chore>): Chore => ({
  id: Math.random().toString(),
  householdId: 'h',
  title: 'x',
  description: null,
  assigneeId: null,
  assignee: null,
  dueAt: null,
  recurrence: 'none',
  rotateAssignee: false,
  status: 'todo',
  completedAt: null,
  completedById: null,
  createdById: null,
  ...over,
})
const member = (userId: string): Member => ({
  id: 'm' + userId,
  householdId: 'h',
  userId,
  role: 'member',
  joinedAt: null,
  user: { id: userId, username: userId, firstname: userId, lastname: 'X' },
})

describe('monthProgress', () => {
  it('counts this month and undated open chores, ignoring other months', () => {
    const chores = [
      chore({ dueAt: new Date(2026, 9, 2).toISOString(), status: 'done', completedAt: new Date(2026, 9, 2).toISOString() }),
      chore({ dueAt: new Date(2026, 9, 20).toISOString() }),
      chore({}), // undated, open
      chore({ dueAt: new Date(2026, 7, 1).toISOString() }), // August: ignored
    ]
    expect(monthProgress(chores, now)).toEqual({ done: 1, total: 3, percent: 33 })
  })

  it('is 0% with no chores', () => {
    expect(monthProgress([], now).percent).toBe(0)
  })
})

describe('roomieScores', () => {
  it('ranks members by chores completed this month', () => {
    const doneBy = (id: string, month = 9) =>
      chore({ status: 'done', completedById: id, completedAt: new Date(2026, month, 3).toISOString() })
    const scores = roomieScores([doneBy('b'), doneBy('b'), doneBy('a'), doneBy('a', 8)], [member('a'), member('b'), member('c')], now)

    expect(scores.map((s) => [s.member.userId, s.done, s.share])).toEqual([
      ['b', 2, 1],
      ['a', 1, 0.5],
      ['c', 0, 0],
    ])
  })
})
