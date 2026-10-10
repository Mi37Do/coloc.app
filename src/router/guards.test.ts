import type { LoaderFunctionArgs } from 'react-router'
import { useAuthStore } from '@/stores'
import { guestOnly, requireAuth } from './guards'

const args = (url: string) => ({ request: new Request(url) }) as unknown as LoaderFunctionArgs

function redirectTarget(run: () => unknown) {
  try {
    run()
  } catch (thrown) {
    return (thrown as Response).headers.get('Location')
  }
  return null
}

describe('route guards', () => {
  beforeEach(() => useAuthStore.setState({ user: null, token: null }))

  it('sends guests to /login and remembers where they were going', () => {
    const target = redirectTarget(() => requireAuth(args('http://localhost/profile?tab=1')))
    expect(target).toBe('/login?redirect=%2Fprofile%3Ftab%3D1')
  })

  it('lets signed-in users through', () => {
    useAuthStore.setState({ user: { email: 'me@example.com', name: 'me' }, token: 't' })
    expect(requireAuth(args('http://localhost/profile'))).toBeNull()
    expect(redirectTarget(() => guestOnly())).toBe('/')
  })
})
