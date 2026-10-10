import { useState } from 'react'
import { ArrowRight, Check, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { AddBillSheet } from '@/features/bills/AddBillSheet'
import { categoryEmoji, myStatus } from '@/features/bills/bill-utils'
import { CreateHousehold } from '@/features/chores'
import { useBalances, useBill, useBills, useDeleteBill, useSettleShare } from '@/services/bills'
import { useActiveHousehold, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { Bill, Member } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'
import { formatMoney } from '@/utils/money'

const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

export function BillsPage() {
  const { active, isPending } = useActiveHousehold()
  if (isPending) return <div className="panel panel--butter h-40 animate-pulse" aria-busy="true" />
  if (!active) return <CreateHousehold />
  return <Bills householdId={active.id} />
}

function Bills({ householdId }: { householdId: string }) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: bills, isPending } = useBills(householdId)
  const { data: balances = [] } = useBalances(householdId)
  const { data: members = [] } = useMembers(householdId)
  const [adding, setAdding] = useState(false)
  const [openId, setOpenId] = useState<string>()

  const nameOf = (id: string) => (id === meId ? 'You' : (members.find((m) => m.userId === id)?.user.firstname ?? 'Someone'))
  const personOf = (id: string) => members.find((m) => m.userId === id)?.user

  return (
    <>
      <ScreenHeader
        title="Bills"
        back="/"
        tone="butter"
        subtitle="Split costs, see who owes whom"
        action={
          <button className="icon-btn" onClick={() => setAdding(true)} aria-label="New bill">
            <Plus size={22} aria-hidden />
          </button>
        }
      >
        <div className="mt-5 flex flex-col gap-2">
          {balances.length === 0 ? (
            <div className="tile tile--outline flex items-center gap-3">
              <span className="text-3xl" aria-hidden>
                🤝
              </span>
              <div>
                <p className="font-bold">All square</p>
                <p className="muted text-sm font-semibold">Nobody owes anybody right now.</p>
              </div>
            </div>
          ) : (
            balances.map(({ currency, members: nets }) => {
              const net = nets.find((n) => n.userId === meId)?.netCents ?? 0
              return (
                <div key={currency} className={cn('tile tile--outline', net > 0 ? 'bg-mint' : net < 0 ? 'bg-blush' : 'bg-paper')}>
                  <p className="text-sm font-bold">{net > 0 ? "You're owed" : net < 0 ? 'You owe' : "You're square"}</p>
                  <p className="text-[32px] leading-tight font-extrabold tabular-nums">{formatMoney(Math.abs(net), currency)}</p>
                </div>
              )
            })
          )}
        </div>
      </ScreenHeader>

      {balances.some((b) => b.owes.length > 0) && (
        <section className="panel flex flex-col gap-3" aria-labelledby="owes-title">
          <h2 id="owes-title" className="text-[17px] font-bold">
            Who owes whom
          </h2>
          <ul className="flex flex-col gap-2.5">
            {balances.flatMap(({ currency, owes }) =>
              owes.map((o) => {
                const from = personOf(o.fromUserId)
                const to = personOf(o.toUserId)
                const involvesMe = o.fromUserId === meId || o.toUserId === meId
                return (
                  <li
                    key={`${currency}-${o.fromUserId}-${o.toUserId}`}
                    className={cn('flex items-center gap-2 rounded-2xl p-2.5', involvesMe ? 'bg-butter' : 'bg-ivory')}
                  >
                    {from && <Avatar person={from} size="sm" />}
                    <ArrowRight size={16} aria-hidden />
                    {to && <Avatar person={to} size="sm" />}
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {nameOf(o.fromUserId)} {o.fromUserId === meId ? 'owe' : 'owes'} {nameOf(o.toUserId) === 'You' ? 'you' : nameOf(o.toUserId)}
                    </span>
                    <span className="font-extrabold tabular-nums">{formatMoney(o.amountCents, currency)}</span>
                  </li>
                )
              }),
            )}
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
            <p className="muted max-w-64 text-sm font-medium">Add rent, groceries or the internet bill and split it in seconds.</p>
            <Button className="mt-2" onClick={() => setAdding(true)}>
              Add a bill
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {bills.map((bill) => (
              <BillRow key={bill.id} bill={bill} meId={meId} payerName={bill.paidById ? nameOf(bill.paidById) : '—'} onOpen={() => setOpenId(bill.id)} />
            ))}
          </ul>
        )}
      </section>

      <AddBillSheet householdId={householdId} open={adding} onClose={() => setAdding(false)} />
      <BillSheet householdId={householdId} billId={openId} members={members} onClose={() => setOpenId(undefined)} />
    </>
  )
}

