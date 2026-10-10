import { useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { ComboboxField } from '@/components/ui/ComboboxField'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { registerSchema, type RegisterFormInput, type RegisterValues } from '@/schemas/auth.schema'
import { useAuthStore } from '@/stores'
import { flagEmoji, getCountries, guessCountryId } from '@/utils/countries'
import { apiErrorMessage } from '@/utils/api-error'

export function RegisterForm({ onSuccess }: { onSuccess?: () => void }) {
  const registerUser = useAuthStore((state) => state.register)
  const pendingInvite = useAuthStore((state) => state.pendingInvite)
  const countryOptions = useMemo(
    () => getCountries().map((c) => ({ value: String(c.id), label: c.name, icon: <span aria-hidden>{flagEmoji(c.code)}</span> })),
    [],
  )

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormInput, unknown, RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { countryId: String(guessCountryId() ?? '') },
  })

  const onSubmit = async (values: RegisterValues) => {
    try {
      const { codeSent } = await registerUser({
        ...values,
        ...(pendingInvite?.kind === 'token' && { inviteToken: pendingInvite.value }),
      })
      if (codeSent === false) toast.warning('Account created, but the email did not go out. Tap "Send a new code".')
      onSuccess?.()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create your account'))
    }
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" error={errors.firstname?.message}>
          <input className="field" autoComplete="given-name" {...register('firstname')} />
        </Field>
        <Field label="Last name" error={errors.lastname?.message}>
          <input className="field" autoComplete="family-name" {...register('lastname')} />
        </Field>
      </div>
      <Field label="Username" error={errors.username?.message} hint="How flatmates find you, e.g. sam.k">
        <input className="field" autoComplete="username" autoCapitalize="none" {...register('username')} />
      </Field>
      <Field label="Email" error={errors.email?.message} hint="We'll send a code to confirm it">
        <input className="field" type="email" autoComplete="email" autoCapitalize="none" {...register('email')} />
      </Field>
      <Field label="Password" error={errors.password?.message} hint="At least 8 characters">
        <input className="field" type="password" autoComplete="new-password" {...register('password')} />
      </Field>
      <Controller
        name="countryId"
        control={control}
        render={({ field }) => (
          <ComboboxField
            label="Country"
            placeholder="Search your country"
            options={countryOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.countryId?.message}
          />
        )}
      />
      <Controller
        name="birthDate"
        control={control}
        render={({ field }) => (
          <DatePicker
            label="Birth date"
            placeholder="Pick your birthday"
            value={field.value ?? ''}
            onChange={field.onChange}
            min={new Date(1900, 0, 1)}
            max={new Date()}
            jumpers
            defaultDate={new Date(2000, 0, 1)}
            error={errors.birthDate?.message}
          />
        )}
      />
      <Button type="submit" className="mt-2 w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}
