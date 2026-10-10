import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Ban, CalendarDays, Clock, ImagePlus, MapPin, MoreHorizontal, Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { EventSheet } from '@/features/events/EventSheet'
import { eventEmoji, formatTimeRange, rsvpEmoji, rsvpLabels } from '@/features/events/event-utils'
import {
  useDeleteEvent,
  useDeletePhoto,
  useEvent,
  useEventPhotos,
  useMediaUrl,
  useRsvp,
  useSetCancelled,
  useUploadPhotos,
} from '@/services/events'
import { useActiveHousehold, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { HouseholdEvent, Media, Member, RsvpResponse } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const responses: RsvpResponse[] = ['going', 'maybe', 'declined']

export function EventPage() {
  const { eventId = '' } = useParams()
  const { active } = useActiveHousehold()
  if (!active) return <div className="panel panel--butter h-40 animate-pulse" aria-busy="true" />
  return <EventView householdId={active.id} eventId={eventId} />
}

function EventView({ householdId, eventId }: { householdId: string; eventId: string }) {
  const navigate = useNavigate()
  const meId = useAuthStore((state) => state.user?.id)
  const { data: event, isPending, isError } = useEvent(householdId, eventId)
  const { data: members = [] } = useMembers(householdId)
  const rsvp = useRsvp(householdId, eventId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)

  if (isPending) return <div className="panel panel--butter h-40 animate-pulse" aria-busy="true" />
  if (isError || !event) {
    return (
      <section className="panel flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <span className="text-5xl" aria-hidden>
          🗓️
        </span>
        <p className="font-bold">This event isn't available</p>
        <p className="muted text-sm font-medium">It may have been deleted.</p>
        <Button variant="light" onClick={() => navigate('/events')}>
          Back to schedule
        </Button>
      </section>
    )
  }

  const isAdmin = members.some((m) => m.userId === meId && m.role === 'admin')
  const canManage = isAdmin || event.createdById === meId
  const mine = event.participants.find((p) => p.userId === meId)?.response
  const cancelled = !!event.cancelledAt
  const past = new Date(event.endsAt ?? event.startsAt) < new Date()

  return (
    <>
      <ScreenHeader
        title={event.title}
        back="/events"
        tone={cancelled ? 'blush' : 'butter'}
        subtitle={cancelled ? 'Cancelled' : past ? 'This event has passed' : `Organised by ${event.createdById === meId ? 'you' : (event.createdBy?.firstname ?? 'a flatmate')}`}
        action={
          canManage && (
            <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Event options">
              <MoreHorizontal size={20} aria-hidden />
            </button>
          )
        }
      >
        <div className="mt-5 flex flex-col gap-2 text-[15px] font-semibold">
          <span className="text-5xl" aria-hidden>
            {eventEmoji(event.title)}
          </span>
          <span className="flex items-center gap-2">
            <CalendarDays size={18} aria-hidden /> {dateFmt.format(new Date(event.startsAt))}
          </span>
          <span className="flex items-center gap-2">
            <Clock size={18} aria-hidden /> {formatTimeRange(event.startsAt, event.endsAt)}
          </span>
          {event.location && (
            <span className="flex items-center gap-2">
              <MapPin size={18} aria-hidden /> {event.location}
            </span>
          )}
        </div>
      </ScreenHeader>

      {!cancelled && !past && (
        <section className="panel flex flex-col gap-3" aria-labelledby="rsvp-title">
          <h2 id="rsvp-title" className="text-[17px] font-bold">
            Are you coming?
          </h2>
          <div className="segmented bg-ivory" role="radiogroup" aria-labelledby="rsvp-title">
            {responses.map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={mine === r}
                onClick={() => rsvp.mutate(r, { onError: (e) => toast.error(apiErrorMessage(e, 'Could not save your answer')) })}
              >
                {rsvpLabels[r]}
              </button>
            ))}
          </div>
        </section>
      )}

      <Attendees event={event} members={members} meId={meId} />

      {event.description && (
        <section className="panel flex flex-col gap-2" aria-labelledby="notes-title">
          <h2 id="notes-title" className="text-[17px] font-bold">
            Notes
          </h2>
          <p className="font-medium whitespace-pre-wrap">{event.description}</p>
        </section>
      )}

      <Photos householdId={householdId} eventId={eventId} meId={meId} isAdmin={isAdmin} />

      <EventMenu
        householdId={householdId}
        event={event}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onEdit={() => {
          setMenuOpen(false)
          setEditing(true)
        }}
      />
      <EventSheet householdId={householdId} event={event} open={editing} onClose={() => setEditing(false)} />
    </>
  )
}

function Attendees({ event, members, meId }: { event: HouseholdEvent; members: Member[]; meId?: string }) {
  const hidden = new Set(event.excludedUserIds ?? [])
  const invited = members.filter((m) => !hidden.has(m.userId))
  const answer = (userId: string) => event.participants.find((p) => p.userId === userId)?.response
  const going = event.participants.filter((p) => p.response === 'going').length

  return (
    <section className="panel flex flex-col gap-3" aria-labelledby="who-title">
      <div className="flex items-baseline justify-between">
        <h2 id="who-title" className="text-[17px] font-bold">
          Who's coming
        </h2>
        <span className="text-sm font-bold">
          {going} going · {invited.length} invited
        </span>
      </div>
      <ul className="flex flex-col gap-3">
        {invited.map(({ user }) => {
          const r = answer(user.id)
          return (
            <li key={user.id} className="flex items-center gap-3">
              <Avatar person={user} size="sm" />
              <span className="min-w-0 flex-1 truncate font-bold">
                {user.firstname} {user.lastname}
                {user.id === meId && <span className="muted font-semibold"> (you)</span>}
              </span>
              <span className={cn('badge', r === 'going' ? 'bg-mint' : r === 'maybe' ? 'bg-butter' : r === 'declined' ? 'bg-blush' : '')}>
                {r ? `${rsvpEmoji[r]} ${rsvpLabels[r]}` : 'No answer'}
              </span>
            </li>
          )
        })}
      </ul>
      {hidden.size > 0 && (
        <p className="muted text-sm font-semibold">
          Hidden from {hidden.size} {hidden.size === 1 ? 'person' : 'people'} 🤫
        </p>
      )}
    </section>
  )
}

