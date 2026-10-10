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

/** Total of the bills added in the same calendar month as `now` */
export function monthTotal(bills: Bill[], now = new Date()) {
  return bills
    .filter((b) => {
      const d = new Date(b.createdAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    })
    .reduce((sum, b) => sum + b.amountCents, 0)
}

/** Month total per category, biggest first */
export function byCategory(bills: Bill[], now = new Date()) {
  const totals = new Map<BillCategory, number>()
  for (const b of bills) {
    const d = new Date(b.createdAt)
    if (d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) continue
    totals.set(b.category, (totals.get(b.category) ?? 0) + b.amountCents)
  }
  return [...totals].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents)
}
