import type { Chore, Member } from '@/types/api'

export type RoomieScore = { member: Member; done: number; share: number }

const inMonth = (iso: string, now: Date) => {
  const d = new Date(iso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

/** A chore counts for the month when it is due, or was completed, this month. Undated open chores count too. */
export function choresThisMonth(chores: Chore[], now = new Date()) {
  return chores.filter(
    (c) =>
      (c.dueAt && inMonth(c.dueAt, now)) ||
      (c.completedAt && inMonth(c.completedAt, now)) ||
      (!c.dueAt && c.status === 'todo'),
  )
}

export function monthProgress(chores: Chore[], now = new Date()) {
  const month = choresThisMonth(chores, now)
  const done = month.filter((c) => c.status === 'done').length
  return { done, total: month.length, percent: month.length ? Math.round((done / month.length) * 100) : 0 }
}

/** Chores each member completed this month, best first; share is relative to the top score. */
export function roomieScores(chores: Chore[], members: Member[], now = new Date()): RoomieScore[] {
  const counts = new Map<string, number>()
  for (const c of chores) {
    if (c.status === 'done' && c.completedById && c.completedAt && inMonth(c.completedAt, now)) {
      counts.set(c.completedById, (counts.get(c.completedById) ?? 0) + 1)
    }
  }
  const best = Math.max(1, ...counts.values())
  return members
    .map((member) => {
      const done = counts.get(member.userId) ?? 0
      return { member, done, share: done / best }
    })
    .sort((a, b) => b.done - a.done)
}
