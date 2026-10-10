import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { AuthScreen } from '@/components/ui/AuthScreen'
import { Button } from '@/components/ui/Button'
import { useFinishSignIn } from '@/features/auth'
import { useAuthStore } from '@/stores'
import { apiErrorMessage } from '@/utils/api-error'

const RESEND_COOLDOWN_S = 60

export function VerifyEmailPage() {
  const user = useAuthStore((state) => state.user)
  const verifyEmail = useAuthStore((state) => state.verifyEmail)
  const resendCode = useAuthStore((state) => state.resendCode)
  const logout = useAuthStore((state) => state.logout)
  const finishSignIn = useFinishSignIn()
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  // The API sent a code at sign-up, so start with the resend button cooling down.
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(id)
  }, [cooldown])

  const submit = async (value: string) => {
    if (value.length !== 6 || submitting) return
    setSubmitting(true)
    setError(undefined)
    try {
      const { user } = await verifyEmail(value)
      await finishSignIn(user)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not check the code'))
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  const onChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6)
    setCode(digits)
    if (digits.length === 6) void submit(digits) // auto-submit, incl. iOS/Android code autofill
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(code)
  }

  const resend = async () => {
    try {
      await resendCode()
      toast.success('New code sent')
      setCooldown(RESEND_COOLDOWN_S)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not send a new code'))
    }
  }

  return (
    <AuthScreen
      art="mail"
      tone="sky"
      title="Check your email"
      subtitle={
        <>
          We sent a 6-digit code to <strong className="">{user?.email}</strong>. It expires in 15 minutes.
        </>
      }
      footer={
        <button
          type="button"
          className="font-semibold  underline underline-offset-4"
          onClick={() => {
            logout()
            navigate('/register', { replace: true })
          }}
        >
          Wrong email? Start over
        </button>
      }
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Confirmation code
          <input
            className="field text-center font-display text-3xl font-extrabold tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            maxLength={6}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            aria-invalid={!!error}
            autoFocus
          />
          {error && <span className="font-normal text-red-700">{error}</span>}
        </label>
        <Button type="submit" className="w-full" disabled={code.length !== 6 || submitting}>
          {submitting ? 'Checking…' : 'Confirm email'}
        </Button>
        <Button type="button" variant="light" className="w-full" disabled={cooldown > 0} onClick={resend}>
          {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        </Button>
      </form>
    </AuthScreen>
  )
}
