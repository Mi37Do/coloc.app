import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { useAuthStore } from '@/stores'
import type { User } from '@/types/api'
import { apiErrorMessage, apiStatus } from '@/utils/api-error'

// Props are defineProps(), onSuccess is defineEmits(['success']).
export function LoginForm({ onSuccess }: { onSuccess?: (user: User) => void }) {
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginInput) => {
    try {
      const { user } = await login(values)
      onSuccess?.(user)
    } catch (error) {
      toast.error(
        apiStatus(error) === 401
          ? 'Wrong email, username or password'
          : apiErrorMessage(error, 'Could not sign in'),
      )
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="Email or username" error={errors.identifier?.message}>
        <input className="field" autoComplete="username" autoCapitalize="none" {...register('identifier')} />
      </Field>
      <Field label="Password" error={errors.password?.message}>
        <input className="field" type="password" autoComplete="current-password" {...register('password')} />
      </Field>
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        <LogIn size={18} aria-hidden /> {isSubmitting ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
