import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCounterStore } from '@/stores'
import { CounterCard } from './CounterCard'

describe('CounterCard', () => {
  beforeEach(() => useCounterStore().reset())

  it('increments and resets the counter', async () => {
    const user = userEvent.setup()
    render(<CounterCard />)

    await user.click(screen.getByRole('button', { name: 'Increment' }))
    await user.click(screen.getByRole('button', { name: 'Increment' }))
    expect(screen.getByTestId('count')).toHaveTextContent('2')
    expect(screen.getByText('Double: 4')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Reset' }))
    expect(screen.getByTestId('count')).toHaveTextContent('0')
  })
})
