import { loginSchema } from './auth.schema'

describe('loginSchema', () => {
  it('accepts an email or a username', () => {
    expect(loginSchema.safeParse({ identifier: 'me@example.com', password: 'secret1' }).success).toBe(true)
    expect(loginSchema.safeParse({ identifier: 'jane', password: 'secret1' }).success).toBe(true)
  })

  it('rejects empty fields', () => {
    expect(loginSchema.safeParse({ identifier: '  ', password: 'secret1' }).success).toBe(false)
    expect(loginSchema.safeParse({ identifier: 'jane', password: '' }).success).toBe(false)
  })
})
