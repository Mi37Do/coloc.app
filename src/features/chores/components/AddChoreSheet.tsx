import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { DateTimePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { useCreateChore, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import { apiErrorMessage } from '@/utils/api-error'
import { choreEmoji } from '@/utils/chore-art'
import { cn } from '@/utils/cn'

const schema = z.object({
  title: z.string().trim().min(1, 'Give the chore a name').max(120),
  dueAt: z.string().optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
  /** '' = anyone */
  assigneeId: z.string(),
})
type Values = z.infer<typeof schema>

const suggestions = ['Laundry', 'Wash the dishes', 'Take out the trash', 'Vacuum', 'Clean the bathroom', 'Water the plants']
const repeats = [
  ['none', 'Once'],
  ['daily', 'Daily'],
  ['weekly', 'Weekly'],
  ['monthly', 'Monthly'],
] as const

const chip = (on: boolean) =>
  cn(
    'flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-3.5 text-sm font-bold transition-colors',
    on ? 'bg-ink text-paper' : 'bg-paper',
  )

type Props = { householdId: string; open: boolean; onClose: () => void }

export function AddChoreSheet({ householdId, open, onClose }: Props) {
  const me = useAuthStore((state) => state.user)
  const { data: members = [] } = useMembers(householdId)
  const createChore = useCreateChore(householdId)
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { recurrence: 'none', assigneeId: me?.id ?? '' },
  })
  const [title, recurrence, assigneeId] = watch(['title', 'recurrence', 'assigneeId'])

  const close = () => {
    reset({ recurrence: 'none', assigneeId: me?.id ?? '' })
    onClose()
  }

  const onSubmit = async ({ title, dueAt, recurrence, assigneeId }: Values) => {
    try {
      await createChore.mutateAsync({
        title,
        recurrence,
        // The picker gives local "YYYY-MM-DDTHH:mm" without a zone; send ISO.
        ...(dueAt && { dueAt: new Date(dueAt).toISOString() }),
        ...(assigneeId && { assigneeId }),
      })
      toast.success('Chore added')
      close()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not add the chore'))
    }
  }

  return (
    <BottomSheet open={open} title="New chore" onClose={close}>
      <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Field label="What needs doing?" error={errors.title?.message}>
          <div className="relative">
            <input
              className="field pr-14"
              placeholder="Take out the trash"
              aria-invalid={!!errors.title}
              {...register('title')}
            />
            <span className="absolute top-1/2 right-4 -translate-y-1/2 text-2xl" aria-hidden>
              {choreEmoji(title ?? '')}
            </span>
          </div>
        </Field>

        <div className="no-scrollbar -mx-5 -mt-2 flex gap-2 overflow-x-auto px-5 pb-1" aria-label="Suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className={cn(chip(false), 'shrink-0')}
              onClick={() => setValue('title', s, { shouldValidate: true })}
            >
              <span aria-hidden>{choreEmoji(s)}</span> {s}
            </button>
          ))}
        </div>

        <Controller
          name="dueAt"
          control={control}
          render={({ field }) => (
            <DateTimePicker label="Due" value={field.value ?? ''} onChange={field.onChange} min={new Date()} emptyLabel="No due date" />
          )}
        />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">Repeats</legend>
          <div className="flex flex-wrap gap-2">
            {repeats.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={recurrence === value}
                className={chip(recurrence === value)}
                onClick={() => setValue('recurrence', value)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-bold">Assign to</legend>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={assigneeId === ''}
              className={chip(assigneeId === '')}
              onClick={() => setValue('assigneeId', '')}
            >
              Anyone
            </button>
            {members.map(({ user }) => (
              <button
                key={user.id}
                type="button"
                aria-pressed={assigneeId === user.id}
                className={cn(chip(assigneeId === user.id), 'pl-1')}
                onClick={() => setValue('assigneeId', user.id)}
              >
                <Avatar person={user} size="sm" className="size-7 text-[10px]" />
                {user.id === me?.id ? 'Me' : user.firstname}
              </button>
            ))}
          </div>
        </fieldset>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Adding…' : 'Add chore'}
        </Button>
      </form>
    </BottomSheet>
  )
}
