// The reference shows a small illustration on each task card. Until there are
// real illustrations, pick an emoji from words in the chore title.
const rules: [RegExp, string][] = [
  [/laund|wash.*cloth|iron|fold/i, '🧺'],
  [/bath|tub|shower/i, '🛁'],
  [/toilet|wc|loo/i, '🚽'],
  [/dish|plate|sink/i, '🍽️'],
  [/trash|garbage|bin|rubbish|recycl/i, '🗑️'],
  [/vacuum|hoover|sweep|broom|floor|mop/i, '🧹'],
  [/plant|water|garden|flower/i, '🪴'],
  [/cook|kitchen|oven|fridge|stove/i, '🍳'],
  [/counter|wipe|surface|table/i, '🧽'],
  [/window|glass|mirror/i, '🪟'],
  [/shop|grocer|buy/i, '🛒'],
  [/bed|sheet|linen/i, '🛏️'],
  [/dust/i, '🪶'],
  [/pet|cat|dog|litter/i, '🐾'],
]

export function choreEmoji(title: string) {
  return rules.find(([re]) => re.test(title))?.[1] ?? '✨'
}
