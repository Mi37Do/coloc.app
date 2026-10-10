import { Link, useSearchParams } from 'react-router'
import { AuthScreen } from '@/components/ui/AuthScreen'
import { LoginForm, useFinishSignIn } from '@/features/auth'
import { useAuthStore } from '@/stores'

// Only follow redirects that stay on this site.
const safeRedirect = (target: string | null) =>
  target && target.startsWith('/') && !target.startsWith('//') ? target : '/'

export function LoginPage() {
  const [searchParams] = useSearchParams() // = route.query
  const redirectTo = safeRedirect(searchParams.get('redirect'))
  const pendingInvite = useAuthStore((state) => state.pendingInvite)
  const finishSignIn = useFinishSignIn()

  return (
    <AuthScreen
      title="Share the home, not the mess"
      subtitle={
        pendingInvite
          ? `Sign in to join ${pendingInvite.householdName ?? 'your household'}.`
          : 'Sign in to see what needs doing around the house.'
      }
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm onSuccess={(user) => finishSignIn(user, redirectTo)} />
    </AuthScreen>
  )
}
