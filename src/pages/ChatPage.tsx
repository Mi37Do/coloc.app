import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PenSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { CreateHousehold } from '@/features/chores'
import { useConversations, useStartDirect } from '@/services/chat'
import { useActiveHousehold, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { Conversation, Household, Member } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { formatChatTime } from '@/utils/dates'

export function ChatPage() {
  const { active, isPending } = useActiveHousehold()
  if (isPending) return <div className="panel panel--mint h-40 animate-pulse" aria-busy="true" />
  if (!active) return <CreateHousehold />
  return <Conversations household={active} />
}

function Conversations({ household }: { household: Household }) {
  const meId = useAuthStore((state) => state.user?.id)
  const { data: conversations, isPending } = useConversations(household.id)
  const { data: members = [] } = useMembers(household.id)
  const [picking, setPicking] = useState(false)

  return (
    <>
      <ScreenHeader
        title="Chat"
        subtitle={household.name}
        action={
          <button className="icon-btn" onClick={() => setPicking(true)} aria-label="New message">
            <PenSquare size={19} aria-hidden />
          </button>
        }
      />

      <section className="panel flex flex-1 flex-col pb-6" aria-label="Conversations">
        {isPending ? (
          <div className="flex flex-col gap-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-tile bg-ivory" />
            ))}
          </div>
        ) : (
          <ul className="-mx-2 flex flex-col">
            {(conversations ?? []).map((c) => (
              <ConversationRow key={c.id} conversation={c} members={members} meId={meId} />
            ))}
          </ul>
        )}
      </section>

      <NewMessageSheet householdId={household.id} members={members.filter((m) => m.userId !== meId)} open={picking} onClose={() => setPicking(false)} />
    </>
  )
}

function ConversationRow({ conversation: c, members, meId }: { conversation: Conversation; members: Member[]; meId?: string }) {
  const isGroup = c.type === 'group'
  const title = isGroup ? 'Household chat' : `${c.with?.firstname ?? 'Someone'} ${c.with?.lastname ?? ''}`.trim()
  const last = c.lastMessage
  const sender =
    last?.senderId === meId ? 'You' : members.find((m) => m.userId === last?.senderId)?.user.firstname
  const preview = !last
    ? isGroup
      ? 'Say hi to everyone 👋'
      : 'No messages yet'
    : last.deletedAt
      ? 'Message deleted'
      : `${isGroup || last.senderId === meId ? `${sender ?? 'Someone'}: ` : ''}${last.body}`

  return (
    <li>
      <Link to={`/chat/${c.id}`} className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-ivory">
        {isGroup ? (
          <span className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-ink bg-butter text-xl" aria-hidden>
            🏠
          </span>
        ) : (
          c.with && <Avatar person={c.with} className="size-12" />
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate font-bold">{title}</span>
            {last && <span className="muted shrink-0 text-xs font-semibold">{formatChatTime(last.createdAt)}</span>}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className={c.unreadCount ? 'truncate text-sm font-bold' : 'muted truncate text-sm font-medium'}>{preview}</span>
            {c.unreadCount > 0 && (
              <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-extrabold text-paper">
                {c.unreadCount}
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  )
}

function NewMessageSheet({ householdId, members, open, onClose }: { householdId: string; members: Member[]; open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const start = useStartDirect(householdId)

  return (
    <BottomSheet open={open} title="New message" onClose={onClose}>
      {members.length === 0 ? (
        <p className="muted py-6 text-center font-medium">Invite flatmates to start a private chat.</p>
      ) : (
        <ul className="-mx-2 flex flex-col">
          {members.map(({ user }) => (
            <li key={user.id}>
              <button
                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-ivory"
                disabled={start.isPending}
                onClick={() =>
                  start.mutate(user.id, {
                    onSuccess: ({ id }) => {
                      onClose()
                      navigate(`/chat/${id}`)
                    },
                    onError: (e) => toast.error(apiErrorMessage(e, 'Could not start the chat')),
                  })
                }
              >
                <Avatar person={user} />
                <span className="min-w-0">
                  <span className="block truncate font-bold">
                    {user.firstname} {user.lastname}
                  </span>
                  <span className="muted block truncate text-sm font-semibold">@{user.username}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
