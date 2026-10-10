import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { useAuthStore } from '@/stores'
import { UserMenu } from './UserMenu'

describe('UserMenu', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: { email: 'jane@example.com', name: 'jane' }, token: 't' })
  })

  it('signs out after confirming in the dialog', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <UserMenu />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /jane@example.com/ }))
    await user.click(await screen.findByRole('menuitem', { name: /sign out/i }))
    expect(await screen.findByRole('dialog', { name: 'Sign out?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(useAuthStore.getState().user).toBeNull()
  })
})
