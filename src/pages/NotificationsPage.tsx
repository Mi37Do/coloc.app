import { useNavigate } from 'react-router'
import { CheckCheck, X } from 'lucide-react'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { useDeleteNotification, useMarkAllRead, useMarkNotificationRead, useNotifications } from '@/services/notifications'
import type { AppNotification, NotificationType } from '@/types/api'
import { formatRelative } from '@/utils/dates'
import { cn } from '@/utils/cn'

const look: Record<NotificationType, { emoji: string; to: string }> = {
  household_invite: { emoji: '✉️', to: '/household' },
  member_joined: { emoji: '👋', to: '/household' },
  chore_assigned: { emoji: '🧽', to: '/' },
  chore_due: { emoji: '⏰', to: '/' },
  bill_created: { emoji: '🧾', to: '/bills' },
  bill_due: { emoji: '💸', to: '/bills' },
  event_created: { emoji: '📅', to: '/events' },
  event_cancelled: { emoji: '🚫', to: '/events' },
  event_soon: { emoji: '🔔', to: '/events' },
  alert: { emoji: '⚠️', to: '/household' },
  reminder: { emoji: '🔔', to: '/' },
}

export function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications, isPending } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllRead()
  const remove = useDeleteNotification()
  const unread = notifications?.filter((n) => !n.readAt).length ?? 0

  const open = (n: AppNotification) => {
    if (!n.readAt) markRead.mutate(n.id)
    // Event notifications carry the event id: open it directly
    const eventId = typeof n.data?.eventId === 'string' ? n.data.eventId : undefined
    navigate(eventId && n.type.startsWith('event') ? `/events/${eventId}` : (look[n.type]?.to ?? '/'))
  }

  return (
    <>
      <ScreenHeader
        title="Notifications"
        back="/"
        subtitle={unread ? `${unread} unread` : "You're all caught up"}
        action={
          unread > 0 && (
            <button className="icon-btn" onClick={() => markAll.mutate()} disabled={markAll.isPending} aria-label="Mark all as read">
              <CheckCheck size={20} aria-hidden />
            </button>
          )
        }
      />

      <section className="panel flex flex-1 flex-col pb-6" aria-label="Notifications">
        {isPending ? (
          <div className="flex flex-col gap-2.5" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-tile bg-ivory" />
            ))}
          </div>
        ) : !notifications?.length ? (
          <div className="m-auto flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              🔕
            </span>
            <p className="font-bold">Nothing new</p>
            <p className="muted max-w-64 text-sm font-medium">Chore assignments, new bills and reminders show up here.</p>
          </div>
        ) : (
          <ul className="-mx-2 flex flex-col gap-1">
            {notifications.map((n) => (
              <li key={n.id} className={cn('flex items-start gap-1 rounded-2xl', !n.readAt && 'bg-butter/60')}>
                <button onClick={() => open(n)} className="flex min-w-0 flex-1 items-start gap-3 p-2.5 text-left">
                  <span className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-ink bg-paper text-xl" aria-hidden>
                    {look[n.type]?.emoji ?? '🔔'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={cn('block', n.readAt ? 'font-semibold' : 'font-extrabold')}>{n.title}</span>
                    {n.body && <span className="muted block text-sm font-medium">{n.body}</span>}
                    <span className="muted mt-0.5 block text-xs font-semibold">{formatRelative(n.createdAt)}</span>
                  </span>
                  {!n.readAt && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-ink" aria-label="Unread" />}
                </button>
                <button
                  onClick={() => remove.mutate(n.id)}
                  className="m-1.5 grid size-9 shrink-0 place-items-center rounded-full hover:bg-ivory"
                  aria-label={`Dismiss "${n.title}"`}
                >
                  <X size={16} aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
