/** The app records every amount in Algerian dinars. Amounts are integer cents, as the API stores them. */
export const CURRENCY = 'DZD'

const fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency: CURRENCY })

/** 450000 -> "DZD 4,500.00" (shape depends on the user's locale) */
export function formatMoney(cents: number) {
  return fmt.format(cents / 100)
}

/** "1500", "1 500,5" or "1500.50" -> 150000 / 150050; null if it isn't a positive amount */
export function parseMoney(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return cents > 0 ? cents : null
}
