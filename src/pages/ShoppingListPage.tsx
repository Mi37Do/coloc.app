import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Archive, Check, Minus, MoreHorizontal, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { parseItem } from '@/features/shopping/parse-item'
import { useActiveHousehold } from '@/services/households'
import { useDeleteList, useItemActions, useShoppingList, useUpdateList } from '@/services/shopping'
import type { ShoppingItem } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'

export function ShoppingListPage() {
  const { listId = '' } = useParams()
  const { active } = useActiveHousehold()
  if (!active) return <div className="panel panel--sky h-40 animate-pulse" aria-busy="true" />
  return <ListView householdId={active.id} listId={listId} />
}

function ListView({ householdId, listId }: { householdId: string; listId: string }) {
  const navigate = useNavigate()
  const { data: list, isPending, isError } = useShoppingList(householdId, listId)
  const { add, toggle, update, remove, clearChecked } = useItemActions(householdId, listId)
  const [text, setText] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem>()

  if (isPending) return <div className="panel panel--sky h-40 animate-pulse" aria-busy="true" />
  if (isError || !list) {
    return (
      <section className="panel flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p className="font-bold">This list doesn't exist anymore</p>
        <Button variant="light" onClick={() => navigate('/shopping')}>
          Back to lists
        </Button>
      </section>
    )
  }

  const items = list.items ?? []
  const toBuy = items.filter((i) => !i.checkedAt).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const inBasket = items.filter((i) => i.checkedAt)

  const onAdd = (e: FormEvent) => {
    e.preventDefault()
    const item = parseItem(text)
    if (!item) return
    setText('')
    add.mutate(item, { onError: (err) => toast.error(apiErrorMessage(err, 'Could not add the item')) })
  }

  const onToggle = (item: ShoppingItem) =>
    toggle.mutate(item, { onError: (err) => toast.error(apiErrorMessage(err, 'Could not update the item')) })

  return (
    <>
      <ScreenHeader
        title={list.name}
        back="/shopping"
        tone="sky"
        subtitle={toBuy.length ? `${toBuy.length} to buy` : items.length ? 'Everything is in the basket 🎉' : 'Empty list'}
        action={
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="List options">
            <MoreHorizontal size={20} aria-hidden />
          </button>
        }
      >
        <form onSubmit={onAdd} className="mt-5 flex gap-2">
          <input
            className="field"
            placeholder="Add: 2 milk, bread, 500 g flour…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            aria-label="Add an item"
            enterKeyHint="done"
          />
          <button className="icon-btn size-[50px] shrink-0" disabled={!parseItem(text)} aria-label="Add item">
            <Plus size={22} aria-hidden />
          </button>
        </form>
      </ScreenHeader>

      <section className="panel flex flex-1 flex-col gap-5 pb-6" aria-label="Items">
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              📝
            </span>
            <p className="font-bold">Nothing on this list yet</p>
            <p className="muted max-w-64 text-sm font-medium">Type above. "2 milk" adds two milks.</p>
          </div>
        ) : (
          <>
            {toBuy.length > 0 && (
              <ul className="flex flex-col gap-2">
                {toBuy.map((item) => (
                  <ItemRow key={item.id} item={item} onToggle={onToggle} onEdit={setEditing} />
                ))}
              </ul>
            )}

            {inBasket.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">In the basket · {inBasket.length}</h2>
                  <button
                    className="text-sm font-bold underline underline-offset-4"
                    onClick={() => clearChecked.mutate()}
                    disabled={clearChecked.isPending}
                  >
                    Clear
                  </button>
                </div>
                <ul className="flex flex-col gap-2">
                  {inBasket.map((item) => (
                    <ItemRow key={item.id} item={item} onToggle={onToggle} onEdit={setEditing} />
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <ItemSheet
        item={editing}
        onClose={() => setEditing(undefined)}
        onSave={(patch) =>
          editing &&
          update.mutate(
            { id: editing.id, ...patch },
            { onError: (err) => toast.error(apiErrorMessage(err, 'Could not save the item')) },
          )
        }
        onDelete={() => editing && remove.mutate(editing)}
      />
      <ListMenu householdId={householdId} listId={listId} name={list.name} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  )
}

function ItemRow({ item, onToggle, onEdit }: { item: ShoppingItem; onToggle: (i: ShoppingItem) => void; onEdit: (i: ShoppingItem) => void }) {
  const checked = !!item.checkedAt
  const qty = item.quantity > 1 || item.unit ? `${item.quantity}${item.unit ? ' ' + item.unit : ''}` : null

  return (
    <li className={cn('flex items-center gap-3 rounded-tile border-[1.5px] p-2 pr-3 transition-colors', checked ? 'border-line bg-ivory' : 'border-ink bg-paper')}>
      <button
        onClick={() => onToggle(item)}
        aria-pressed={checked}
        aria-label={`${item.name}${checked ? ', in the basket' : ''}`}
        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span
          className={cn(
            'grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink transition-colors',
            checked && 'bg-ink text-paper',
          )}
          aria-hidden
        >
          {checked && <Check size={15} strokeWidth={3} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn('block truncate font-bold', checked && 'line-through opacity-50')}>{item.name}</span>
          {item.note && <span className="muted block truncate text-sm font-medium">{item.note}</span>}
        </span>
        {qty && <span className="badge shrink-0 bg-butter">{qty}</span>}
        {item.addedBy && <Avatar person={item.addedBy} size="sm" className="size-7 text-[10px]" />}
      </button>
      <button onClick={() => onEdit(item)} className="grid size-9 shrink-0 place-items-center rounded-full hover:bg-ivory" aria-label={`Edit ${item.name}`}>
        <Pencil size={16} aria-hidden />
      </button>
    </li>
  )
}

type ItemSheetProps = {
  item?: ShoppingItem
  onClose: () => void
  onSave: (patch: { name: string; quantity: number; unit?: string; note?: string }) => void
  onDelete: () => void
}

function ItemSheet({ item, onClose, onSave, onDelete }: ItemSheetProps) {
  return (
    <BottomSheet open={!!item} title="Edit item" onClose={onClose}>
      {/* keyed so the form resets for each item */}
      {item && <ItemForm key={item.id} item={item} onClose={onClose} onSave={onSave} onDelete={onDelete} />}
    </BottomSheet>
  )
}

function ItemForm({ item, onClose, onSave, onDelete }: Required<Omit<ItemSheetProps, 'item'>> & { item: ShoppingItem }) {
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(item.quantity)
  const [unit, setUnit] = useState(item.unit ?? '')
  const [note, setNote] = useState(item.note ?? '')

  const save = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), quantity, unit: unit.trim() || undefined, note: note.trim() || undefined })
    onClose()
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Name
        <input className="field" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} />
      </label>
      <div className="grid grid-cols-[auto_1fr] gap-3">
        <div className="flex flex-col gap-1.5 text-sm font-bold">
          Quantity
          <div className="flex items-center gap-1 rounded-2xl border-[1.5px] border-ink p-1">
            <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-ivory" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Fewer">
              <Minus size={18} aria-hidden />
            </button>
            <span className="w-10 text-center text-lg font-extrabold tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button type="button" className="grid size-10 place-items-center rounded-xl hover:bg-ivory" onClick={() => setQuantity((q) => Math.min(9999, q + 1))} aria-label="More">
              <Plus size={18} aria-hidden />
            </button>
          </div>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Unit
          <input className="field" placeholder="kg, pack…" value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Note
        <input className="field" placeholder="Brand, size, where to find it…" value={note} maxLength={255} onChange={(e) => setNote(e.target.value)} />
      </label>
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <Button
          type="button"
          variant="blush"
          aria-label="Delete item"
          onClick={() => {
            onDelete()
            onClose()
          }}
        >
          <Trash2 size={18} aria-hidden />
        </Button>
        <Button type="submit" disabled={!name.trim()}>
          Save
        </Button>
      </div>
    </form>
  )
}

