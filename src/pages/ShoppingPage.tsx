import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { CreateHousehold } from '@/features/chores'
import { useActiveHousehold } from '@/services/households'
import { useCreateList, useShoppingLists } from '@/services/shopping'
import { apiErrorMessage } from '@/utils/api-error'
import { formatRelative } from '@/utils/dates'
import { cn } from '@/utils/cn'

const tints = ['bg-sky', 'bg-butter', 'bg-mint', 'bg-blush']

export function ShoppingPage() {
  const { active, isPending } = useActiveHousehold()
  if (isPending) return <div className="panel panel--sky h-40 animate-pulse" aria-busy="true" />
  if (!active) return <CreateHousehold />
  return <Lists householdId={active.id} />
}

function Lists({ householdId }: { householdId: string }) {
  const { data: lists, isPending } = useShoppingLists(householdId)
  const createList = useCreateList(householdId)
  const [name, setName] = useState('')
  const remaining = (lists ?? []).reduce((sum, l) => sum + (l.remainingCount ?? 0), 0)

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    try {
      await createList.mutateAsync(name.trim())
      setName('')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create the list'))
    }
  }

  return (
    <>
      <ScreenHeader
        title="Shopping"
        back="/"
        tone="sky"
        subtitle={lists ? `${remaining} ${remaining === 1 ? 'item' : 'items'} to buy across ${lists.length} ${lists.length === 1 ? 'list' : 'lists'}` : ' '}
      />

      <section className="panel flex flex-1 flex-col gap-4 pb-6" aria-label="Shopping lists">
        <form onSubmit={onCreate} className="flex gap-2">
          <input
            className="field"
            placeholder="New list, e.g. Weekly groceries"
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="New list name"
          />
          <button className="icon-btn size-[50px] shrink-0" disabled={!name.trim() || createList.isPending} aria-label="Create list">
            <Plus size={22} aria-hidden />
          </button>
        </form>

        {isPending ? (
          <div className="flex flex-col gap-2.5" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-tile bg-ivory" />
            ))}
          </div>
        ) : !lists?.length ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              🛒
            </span>
            <p className="font-bold">No shopping lists yet</p>
            <p className="muted max-w-64 text-sm font-medium">Start one above. Everyone in the household can add to it.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {lists.map((list, i) => (
              <li key={list.id}>
                <Link
                  to={`/shopping/${list.id}`}
                  className="tile tile--outline flex items-center gap-3 transition-transform active:scale-[0.99]"
                >
                  <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl text-2xl', tints[i % tints.length])} aria-hidden>
                    🛒
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-bold">{list.name}</span>
                    <span className="muted block text-sm font-semibold">
                      {list.remainingCount ? `${list.remainingCount} to buy` : 'All bought'} · {formatRelative(list.updatedAt)}
                    </span>
                  </span>
                  <ChevronRight size={20} aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
