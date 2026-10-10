import type { Bill, BillCategory } from '@/types/api'

export const categories: { value: BillCategory; label: string; emoji: string }[] = [
  { value: 'rent', label: 'Rent', emoji: '🏠' },
  { value: 'utilities', label: 'Utilities', emoji: '💡' },
  { value: 'internet', label: 'Internet', emoji: '📶' },
  { value: 'groceries', label: 'Groceries', emoji: '🥕' },
  { value: 'household', label: 'Household', emoji: '🧴' },
  { value: 'other', label: 'Other', emoji: '🧾' },
]

export const categoryEmoji = (c: BillCategory) => categories.find((x) => x.value === c)?.emoji ?? '🧾'

export type MyStatus =
  | { kind: 'owed'; cents: number } // I paid, others still owe me
  | { kind: 'owe'; cents: number } // someone else paid, I haven't paid back
  | { kind: 'settled' }
  | { kind: 'none' } // not part of this bill

/** Where the current user stands on one bill */
export function myStatus(bill: Bill, meId: string | undefined): MyStatus {
  if (!meId) return { kind: 'none' }
  if (bill.paidById === meId) {
    const cents = bill.shares
      .filter((s) => s.userId !== meId && !s.settledAt)
      .reduce((sum, s) => sum + s.amountCents, 0)
    return cents > 0 ? { kind: 'owed', cents } : { kind: 'settled' }
  }
  const mine = bill.shares.find((s) => s.userId === meId)
  if (!mine) return { kind: 'none' }
  return mine.settledAt ? { kind: 'settled' } : { kind: 'owe', cents: mine.amountCents }
}