type ListMenuProps = { householdId: string; listId: string; name: string; open: boolean; onClose: () => void }

function ListMenu({ householdId, listId, name, open, onClose }: ListMenuProps) {
  const navigate = useNavigate()
  const updateList = useUpdateList(householdId, listId)
  const deleteList = useDeleteList(householdId)
  const [renaming, setRenaming] = useState<string>()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const row = 'flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-bold hover:bg-ivory'

  return (
    <>
      <BottomSheet open={open} title={name} onClose={onClose}>
        {renaming !== undefined ? (
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!renaming.trim()) return
              updateList.mutate({ name: renaming.trim() }, { onSuccess: () => toast.success('List renamed') })
              setRenaming(undefined)
              onClose()
            }}
          >
            <input className="field" autoFocus value={renaming} maxLength={80} onChange={(e) => setRenaming(e.target.value)} aria-label="List name" />
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="light" onClick={() => setRenaming(undefined)}>
                <X size={18} aria-hidden /> Cancel
              </Button>
              <Button type="submit" disabled={!renaming.trim()}>
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-1">
            <button className={row} onClick={() => setRenaming(name)}>
              <Pencil size={18} aria-hidden /> Rename
            </button>
            <button
              className={row}
              onClick={() =>
                updateList.mutate(
                  { archived: true },
                  {
                    onSuccess: () => {
                      toast.success('List archived')
                      navigate('/shopping')
                    },
                  },
                )
              }
            >
              <Archive size={18} aria-hidden /> Archive
            </button>
            <button className={cn(row, 'text-red-700')} onClick={() => setConfirmDelete(true)}>
              <Trash2 size={18} aria-hidden /> Delete list
            </button>
          </div>
        )}
      </BottomSheet>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this list?"
        description={`"${name}" and all its items will be removed for everyone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          deleteList.mutate(listId, {
            onSuccess: () => {
              onClose()
              navigate('/shopping')
            },
            onError: (e) => toast.error(apiErrorMessage(e, 'Only the creator or an admin can delete this list')),
          })
        }
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