function Photos({ householdId, eventId, meId, isAdmin }: { householdId: string; eventId: string; meId?: string; isAdmin: boolean }) {
  const { data: photos = [] } = useEventPhotos(householdId, eventId)
  const upload = useUploadPhotos(householdId, eventId)
  const remove = useDeletePhoto(householdId, eventId)
  const input = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<Media>()

  const onFiles = (files: FileList | null) => {
    const list = [...(files ?? [])].slice(0, 10)
    if (!list.length) return
    upload.mutate(list, {
      onSuccess: (added) => toast.success(`${added.length} ${added.length === 1 ? 'photo' : 'photos'} added`),
      onError: (e) => toast.error(apiErrorMessage(e, 'Could not upload. Images up to 10 MB.')),
    })
    if (input.current) input.current.value = ''
  }

  return (
    <section className="panel flex flex-1 flex-col gap-3 pb-6" aria-labelledby="photos-title">
      <div className="flex items-center justify-between">
        <h2 id="photos-title" className="text-[17px] font-bold">
          Photos
        </h2>
        <button
          className="pill pill--light min-h-10 px-3.5 py-1.5 text-sm"
          onClick={() => input.current?.click()}
          disabled={upload.isPending}
        >
          <ImagePlus size={17} aria-hidden /> {upload.isPending ? 'Uploading…' : 'Add photos'}
        </button>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
      </div>
      {photos.length === 0 ? (
        <p className="muted py-4 text-center text-sm font-semibold">No photos yet. Share the memories 📸</p>
      ) : (
        <ul className="grid grid-cols-3 gap-1.5">
          {photos.map((p) => (
            <li key={p.id}>
              <button onClick={() => setViewing(p)} className="block aspect-square w-full overflow-hidden rounded-xl bg-ivory" aria-label={`Open photo ${p.originalName}`}>
                <Photo householdId={householdId} media={p} className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <BottomSheet open={!!viewing} title="Photo" onClose={() => setViewing(undefined)}>
        {viewing && (
          <div className="flex flex-col gap-3">
            <Photo householdId={householdId} media={viewing} className="max-h-[60dvh] w-full rounded-2xl bg-ivory object-contain" />
            <p className="muted text-sm font-semibold">
              Added by {viewing.uploadedBy?.id === meId ? 'you' : (viewing.uploadedBy?.firstname ?? 'someone')}
            </p>
            {(isAdmin || viewing.uploadedBy?.id === meId) && (
              <Button
                variant="blush"
                onClick={() =>
                  remove.mutate(viewing.id, {
                    onSuccess: () => setViewing(undefined),
                    onError: (e) => toast.error(apiErrorMessage(e, 'Could not delete the photo')),
                  })
                }
              >
                <Trash2 size={18} aria-hidden /> Delete photo
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
    </section>
  )
}

function Photo({ householdId, media, className }: { householdId: string; media: Media; className?: string }) {
  const url = useMediaUrl(householdId, media.id)
  return url ? <img src={url} alt={media.originalName} className={className} /> : <div className={cn(className, 'animate-pulse')} />
}

type MenuProps = { householdId: string; event: HouseholdEvent; open: boolean; onClose: () => void; onEdit: () => void }

function EventMenu({ householdId, event, open, onClose, onEdit }: MenuProps) {
  const navigate = useNavigate()
  const setCancelled = useSetCancelled(householdId, event.id)
  const remove = useDeleteEvent(householdId)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const cancelled = !!event.cancelledAt
  const row = 'flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-bold hover:bg-ivory'

  return (
    <>
      <BottomSheet open={open} title={event.title} onClose={onClose}>
        <div className="flex flex-col gap-1">
          <button className={row} onClick={onEdit}>
            <Pencil size={18} aria-hidden /> Edit event
          </button>
          <button
            className={row}
            onClick={() =>
              setCancelled.mutate(!cancelled, {
                onSuccess: () => {
                  toast.success(cancelled ? 'Event restored' : 'Event cancelled. Everyone was notified.')
                  onClose()
                },
                onError: (e) => toast.error(apiErrorMessage(e, 'Could not update the event')),
              })
            }
          >
            {cancelled ? <RotateCcw size={18} aria-hidden /> : <Ban size={18} aria-hidden />}
            {cancelled ? 'Restore event' : 'Cancel event'}
          </button>
          <button className={cn(row, 'text-red-700')} onClick={() => setConfirmDelete(true)}>
            <Trash2 size={18} aria-hidden /> Delete event
          </button>
        </div>
      </BottomSheet>
      <ConfirmDialog
        open={confirmDelete}
        title="Delete this event?"
        description="It disappears for everyone, along with its photos. To keep a record, cancel it instead."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          remove.mutate(event.id, {
            onSuccess: () => {
              toast.success('Event deleted')
              navigate('/events', { replace: true })
            },
            onError: (e) => toast.error(apiErrorMessage(e, 'Could not delete the event')),
          })
        }
        onClose={() => setConfirmDelete(false)}
      />
    </>
  )
}
