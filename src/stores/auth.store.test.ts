import { api } from '@/services/api'
import { useAuthStore } from './auth.store'

const user = { id: 'u1', username: 'jane', firstname: 'Jane', lastname: 'Doe', email: 'jane@example.com' }

describe('auth store', () => {
  beforeEach(() => useAuthStore.setState({ user: null, token: null, householdId: null }))
  afterEach(() => vi.restoreAllMocks())

  it('logs in against the API and out again', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: 'jwt', user } })

    await useAuthStore.getState().login({ identifier: 'jane', password: 'secret1' })
    expect(post).toHaveBeenCalledWith('/auth/login', { identifier: 'jane', password: 'secret1' })
    expect(useAuthStore.getState()).toMatchObject({ user, token: 'jwt' })

    useAuthStore.getState().logout()
    expect(useAuthStore.getState()).toMatchObject({ user: null, token: null, householdId: null })
  })

  it('switches to a household joined through an invite', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { accessToken: 'jwt', user, joinedHouseholdId: 'h2' } })

    await useAuthStore.getState().login({ identifier: 'jane', password: 'secret1' })
    expect(useAuthStore.getState().householdId).toBe('h2')
  })
})
