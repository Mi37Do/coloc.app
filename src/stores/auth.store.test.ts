import { useAuthStore } from './auth.store'

describe('auth store', () => {
  beforeEach(() => useAuthStore.setState({ user: null, token: null }))

  it('logs in and out', async () => {
    await useAuthStore.getState().login({ email: 'jane@example.com', password: 'secret1' })
    expect(useAuthStore.getState().user).toEqual({ email: 'jane@example.com', name: 'jane' })

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
