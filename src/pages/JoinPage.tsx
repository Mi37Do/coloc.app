import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AuthScreen } from '@/components/ui/AuthScreen'
import { Button } from '@/components/ui/Button'
import { previewInvite } from '@/services/invites'
import { useAuthStore } from '@/stores'
import { apiErrorMessage } from '@/utils/api-error'

/** /join/:token, the page a shared invite link opens. Works signed in or out. */
export function JoinPage() {
  const { token = '' } = useParams()
  const user = useAuthStore((state) => state.user)
  const joinHousehold = useAuthStore((state) => state.joinHousehold)
  const setPendingInvite = useAuthStore((state) => state.setPendingInvite)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [joining, setJoining] = useState(false)

  const preview = useQuery({
    queryKey: ['invites', token],
    queryFn: () => previewInvite({ kind: 'token', value: token }),
    retry: false,
  })

  if (preview.isPending) {
    return <div className="min-h-dvh bg-ivory" aria-busy="true" />
  }

  if (preview.isError) {
    return (
      <AuthScreen
        art="home"
        tone="butter"
        title="This link doesn't work"
        subtitle={apiErrorMessage(preview.error, 'The invite may have expired or been revoked.') + ' Ask a flatmate for a new one.'}
      >
        <Link to="/" className="pill w-full">
          Go to coloc
        </Link>
      </AuthScreen>
    )
  }

  const { household, memberCount } = preview.data
  const invite = { kind: 'token' as const, value: token, householdName: household.name }

  // Signed out or unconfirmed: remember the invite, it's accepted after sign-in.
  const continueTo = (path: string) => {
    setPendingInvite(invite)
    navigate(path)
  }

  const join = async () => {
    setJoining(true)
    try {
      await joinHousehold(invite)
      await queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success(`You joined ${household.name}`)
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not join the household'))
      setJoining(false)
    }
  }

  return (
    <AuthScreen
      art="home"
      tone="butter"
      title={<>Join {household.name}</>}
      subtitle={
        <>
          {memberCount} {memberCount === 1 ? 'flatmate is' : 'flatmates are'} already sharing chores, shopping and bills
          {household.city ? ` in ${household.city}` : ''}.
        </>
      }
    >
      {!user ? (
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={() => continueTo('/register')}>
            Create an account to join
          </Button>
          <Button variant="light" className="w-full" onClick={() => continueTo('/login')}>
            I already have an account
          </Button>
        </div>
      ) : user.emailVerified === false ? (
        <Button className="w-full" onClick={() => continueTo('/verify')}>
          Confirm your email to join
        </Button>
      ) : (
        <Button className="w-full" disabled={joining} onClick={join}>
          {joining ? 'Joining…' : `Join ${household.name}`}
        </Button>
      )}
    </AuthScreen>
  )
}
