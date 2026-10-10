import { Checkbox } from '@headlessui/react'
import { Check } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { useCreateBill } from '@/services/bills'
import { useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { BillCategory } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'
import { formatMoney, parseMoney, splitEvenly } from '@/utils/money'
import { categories } from './bill-utils'

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'DZD', 'MAD', 'TND']

const chip = (on: boolean) =>
  cn(
    'flex min-h-10 items-center gap-1.5 rounded-full border-[1.5px] border-ink px-3.5 text-sm font-bold transition-colors',
    on ? 'bg-ink text-paper' : 'bg-paper',
  )

type Props = { householdId: string; open: boolean; onClose: () => void }

export function AddBillSheet({ householdId, open, onClose }: Props) {
  return (
    <BottomSheet open={open} title="New bill" onClose={onClose}>
      {open && <BillForm householdId={householdId} onClose={onClose} />}
    </BottomSheet>
  )
}

function BillForm({ householdId, onClose }: { householdId: string; onClose: () => void }) {
  const me = useAuthStore((state) => state.user)
  const { data: members = [] } = useMembers(householdId)
  const createBill = useCreateBill(householdId)

  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('EUR')
  const [category, setCategory] = useState<BillCategory>('other')
  const [paidById, setPaidById] = useState(me?.id ?? '')
  const [dueDate, setDueDate] = useState('')
  const [split, setSplit] = useState<'equal' | 'custom'>('equal')
  // Equal: who's in. Custom: what each person pays (as typed).
  const [excluded, setExcluded] = useState<Set<string>>(new Set())
  const [custom, setCustom] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState(false)

  const totalCents = parseMoney(amount)
  const participants = members.filter((m) => !excluded.has(m.userId))
  const equalParts = useMemo(
    () => (totalCents ? splitEvenly(totalCents, participants.length) : []),
    [totalCents, participants.length],
  )
  const customCents = members.map((m) => (custom[m.userId] ? (parseMoney(custom[m.userId]) ?? NaN) : 0))
  const customSum = customCents.reduce((a, b) => a + (Number.isNaN(b) ? 0 : b), 0)
  const customValid = !customCents.some(Number.isNaN) && customSum === totalCents

  const errors = {
    title: !title.trim() ? 'Give the bill a name' : undefined,
    amount: !totalCents ? 'Enter an amount, e.g. 42.50' : undefined,
    split:
      split === 'equal'
        ? participants.length === 0
          ? 'Pick at least one person'
          : undefined
        : !customValid && totalCents
          ? `Shares add up to ${formatMoney(customSum, currency)}, not ${formatMoney(totalCents, currency)}`
          : undefined,
  }
  const valid = !errors.title && !errors.amount && !errors.split

  const toggleParticipant = (userId: string) =>
    setExcluded((set) => {
      const next = new Set(set)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || !totalCents) return
    try {
      await createBill.mutateAsync({
        title: title.trim(),
        amountCents: totalCents,
        currency,
        category,
        ...(paidById && { paidById }),
        ...(dueDate && { dueDate }),
        ...(split === 'equal'
          ? { split: 'equal', participantIds: participants.map((m) => m.userId) }
          : {
              split: 'custom',
              shares: members
                .map((m, i) => ({ userId: m.userId, amountCents: customCents[i] }))
                .filter((s) => s.amountCents > 0),
            }),
      })
      toast.success('Bill added')
      onClose()
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not add the bill'))
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={onSubmit} noValidate>
      <Field label="What's it for?" error={touched ? errors.title : undefined}>
        <input className="field" placeholder="October rent" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} aria-invalid={touched && !!errors.title} />
      </Field>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Field label="Amount" error={touched ? errors.amount : undefined}>
          <input
            className="field text-lg font-extrabold tabular-nums"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            aria-invalid={touched && !!errors.amount}
          />
        </Field>
        <Select
          label="Currency"
          className="w-28"
          value={currency}
          onChange={setCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c.value} type="button" aria-pressed={category === c.value} className={chip(category === c.value)} onClick={() => setCategory(c.value)}>
              <span aria-hidden>{c.emoji}</span> {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold">Paid by</legend>
        <div className="flex flex-wrap gap-2">
          {members.map(({ user }) => (
            <button key={user.id} type="button" aria-pressed={paidById === user.id} className={cn(chip(paidById === user.id), 'pl-1')} onClick={() => setPaidById(user.id)}>
              <Avatar person={user} size="sm" className="size-7 text-[10px]" />
              {user.id === me?.id ? 'Me' : user.firstname}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-sm font-bold">Split</legend>
        <div className="segmented bg-ivory" role="tablist" aria-label="Split type">
          <button type="button" role="tab" aria-selected={split === 'equal'} onClick={() => setSplit('equal')}>
            Equally
          </button>
          <button type="button" role="tab" aria-selected={split === 'custom'} onClick={() => setSplit('custom')}>
            Custom amounts
          </button>
        </div>

        <ul className="flex flex-col gap-2">
          {members.map((m, i) => {
            const included = !excluded.has(m.userId)
            const part = equalParts[participants.findIndex((p) => p.userId === m.userId)]
            return (
              <li key={m.userId} className="flex min-h-12 items-center gap-3">
                <Avatar person={m.user} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold">{m.userId === me?.id ? 'Me' : m.user.firstname}</span>
                {split === 'equal' ? (
                  <>
                    <span className="muted text-sm font-bold tabular-nums">
                      {included && part ? formatMoney(part, currency) : '—'}
                    </span>
                    <Checkbox
                      checked={included}
                      onChange={() => toggleParticipant(m.userId)}
                      aria-label={`Include ${m.user.firstname}`}
                      className="group grid size-8 shrink-0 cursor-pointer place-items-center rounded-full border-2 border-ink transition-colors data-checked:bg-ink data-checked:text-paper"
                    >
                      <Check size={16} strokeWidth={3} className="invisible group-data-checked:visible" aria-hidden />
                    </Checkbox>
                  </>
                ) : (
                  <input
                    className={cn('field w-28 text-right font-bold tabular-nums', Number.isNaN(customCents[i]) && 'border-red-700')}
                    inputMode="decimal"
                    placeholder="0.00"
                    value={custom[m.userId] ?? ''}
                    onChange={(e) => setCustom((c) => ({ ...c, [m.userId]: e.target.value }))}
                    aria-label={`${m.user.firstname}'s share`}
                  />
                )}
              </li>
            )
          })}
        </ul>
        {errors.split && (touched || split === 'custom') && <p className="text-sm font-semibold text-red-700">{errors.split}</p>}
      </fieldset>

      <DatePicker
        label="Due date"
        placeholder="No due date"
        hint="Optional. Everyone gets a reminder before it's due."
        value={dueDate}
        onChange={setDueDate}
        min={new Date()}
        clearable
      />

      <Button type="submit" disabled={createBill.isPending}>
        {createBill.isPending ? 'Adding…' : totalCents ? `Add ${formatMoney(totalCents, currency)} bill` : 'Add bill'}
      </Button>
    </form>
  )
}
