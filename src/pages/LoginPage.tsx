import { useNavigate, useSearchParams } from 'react-router'
import { LoginForm } from '@/features/auth'

// Only follow redirects that stay on this site.
const safeRedirect = (target: string | null) =>
  target && target.startsWith('/') && !target.startsWith('//') ? target : '/'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams() // = route.query
  const redirectTo = safeRedirect(searchParams.get('redirect'))

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold tracking-tight">Login</h1>
      <p>Use any email and a password of at least 6 characters.</p>
      <LoginForm onSuccess={() => navigate(redirectTo, { replace: true })} />
    </section>
  )
}