function BillRow({ bill, meId, payerName, onOpen }: { bill: Bill; meId?: string; payerName: string; onOpen: () => void }) {
  const status = myStatus(bill, meId)
  return (
    <li>
      <button onClick={onOpen} className="tile tile--outline flex w-full items-center gap-3 text-left transition-transform active:scale-[0.99]">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ivory text-2xl" aria-hidden>
          {categoryEmoji(bill.category)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[17px] font-bold">{bill.title}</span>
          <span className="muted block truncate text-sm font-semibold">
            {payerName} paid · {dateFmt.format(new Date(bill.createdAt))}
          </span>
        </span>
        <span className="flex flex-col items-end gap-1">
          <span className="font-extrabold tabular-nums">{formatMoney(bill.amountCents, bill.currency)}</span>
          {status.kind === 'owe' && <span className="badge bg-blush">You owe {formatMoney(status.cents, bill.currency)}</span>}
          {status.kind === 'owed' && <span className="badge bg-mint">Owed {formatMoney(status.cents, bill.currency)}</span>}
          {status.kind === 'settled' && (
            <span className="badge">
              <Check size={12} aria-hidden /> Settled
            </span>
          )}
        </span>
      </button>
    </li>
  )
}

type BillSheetProps = { householdId: string; billId?: string; members: Member[]; onClose: () => void }

function BillSheet({ householdId, billId, members, onClose }: BillSheetProps) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: bill } = useBill(householdId, billId)
  const settle = useSettleShare(householdId)
  const remove = useDeleteBill(householdId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isAdmin = members.some((m) => m.userId === meId && m.role === 'admin')

  const shown = bill?.id === billId ? bill : undefined

  return (
    <>
      <BottomSheet open={!!billId} title={shown?.title ?? 'Bill'} onClose={onClose}>
        {!shown ? (
          <div className="h-48 animate-pulse rounded-tile bg-ivory" aria-busy="true" />
        ) : (
          <div className="flex flex-col gap-5">
            <div className="tile tile--outline flex items-center gap-3 bg-butter">
              <span className="text-4xl" aria-hidden>
                {categoryEmoji(shown.category)}
              </span>
              <div>
                <p className="text-[28px] leading-tight font-extrabold tabular-nums">{formatMoney(shown.amountCents, shown.currency)}</p>
                <p className="text-sm font-semibold">
                  Paid by {shown.paidById === meId ? 'you' : (shown.paidBy?.firstname ?? '—')}
                  {shown.dueDate && ` · due ${dateFmt.format(new Date(shown.dueDate))}`}
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-3" aria-label="Shares">
              {shown.shares.map((share) => {
                const isPayer = share.userId === shown.paidById
                const canToggle = !isPayer && (isAdmin || share.userId === meId || shown.paidById === meId)
                const person = share.user ?? members.find((m) => m.userId === share.userId)?.user
                return (
                  <li key={share.id} className="flex min-h-12 items-center gap-3">
                    {person && <Avatar person={person} size="sm" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold">{share.userId === meId ? 'You' : person?.firstname}</span>
                      <span className="muted block text-sm font-semibold">
                        {isPayer ? 'Paid the bill' : share.settledAt ? 'Paid back' : 'Hasn’t paid back'}
                      </span>
                    </span>
                    <span className="font-extrabold tabular-nums">{formatMoney(share.amountCents, shown.currency)}</span>
                    {!isPayer && (
                      <button
                        disabled={!canToggle || settle.isPending}
                        onClick={() =>
                          settle.mutate(
                            { billId: shown.id, userId: share.userId, settled: !share.settledAt },
                            { onError: (e) => toast.error(apiErrorMessage(e, 'Could not update the share')) },
                          )
                        }
                        aria-pressed={!!share.settledAt}
                        aria-label={`${person?.firstname ?? 'This share'} paid back`}
                        className={cn(
                          'grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink transition-colors disabled:opacity-30',
                          share.settledAt && 'bg-ink text-paper',
                        )}
                      >
                        {share.settledAt && <Check size={16} strokeWidth={3} aria-hidden />}
                      </button>
                    )}
                  </li>
                )
              })}
            </ul>

            {(isAdmin || shown.createdById === meId) && (
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
        description="Its shares disappear from everyone's balance."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          shown &&
          remove.mutate(shown.id, {
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
