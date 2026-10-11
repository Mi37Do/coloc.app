import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeft, ArrowUp, ImagePlus, Trash2 } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { chatImagePath, useFileUrl } from '@/services/files'
import { chooseImages } from '@/utils/images'
import { toast } from 'sonner'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { GifImage, GifPicker } from '@/features/chat/GifPicker'
import {
  useConversations,
  useDeleteMessage,
  useLoadOlder,
  useMarkRead,
  useMessages,
  useSendMessage,
  useUploadChatImages,
} from '@/services/chat'
import { useActiveHousehold, useMembers } from '@/services/households'
import { emitTyping, useTypingStore } from '@/services/realtime'
import { useAuthStore } from '@/stores'
import type { Member, Message } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { formatClock, isSameDay } from '@/utils/dates'
import { cn } from '@/utils/cn'

const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long' })
const GROUP_GAP_MS = 5 * 60_000

export function ChatThreadPage() {
  const { conversationId = '' } = useParams()
  const { active } = useActiveHousehold()
  if (!active) return <div className="panel h-40 animate-pulse" aria-busy="true" />
  return <Thread householdId={active.id} conversationId={conversationId} />
}

function Thread({ householdId, conversationId }: { householdId: string; conversationId: string }) {
  const navigate = useNavigate()
  const meId = useAuthStore((state) => state.user?.id)
  const { data: conversations } = useConversations(householdId)
  const { data: members = [] } = useMembers(householdId)
  const { data: messages, isPending, isError } = useMessages(householdId, conversationId)
  const send = useSendMessage(householdId, conversationId)
  const markRead = useMarkRead(householdId, conversationId)
  const loadOlder = useLoadOlder(householdId, conversationId)
  const remove = useDeleteMessage(householdId, conversationId)
  const [gifsOpen, setGifsOpen] = useState(false)
  const uploadImages = useUploadChatImages(householdId, conversationId)
  const [viewing, setViewing] = useState<string>()
  const typingIds = Object.keys(useTypingStore((state) => state.typing[conversationId]) ?? {})

  const [text, setText] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [selected, setSelected] = useState<string>()
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const lastTyping = useRef(0)

  const conversation = conversations?.find((c) => c.id === conversationId)
  const isGroup = conversation?.type !== 'direct'
  const title = isGroup ? 'Household chat' : (conversation?.with?.firstname ?? 'Chat')
  const memberOf = (id: string | null) => members.find((m) => m.userId === id)

  // Stick to the bottom when new messages arrive (and on first load).
  const count = messages?.length ?? 0
  const lastId = messages?.at(-1)?.id
  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [lastId])

  // Mark as read on open and whenever a new message comes in.
  const { mutate: markReadNow } = markRead
  useEffect(() => {
    if (count) markReadNow()
  }, [lastId, count, markReadNow])

  const onSend = (e?: FormEvent) => {
    e?.preventDefault()
    const body = text.trim()
    if (!body) return
    setText('')
    send.mutate({ body }, { onError: (err) => toast.error(apiErrorMessage(err, 'Message not sent')) })
  }

  // A GIF goes out on its own; any typed text stays in the box
  const sendGif = (gifId: string) =>
    send.mutate({ gifId }, { onError: (err) => toast.error(apiErrorMessage(err, 'GIF not sent')) })

  // Photos: camera/gallery in the app, file picker in a browser. Each photo is its own message.
  const sendPhotos = async () => {
    const files = (await chooseImages({ multiple: true })).slice(0, 10)
    if (!files.length) return
    try {
      const uploaded = await uploadImages.mutateAsync(files)
      for (const image of uploaded) {
        send.mutate({ imageId: image.id }, { onError: (err) => toast.error(apiErrorMessage(err, 'Photo not sent')) })
      }
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not upload. Photos up to 10 MB.'))
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends on desktop; Shift+Enter for a new line
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault()
      onSend()
    }
  }

  const onType = (value: string) => {
    setText(value)
    if (Date.now() - lastTyping.current > 2000) {
      lastTyping.current = Date.now()
      emitTyping(conversationId)
    }
  }

  const older = () => {
    const scroller = document.scrollingElement
    const before = scroller?.scrollHeight ?? 0
    loadOlder.mutate(undefined, {
      onSuccess: (more) => {
        setHasMore(more)
        // Keep the view where it was after prepending
        requestAnimationFrame(() => {
          if (scroller) scroller.scrollTop += scroller.scrollHeight - before
        })
      },
    })
  }

  return (
    <>
      <header className="panel panel--mint sticky top-0 z-20 flex items-center gap-3 rounded-t-none pt-[max(0.75rem,var(--safe-top))] pb-3">
        <button className="icon-btn icon-btn--light border-2 border-ink" onClick={() => navigate('/chat')} aria-label="Back to chats">
          <ArrowLeft size={20} aria-hidden />
        </button>
        {isGroup ? (
          <AvatarStack people={members.map((m) => m.user)} max={3} />
        ) : (
          conversation?.with && <Avatar person={conversation.with} />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl leading-tight">{title}</h1>
          <p className="muted truncate text-xs font-semibold" aria-live="polite">
            {typingIds.length
              ? `${typingIds.map((id) => memberOf(id)?.user.firstname ?? 'Someone').join(', ')} ${typingIds.length > 1 ? 'are' : 'is'} typing…`
              : isGroup
                ? `${members.length} members`
                : `@${conversation?.with?.username ?? ''}`}
          </p>
        </div>
      </header>

      <section ref={scrollerRef} className="panel flex flex-1 flex-col gap-1 pb-4" aria-label="Messages">
        {isPending ? (
          <div className="flex flex-1 flex-col justify-end gap-3" aria-busy="true">
            {[60, 40, 70].map((w, i) => (
              <div key={i} className={cn('h-10 animate-pulse rounded-2xl bg-ivory', i % 2 && 'self-end')} style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : isError ? (
          <p className="muted m-auto font-medium">This conversation couldn't be loaded.</p>
        ) : count === 0 ? (
          <div className="m-auto flex flex-col items-center gap-2 py-10 text-center">
            <span className="text-5xl" aria-hidden>
              💬
            </span>
            <p className="font-bold">No messages yet</p>
            <p className="muted text-sm font-medium">{isGroup ? 'Start the conversation with your flatmates.' : 'Say hello!'}</p>
          </div>
        ) : (
          <>
            {hasMore && count >= 50 && (
              <button className="mx-auto mb-2 text-sm font-bold underline underline-offset-4" onClick={older} disabled={loadOlder.isPending}>
                {loadOlder.isPending ? 'Loading…' : 'Load earlier messages'}
              </button>
            )}
            {messages!.map((m, i) => {
              const prev = messages![i - 1]
              const newDay = !prev || !isSameDay(new Date(prev.createdAt), new Date(m.createdAt))
              const grouped =
                !newDay && prev?.senderId === m.senderId && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS
              return (
                <Fragment key={m.id}>
                  {newDay && (
                    <p className="muted my-3 text-center text-xs font-bold">{dayFmt.format(new Date(m.createdAt))}</p>
                  )}
                  <Bubble
                    householdId={householdId}
                    onOpenImage={setViewing}
                    message={m}
                    mine={m.senderId === meId}
                    member={memberOf(m.senderId)}
                    showName={isGroup && !grouped && m.senderId !== meId}
                    grouped={grouped}
                    selected={selected === m.id}
                    onSelect={() => setSelected((s) => (s === m.id ? undefined : m.id))}
                    onDelete={() => {
                      setSelected(undefined)
                      remove.mutate(m, { onError: (e) => toast.error(apiErrorMessage(e, 'Could not delete')) })
                    }}
                  />
                </Fragment>
              )
            })}
          </>
        )}
        <div ref={bottomRef} />
      </section>

      <form
        onSubmit={onSend}
        className="sticky bottom-0 z-20 flex items-end gap-2 bg-ink px-3 pt-2 pb-[max(0.75rem,var(--safe-bottom))]"
      >
        <button
          type="button"
          onClick={() => void sendPhotos()}
          disabled={uploadImages.isPending}
          className="grid size-[50px] shrink-0 place-items-center rounded-full border-[1.5px] border-paper text-paper transition-transform active:scale-95 disabled:animate-pulse"
          aria-label={uploadImages.isPending ? 'Uploading photos' : 'Send photos'}
        >
          <ImagePlus size={20} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setGifsOpen(true)}
          className="grid h-[50px] shrink-0 place-items-center rounded-full border-[1.5px] border-paper px-3.5 text-sm font-extrabold text-paper transition-transform active:scale-95"
          aria-label="Send a GIF"
        >
          GIF
        </button>
        <textarea
          rows={1}
          className="field max-h-32 min-h-[50px] resize-none border-paper py-3 [field-sizing:content]"
          placeholder="Message"
          value={text}
          maxLength={4000}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="Message"
        />
        <button className="grid size-[50px] shrink-0 place-items-center rounded-full bg-sage text-ink transition-transform active:scale-95 disabled:opacity-40" disabled={!text.trim()} aria-label="Send">
          <ArrowUp size={22} strokeWidth={2.5} aria-hidden />
        </button>
      </form>

      <BottomSheet open={!!viewing} title="Photo" onClose={() => setViewing(undefined)}>
        {viewing && <ChatImage path={chatImagePath(householdId, conversationId, viewing)} className="max-h-[70dvh] w-full rounded-2xl object-contain" />}
      </BottomSheet>

      <GifPicker
        householdId={householdId}
        open={gifsOpen}
        onClose={() => setGifsOpen(false)}
        onPick={(gif) => sendGif(gif.id)}
        meId={meId}
        isAdmin={members.some((m) => m.userId === meId && m.role === 'admin')}
      />
    </>
  )
}

type BubbleProps = {
  householdId: string
  message: Message
  onOpenImage: (imageId: string) => void
  mine: boolean
  member?: Member
  showName: boolean
  grouped: boolean
  selected: boolean
  onSelect: () => void
  onDelete: () => void
}

function Bubble({ householdId, message: m, onOpenImage, mine, member, showName, grouped, selected, onSelect, onDelete }: BubbleProps) {
  const pending = m.id.startsWith('temp-')
  const deleted = !!m.deletedAt
  const gif = !deleted && m.gifId
  const image = !deleted && m.imageId
  const bare = (gif || image) && !m.body

  return (
    <div className={cn('flex items-end gap-2', mine ? 'justify-end' : 'justify-start', !grouped && 'mt-2')}>
      {!mine && (
        <span className="w-8 shrink-0">
          {!grouped && member && <Avatar person={member.user} size="sm" />}
        </span>
      )}
      <div className={cn('flex max-w-[78%] flex-col', mine ? 'items-end' : 'items-start')}>
        {showName && <span className="mb-1 ml-1 text-xs font-bold">{member?.user.firstname ?? 'Someone'}</span>}
        <button
          type="button"
          onClick={mine && !deleted && !pending ? onSelect : undefined}
          className={cn(
            'rounded-[1.25rem] px-3.5 py-2 text-left text-[15px] font-medium break-words whitespace-pre-wrap',
            // A GIF on its own shows bare, with no bubble behind it
            bare
              ? 'bg-transparent p-0 text-ink'
              : mine
                ? 'rounded-br-md bg-ink text-paper'
                : 'rounded-bl-md border-[1.5px] border-ink bg-paper',
            deleted && 'italic opacity-50',
            pending && 'opacity-60',
            !mine && 'cursor-default',
          )}
          aria-label={mine && !deleted ? 'Your message. Tap for options' : undefined}
        >
          {image && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation()
                onOpenImage(m.imageId!)
              }}
              onKeyDown={(e) => e.key === 'Enter' && onOpenImage(m.imageId!)}
              className="block cursor-zoom-in"
              aria-label="Open photo"
            >
              <ChatImage
                path={chatImagePath(householdId, m.conversationId, m.imageId!)}
                className={cn('block max-h-72 w-60 max-w-full rounded-2xl border-[1.5px] border-ink object-cover', m.body && 'mb-1.5')}
              />
            </span>
          )}
          {gif && (
            <GifImage
              householdId={householdId}
              mediaId={m.gifId!}
              className={cn('block max-h-56 w-56 max-w-full rounded-2xl border-[1.5px] border-ink', m.body && 'mb-1.5')}
            />
          )}
          {deleted ? 'Message deleted' : m.body || (!m.gifId && !m.imageId && <span className="italic opacity-60">GIF removed</span>)}
          <span className={cn('ml-2 inline-block align-bottom text-[11px] font-semibold', bare ? 'text-muted-ink' : mine ? 'text-paper/60' : 'text-muted-ink')}>
            {pending ? 'Sending…' : formatClock(m.createdAt)}
            {m.editedAt && !deleted && ' · edited'}
          </span>
        </button>
        {selected && (
          <button type="button" onClick={onDelete} className="pill pill--blush mt-1 min-h-9 px-3 py-1 text-sm">
            <Trash2 size={15} aria-hidden /> Delete
          </button>
        )}
      </div>
    </div>
  )
}

function ChatImage({ path, className }: { path: string; className?: string }) {
  const { url, failed } = useFileUrl(path)
  if (failed) return <span className={cn('grid min-h-24 place-items-center bg-ivory text-xs font-bold text-muted-ink', className)}>Photo unavailable</span>
  return url ? <img src={url} alt="Photo" className={className} /> : <span className={cn('block min-h-40 animate-pulse bg-ivory', className)} aria-busy="true" />
}
