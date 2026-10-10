import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Field } from '@/components/ui/Field'
import { useCreateBill } from '@/services/bills'
import type { BillCategory } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'
import { CURRENCY, formatMoney, parseMoney } from '@/utils/money'
import { categories } from './bill-utils'

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
  const createBill = useCreateBill(householdId)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<BillCategory>('other')
  const [dueDate, setDueDate] = useState('')
  const [touched, setTouched] = useState(false)

  const cents = parseMoney(amount)
  const errors = {
    title: !title.trim() ? 'Give the bill a name' : undefined,
    amount: !cents ? 'Enter an amount, e.g. 4500' : undefined,
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (errors.title || !cents) return
    try {
      await createBill.mutateAsync({
        title: title.trim(),
        amountCents: cents,
        currency: CURRENCY,
        category,
        ...(dueDate && { dueDate }),
        // The API needs a split; the default is equal between all members.
        split: 'equal',
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

      <Field label={`Amount (${CURRENCY})`} error={touched ? errors.amount : undefined}>
        <input
          className="field text-lg font-extrabold tabular-nums"
          inputMode="decimal"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          aria-invalid={touched && !!errors.amount}
        />
      </Field>

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
        {createBill.isPending ? 'Adding…' : cents ? `Add ${formatMoney(cents)} bill` : 'Add bill'}
      </Button>
    </form>
  )
}
