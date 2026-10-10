import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores'
import type { User } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'

/**
 * Where to go once a session exists: confirm the email first, then accept the
 * invite the user opened before signing in (if any), then the page they wanted.
 */
export function useFinishSignIn() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return async (user: User, redirectTo = '/') => {
    if (!user.emailVerified) {
      navigate('/verify', { replace: true })
      return
    }

    const { pendingInvite, joinHousehold, setPendingInvite } = useAuthStore.getState()
    if (pendingInvite) {
      try {
        await joinHousehold(pendingInvite)
        toast.success(`You joined ${pendingInvite.householdName ?? 'the household'}`)
      } catch (error) {
        setPendingInvite(null)
        toast.error(apiErrorMessage(error, 'Could not join the household'))
      }
      await queryClient.invalidateQueries({ queryKey: ['households'] })
      navigate('/', { replace: true })
      return
    }

    toast.success('Welcome, ' + user.firstname)
    navigate(redirectTo, { replace: true })
  }
}
