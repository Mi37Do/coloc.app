import { useState } from 'react'
import { CalendarDays, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { AddBillSheet } from '@/features/bills/AddBillSheet'
import { byCategory, categories, categoryEmoji, monthTotal } from '@/features/bills/bill-utils'
import { CreateHousehold } from '@/features/chores'
import { useBills, useDeleteBill } from '@/services/bills'
import { useActiveHousehold, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { Bill } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { formatMoney } from '@/utils/money'

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })
const monthFmt = new Intl.DateTimeFormat(undefined, { month: 'long' })

export function BillsPage() {
  const { active, isPending } = useActiveHousehold()
  if (isPending) return <div className="panel panel--butter h-40 animate-pulse" aria-busy="true" />
  if (!active) return <CreateHousehold />
  return <Bills householdId={active.id} />
}

function Bills({ householdId }: { householdId: string }) {
  const { data: bills, isPending } = useBills(householdId)
  const [adding, setAdding] = useState(false)
  const [open, setOpen] = useState<Bill>()

  const total = monthTotal(bills ?? [])
  const breakdown = byCategory(bills ?? [])

  return (
    <>
      <ScreenHeader
        title="Bills"
        back="/"
        tone="butter"
        subtitle={`Spent in ${monthFmt.format(new Date())}`}
        action={
          <button className="icon-btn" onClick={() => setAdding(true)} aria-label="New bill">
            <Plus size={22} aria-hidden />
          </button>
        }
      >
        <div className="tile tile--outline mt-5 bg-paper">
          <p className="text-sm font-bold">This month</p>
          <p className="text-[32px] leading-tight font-extrabold tabular-nums">{formatMoney(total)}</p>
        </div>
      </ScreenHeader>

      {breakdown.length > 0 && (
        <section className="panel flex flex-col gap-3" aria-labelledby="split-title">
          <h2 id="split-title" className="text-[17px] font-bold">
            By category
          </h2>
          <ul className="flex flex-col gap-3">
            {breakdown.map(({ category, cents }) => (
              <li key={category} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span aria-hidden>{categoryEmoji(category)}</span>
                  <span className="min-w-0 flex-1 font-bold">{categories.find((c) => c.value === category)?.label}</span>
                  <span className="font-extrabold tabular-nums">{formatMoney(cents)}</span>
                </div>
                <div className="meter" aria-hidden>
                  <span style={{ width: `${Math.max((cents / total) * 100, 6)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="panel flex flex-1 flex-col gap-3 pb-6" aria-labelledby="bills-title">
        <h2 id="bills-title" className="text-[17px] font-bold">
          All bills
        </h2>
        {isPending ? (
          <div className="flex flex-col gap-2.5" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-tile bg-ivory" />
            ))}
          </div>
        ) : !bills?.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              🧾
            </span>
            <p className="font-bold">No bills yet</p>
            <p className="muted max-w-64 text-sm font-medium">Add rent, groceries or the internet bill to keep track of what the house spends.</p>
            <Button className="mt-2" onClick={() => setAdding(true)}>
              Add a bill
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {bills.map((bill) => (
              <li key={bill.id}>
                <button onClick={() => setOpen(bill)} className="tile tile--outline flex w-full items-center gap-3 text-left transition-transform active:scale-[0.99]">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ivory text-2xl" aria-hidden>
                    {categoryEmoji(bill.category)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-bold">{bill.title}</span>
                    <span className="muted block truncate text-sm font-semibold">
                      {dateFmt.format(new Date(bill.createdAt))}
                      {bill.dueDate && ` · due ${dateFmt.format(new Date(bill.dueDate))}`}
                    </span>
                  </span>
                  <span className="font-extrabold tabular-nums">{formatMoney(bill.amountCents)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddBillSheet householdId={householdId} open={adding} onClose={() => setAdding(false)} />
      <BillSheet householdId={householdId} bill={open} onClose={() => setOpen(undefined)} />
    </>
  )
}

function BillSheet({ householdId, bill, onClose }: { householdId: string; bill?: Bill; onClose: () => void }) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: members = [] } = useMembers(householdId)
  const remove = useDeleteBill(householdId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isAdmin = members.some((m) => m.userId === meId && m.role === 'admin')
  const category = categories.find((c) => c.value === bill?.category)
  const canDelete = !!bill && (isAdmin || bill.createdById === meId)

  return (
    <>
      <BottomSheet open={!!bill} title={bill?.title ?? 'Bill'} onClose={onClose}>
        {bill && (
          <div className="flex flex-col gap-5">
            <div className="tile tile--outline flex items-center gap-3 bg-butter">
              <span className="text-4xl" aria-hidden>
                {categoryEmoji(bill.category)}
              </span>
              <div>
                <p className="text-[28px] leading-tight font-extrabold tabular-nums">{formatMoney(bill.amountCents)}</p>
                <p className="text-sm font-semibold">{category?.label}</p>
              </div>
            </div>
            <dl className="flex flex-col gap-2 text-sm font-semibold">
              <div className="flex justify-between gap-3">
                <dt className="muted">Added</dt>
                <dd>
                  {dateFmt.format(new Date(bill.createdAt))}
                  {bill.paidBy && ` by ${bill.paidById === meId ? 'you' : bill.paidBy.firstname}`}
                </dd>
              </div>
              {bill.dueDate && (
                <div className="flex justify-between gap-3">
                  <dt className="muted">Due</dt>
                  <dd className="flex items-center gap-1">
                    <CalendarDays size={14} aria-hidden /> {dateFmt.format(new Date(bill.dueDate))}
                  </dd>
                </div>
              )}
            </dl>
            {canDelete && (
              <Button variant="blush" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={18} aria-hidden /> Delete bill
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this bill?"
        description="It's removed for everyone and from this month's total."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          bill &&
          remove.mutate(bill.id, {
            onSuccess: () => {
              toast.success('Bill deleted')
              onClose()
            },
            onError: (e) => toast.error(apiErrorMessage(e, 'Could not delete the bill')),
          })
        }
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
