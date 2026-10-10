import { useState, type FormEvent } from 'react'
import { Checkbox } from '@headlessui/react'
import { Check, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { DateTimePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { useCreateEvent, useUpdateEvent } from '@/services/events'
import { useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { HouseholdEvent } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { toISODate } from '@/utils/dates'

type Props = {
  householdId: string
  open: boolean
  onClose: () => void
  /** Edit this event instead of creating one */
  event?: HouseholdEvent
  /** Pre-fill the day when creating from the schedule */
  day?: Date
  onSaved?: (event: HouseholdEvent) => void
}

export function EventSheet(props: Props) {
  return (
    <BottomSheet open={props.open} title={props.event ? 'Edit event' : 'New event'} onClose={props.onClose}>
      {props.open && <EventForm {...props} />}
    </BottomSheet>
  )
}

const pad = (n: number) => String(n).padStart(2, '0')
/** Date -> local "YYYY-MM-DDTHH:mm" */
const toLocalInput = (d: Date) => `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })

function EventForm({ householdId, onClose, event, day, onSaved }: Props) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: members = [] } = useMembers(householdId)
  const create = useCreateEvent(householdId)
  const update = useUpdateEvent(householdId, event?.id ?? '')

  const [title, setTitle] = useState(event?.title ?? '')
  const [start, setStart] = useState(() => {
    if (event) return toLocalInput(new Date(event.startsAt))
    return day && day >= new Date(new Date().toDateString()) ? `${toISODate(day)}T19:00` : ''
  })
  // End is a duration after the start, so moving the start keeps the length
  const [durationMin, setDurationMin] = useState<number>(() =>
    event?.endsAt ? Math.round((new Date(event.endsAt).getTime() - new Date(event.startsAt).getTime()) / 60_000) : 0,
  )
  const [location, setLocation] = useState(event?.location ?? '')
  const [description, setDescription] = useState(event?.description ?? '')
  const [hidden, setHidden] = useState<Set<string>>(new Set(event?.excludedUserIds ?? []))
  const [touched, setTouched] = useState(false)

  const creatorId = event?.createdById ?? meId
  const startDate = start ? new Date(start) : undefined
  const endDate = startDate && durationMin > 0 ? new Date(startDate.getTime() + durationMin * 60_000) : undefined

  const durations = [0, 30, 60, 90, 120, 180, 240, 360, 720]
  if (!durations.includes(durationMin)) durations.push(durationMin)
  const durationOptions = durations
    .sort((a, b) => a - b)
    .map((m) => ({
      value: m,
      label:
        m === 0
          ? 'No end time'
          : `${m < 60 ? `${m} min` : `${m / 60} h`}${startDate ? ` · until ${timeFmt.format(new Date(startDate.getTime() + m * 60_000))}` : ''}`,
    }))

  const errors = {
    title: !title.trim() ? 'Give the event a name' : undefined,
    start: !startDate ? 'Pick when it starts' : undefined,
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (errors.title || !startDate) return
    const input = {
      title: title.trim(),
      startsAt: startDate.toISOString(),
      ...(endDate && { endsAt: endDate.toISOString() }),
      // When editing, '' clears the field; when creating, leave it out
      location: location.trim() || (event ? '' : undefined),
      description: description.trim() || (event ? '' : undefined),
      excludedUserIds: [...hidden],
    }
    try {
      const saved = event ? await update.mutateAsync(input) : await create.mutateAsync(input)
      toast.success(event ? 'Event updated' : 'Event added')
      onSaved?.(saved)
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not save the event'))
    }
  }

  const busy = create.isPending || update.isPending
  const others = members.filter((m) => m.userId !== creatorId)

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <Field label="What's happening?" error={touched ? errors.title : undefined}>
        <input className="field" placeholder="House dinner" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={touched && !!errors.title} />
      </Field>

      <div className="flex flex-col gap-1.5">
        <DateTimePicker label="Starts" value={start} onChange={setStart} min={event ? undefined : new Date()} defaultTime="19:00" />
        {touched && errors.start && <span className="text-sm font-semibold text-red-700">{errors.start}</span>}
      </div>

      <Select label="Lasts" value={durationMin} onChange={setDurationMin} options={durationOptions} />

      <Field label="Where">
        <input className="field" placeholder="Living room, or an address" maxLength={255} value={location} onChange={(e) => setLocation(e.target.value)} />
      </Field>

      <Field label="Notes">
        <textarea
          className="field min-h-24 resize-none [field-sizing:content]"
          placeholder="Bring something to drink 🍷"
          maxLength={2000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>

      {others.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 flex items-center gap-1.5 text-sm font-bold">
            <EyeOff size={16} aria-hidden /> Hide from
          </legend>
          <p className="muted -mt-1 text-sm font-medium">For surprises: they won't see this event at all.</p>
          <ul className="flex flex-col gap-1">
            {others.map((m) => (
              <li key={m.userId} className="flex min-h-12 items-center gap-3">
                <Avatar person={m.user} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold">{m.user.firstname}</span>
                <Checkbox
                  checked={hidden.has(m.userId)}
                  onChange={(on) =>
                    setHidden((s) => {
                      const next = new Set(s)
                      if (on) next.add(m.userId)
                      else next.delete(m.userId)
                      return next
                    })
                  }
                  aria-label={`Hide from ${m.user.firstname}`}
                  className="group grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink transition-colors data-checked:bg-ink data-checked:text-paper"
                >
                  <Check size={16} strokeWidth={3} className="invisible group-data-checked:visible" aria-hidden />
                </Checkbox>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      <Button type="submit" disabled={busy}>
        {busy ? 'Saving…' : event ? 'Save changes' : 'Add event'}
      </Button>
    </form>
  )
}
