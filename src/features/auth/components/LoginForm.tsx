import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { loginSchema, type LoginInput } from '@/schemas/auth.schema'
import { useAuthStore } from '@/stores'

// Props are defineProps(), onSuccess is defineEmits(['success']).
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const login = useAuthStore((state) => state.login)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginInput) => {
    await login(values)
    toast.success('Signed in as ' + values.email)
    onSuccess?.()
  }

  return (
    <form className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900" onSubmit={handleSubmit(onSubmit)} noValidate>
      <label className="flex flex-col gap-1 font-medium">
        Email
        <input
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700"
          type="email" autoComplete="email" {...register('email')} />
        {errors.email && <span className="text-sm font-normal text-red-600 dark:text-red-400">{errors.email.message}</span>}
      </label>
      <label className="flex flex-col gap-1 font-medium">
        Password
        <input
          className="rounded-lg border border-slate-300 bg-transparent px-3 py-2 font-normal outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700"
          type="password" autoComplete="current-password" {...register('password')} />
        {errors.password && <span className="text-sm font-normal text-red-600 dark:text-red-400">{errors.password.message}</span>}
      </label>
      <Button type="submit" disabled={isSubmitting}>
        <LogIn size={16} /> {isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
