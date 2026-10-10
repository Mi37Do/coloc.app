import { formatInviteCode } from './invites'

describe('formatInviteCode', () => {
  it('uppercases and adds the dash', () => {
    expect(formatInviteCode('k7qm2x')).toBe('K7Q-M2X')
    expect(formatInviteCode('k7q')).toBe('K7Q')
  })

  it('drops characters codes never contain', () => {
    expect(formatInviteCode('K7Q M2X')).toBe('K7Q-M2X')
    expect(formatInviteCode('O0I1L-AB')).toBe('AB')
    expect(formatInviteCode('K7QM2XYZ')).toBe('K7Q-M2X')
  })
})
