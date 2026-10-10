import { parseMoney, splitEvenly } from './money'

describe('parseMoney', () => {
  it('accepts dots, commas and up to 2 decimals', () => {
    expect(parseMoney('12')).toBe(1200)
    expect(parseMoney('12,5')).toBe(1250)
    expect(parseMoney('12.05')).toBe(1205)
    expect(parseMoney(' 1 200.99 ')).toBe(120099)
  })

  it('rejects zero, negatives and junk', () => {
    expect(parseMoney('0')).toBeNull()
    expect(parseMoney('-3')).toBeNull()
    expect(parseMoney('1.234')).toBeNull()
    expect(parseMoney('abc')).toBeNull()
  })
})

describe('splitEvenly', () => {
  it('always adds up to the total', () => {
    expect(splitEvenly(1000, 3)).toEqual([334, 333, 333])
    expect(splitEvenly(999, 3)).toEqual([333, 333, 333])
    expect(splitEvenly(5, 0)).toEqual([])
  })
})
