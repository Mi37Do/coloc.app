const formatters = new Map<string, Intl.NumberFormat>()

/** 12345, "EUR" -> "€123.45" in the user's locale */
export function formatMoney(cents: number, currency = 'EUR') {
  let fmt = formatters.get(currency)
  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, { style: 'currency', currency })
    formatters.set(currency, fmt)
  }
  return fmt.format(cents / 100)
}

/** "12,5" or "12.50" -> 1250; null if it isn't a positive amount */
export function parseMoney(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return null
  const cents = Math.round(Number(normalized) * 100)
  return cents > 0 ? cents : null
}

/**
 * Splits `total` cents evenly across `count` people. The first people absorb
 * the leftover cent(s), so the parts always add up to the total.
 */
export function splitEvenly(total: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor(total / count)
  const extra = total - base * count
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0))
}
