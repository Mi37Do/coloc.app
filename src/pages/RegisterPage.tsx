import { Link, useNavigate } from 'react-router'
import { AuthScreen } from '@/components/ui/AuthScreen'
import { RegisterForm } from '@/features/auth'
import { useAuthStore } from '@/stores'

export function RegisterPage() {
  const navigate = useNavigate()
  const pendingInvite = useAuthStore((state) => state.pendingInvite)

  return (
    <AuthScreen
      tone="sky"
      title="Create your account"
      subtitle={
        pendingInvite
          ? `Then you'll join ${pendingInvite.householdName ?? 'your household'}.`
          : 'Then set up your home or join your flatmates.'
      }
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm onSuccess={() => navigate('/verify', { replace: true })} />
    </AuthScreen>
  )
}
