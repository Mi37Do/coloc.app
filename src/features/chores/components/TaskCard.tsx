import { useRef, useState, type PointerEvent } from 'react'
import { Check, Clock, RotateCcw, Repeat, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import type { Chore } from '@/types/api'
import { choreEmoji } from '@/utils/chore-art'
import { formatDue, isOverdue } from '@/utils/dates'
import { cn } from '@/utils/cn'

const ACTION = 92 // px revealed on each side

type Props = {
  chore: Chore
  meId?: string
  showAssignee?: boolean
  canDelete: boolean
  onToggle: (chore: Chore) => void
  onDelete: (chore: Chore) => void
}

/**
 * Swipe left (or tap) to reveal Done, swipe right to reveal Delete, as in the
 * reference. Actions are buttons in the revealed area, so nothing fires by accident.
 */
export function TaskCard({ chore, meId, showAssignee, canDelete, onToggle, onDelete }: Props) {
  const done = chore.status === 'done'
  const overdue = !done && chore.dueAt && isOverdue(chore.dueAt)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ x: number; y: number; base: number; active: boolean } | null>(null)
  const moved = useRef(false)

  const min = -ACTION
  const max = canDelete ? ACTION : 0

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, base: offset, active: false }
    moved.current = false
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (!d.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return // let vertical scroll win
      d.active = true
      moved.current = true
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    const raw = d.base + dx
    // Rubber-band past the action width
    const clamped = raw < min ? min + (raw - min) / 4 : raw > max ? max + (raw - max) / 4 : raw
    setOffset(clamped)
  }

  const onPointerUp = () => {
    if (drag.current?.active) {
      setOffset((o) => (o < min / 2 ? min : o > max / 2 && max > 0 ? max : 0))
    }
    drag.current = null
    setDragging(false)
  }

  const onClick = () => {
    if (moved.current) return // the drag already handled it
    setOffset((o) => (o === 0 ? min : 0))
  }

  const revealed = offset === min ? 'done' : offset === max && max > 0 ? 'delete' : null
  const assignee = !chore.assignee ? 'Anyone' : chore.assignee.id === meId ? 'You' : chore.assignee.firstname

  return (
    <li className="relative overflow-hidden rounded-tile">
      {/* Revealed actions. The whole area takes the action colour, so no gap shows at the card's rounded edge */}
      <div
        className={cn(
          'absolute inset-0 flex justify-between',
          offset > 0 ? 'bg-blush' : offset < 0 ? 'bg-mint' : 'bg-transparent',
        )}
      >
        <button
          onClick={() => {
            setOffset(0)
            onDelete(chore)
          }}
          tabIndex={revealed === 'delete' ? 0 : -1}
          aria-hidden={revealed !== 'delete'}
          className={cn(
            'flex flex-col items-center justify-center gap-1 text-sm font-bold',
            !canDelete && 'invisible',
          )}
          style={{ width: ACTION }}
        >
          <Trash2 size={20} aria-hidden /> Delete
        </button>
        <button
          onClick={() => {
            setOffset(0)
            onToggle(chore)
          }}
          tabIndex={revealed === 'done' ? 0 : -1}
          aria-hidden={revealed !== 'done'}
          className="flex flex-col items-center justify-center gap-1 text-sm font-bold"
          style={{ width: ACTION }}
        >
          {done ? <RotateCcw size={20} aria-hidden /> : <Check size={20} aria-hidden />}
          {done ? 'Undo' : 'Done'}
        </button>
      </div>

      {/* The card */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={onClick}
        aria-expanded={revealed !== null}
        aria-label={`${chore.title}${done ? ', done' : ''}. Show actions`}
        className={cn(
          'tile relative flex w-full touch-pan-y items-center gap-3 text-left select-none',
          !dragging && 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(${offset}px)` }}
      >
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-[17px] font-bold', done && 'line-through opacity-50')}>{chore.title}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold">
            {done ? (
              <span className="flex items-center gap-1 text-[#36552A]">
                <Check size={15} aria-hidden /> Done
              </span>
            ) : (
              <span className={cn('flex items-center gap-1', overdue && 'text-red-700')}>
                <Clock size={15} aria-hidden />
                {chore.dueAt ? `${overdue ? 'Overdue' : 'Due'}: ${formatDue(chore.dueAt)}` : 'No due date'}
              </span>
            )}
            {chore.recurrence !== 'none' && (
              <span className="muted flex items-center gap-1 capitalize">
                <Repeat size={14} aria-hidden /> {chore.recurrence}
              </span>
            )}
          </p>
          {showAssignee && (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
              {chore.assignee && <Avatar person={chore.assignee} size="sm" className="size-6 text-[10px]" />}
              {assignee}
            </p>
          )}
        </div>
        <span className={cn('text-[40px] leading-none', done && 'opacity-50 grayscale')} aria-hidden>
          {choreEmoji(chore.title)}
        </span>
      </button>
    </li>
  )
}
