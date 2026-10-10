import { loginSchema } from './auth.schema'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ email: 'me@example.com', password: 'secret1' }).success).toBe(true)
  })

  it('rejects a short password', () => {
    expect(loginSchema.safeParse({ email: 'me@example.com', password: '123' }).success).toBe(false)
  })
})
