import type { ShoppingItemInput } from '@/types/api'

const UNITS = ['kg', 'g', 'l', 'ml', 'cl', 'pack', 'packs', 'pcs', 'box', 'boxes', 'bottle', 'bottles', 'can', 'cans', 'dozen']

/**
 * Turns quick-add text into an item:
 *   "2 milk"      -> { name: "milk", quantity: 2 }
 *   "milk x3"     -> { name: "milk", quantity: 3 }
 *   "500 g flour" -> { name: "flour", quantity: 500, unit: "g" }
 *   "eggs"        -> { name: "eggs" }
 */
export function parseItem(raw: string): ShoppingItemInput | null {
  let text = raw.trim().replace(/\s+/g, ' ')
  if (!text) return null
  let quantity: number | undefined
  let unit: string | undefined

  const trailing = text.match(/^(.*?)\s*[x×]\s*(\d{1,4})$/i)
  const leading = text.match(/^(\d{1,4})\s*([a-zA-Z]+)?\s+(.+)$/)

  if (trailing && trailing[1]) {
    text = trailing[1]
    quantity = Number(trailing[2])
  } else if (leading) {
    const [, qty, maybeUnit, rest] = leading
    quantity = Number(qty)
    if (maybeUnit && UNITS.includes(maybeUnit.toLowerCase())) {
      unit = maybeUnit.toLowerCase()
      text = rest
    } else {
      text = maybeUnit ? `${maybeUnit} ${rest}` : rest
    }
  }

  const name = text.slice(0, 120).trim()
  if (!name) return null
  return {
    name,
    ...(quantity && quantity >= 1 && quantity <= 9999 && { quantity }),
    ...(unit && { unit }),
  }
}
