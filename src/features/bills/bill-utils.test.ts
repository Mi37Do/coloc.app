import type { Bill } from '@/types/api'
import { byCategory, monthTotal } from './bill-utils'

const now = new Date(2026, 9, 15)
const bill = (category: Bill['category'], amountCents: number, createdAt: Date): Bill => ({
  id: String(Math.random()),
  householdId: 'h',
  title: 'x',
  category,
  amountCents,
  currency: 'DZD',
  paidById: null,
  paidBy: null,
  dueDate: null,
  shares: [],
  createdById: null,
  createdAt: createdAt.toISOString(),
})

const bills = [
  bill('rent', 90000, new Date(2026, 9, 2)),
  bill('groceries', 6000, new Date(2026, 9, 9)),
  bill('groceries', 4000, new Date(2026, 9, 12)),
  bill('utilities', 99999, new Date(2026, 8, 30)), // September: ignored
]

describe('monthTotal', () => {
  it('sums only this month', () => expect(monthTotal(bills, now)).toBe(100000))
})

describe('byCategory', () => {
  it('groups this month by category, biggest first', () => {
    expect(byCategory(bills, now)).toEqual([
      { category: 'rent', cents: 90000 },
      { category: 'groceries', cents: 10000 },
    ])
  })
})
