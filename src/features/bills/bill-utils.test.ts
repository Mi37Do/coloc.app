import type { Bill } from '@/types/api'
import { myStatus } from './bill-utils'

const bill = (paidById: string, shares: [string, number, boolean][]): Bill => ({
  id: 'b',
  householdId: 'h',
  title: 'Rent',
  category: 'rent',
  amountCents: shares.reduce((s, [, c]) => s + c, 0),
  currency: 'EUR',
  paidById,
  paidBy: null,
  dueDate: null,
  createdById: paidById,
  createdAt: '',
  shares: shares.map(([userId, amountCents, settled]) => ({
    id: userId,
    billId: 'b',
    userId,
    amountCents,
    settledAt: settled ? '2026-10-01' : null,
  })),
})

describe('myStatus', () => {
  it("is what others still owe when I paid", () => {
    expect(myStatus(bill('me', [['me', 300, true], ['a', 300, false], ['b', 300, true]]), 'me')).toEqual({ kind: 'owed', cents: 300 })
    expect(myStatus(bill('me', [['me', 300, true], ['a', 300, true]]), 'me')).toEqual({ kind: 'settled' })
  })

  it('is my unpaid share when someone else paid', () => {
    expect(myStatus(bill('a', [['a', 500, true], ['me', 500, false]]), 'me')).toEqual({ kind: 'owe', cents: 500 })
    expect(myStatus(bill('a', [['a', 500, true], ['me', 500, true]]), 'me')).toEqual({ kind: 'settled' })
  })

  it("is none when I'm not on the bill", () => {
    expect(myStatus(bill('a', [['a', 500, true], ['b', 500, false]]), 'me')).toEqual({ kind: 'none' })
  })
})
