import { parseItem } from './parse-item'

describe('parseItem', () => {
  it('reads plain names', () => {
    expect(parseItem('  eggs ')).toEqual({ name: 'eggs' })
    expect(parseItem('   ')).toBeNull()
  })

  it('reads a leading quantity, with or without a unit', () => {
    expect(parseItem('2 milk')).toEqual({ name: 'milk', quantity: 2 })
    expect(parseItem('500 g flour')).toEqual({ name: 'flour', quantity: 500, unit: 'g' })
    expect(parseItem('2kg rice')).toEqual({ name: 'rice', quantity: 2, unit: 'kg' })
    expect(parseItem('3 big tomatoes')).toEqual({ name: 'big tomatoes', quantity: 3 })
  })

  it('reads a trailing x-quantity', () => {
    expect(parseItem('milk x3')).toEqual({ name: 'milk', quantity: 3 })
    expect(parseItem('kitchen roll ×2')).toEqual({ name: 'kitchen roll', quantity: 2 })
  })

  it('keeps names that only look numeric', () => {
    expect(parseItem('7up')).toEqual({ name: '7up' })
  })
})
