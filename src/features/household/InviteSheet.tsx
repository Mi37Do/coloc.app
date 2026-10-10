import { useEffect, useRef } from 'react'
import { Copy, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { useCreateInvite } from '@/services/invites'
import { apiErrorMessage, apiStatus } from '@/utils/api-error'

type Props = { householdId: string; householdName: string; open: boolean; onClose: () => void }

// Makes a fresh 7-day invite each time it opens, shown as a code and a link.
export function InviteSheet({ householdId, householdName, open, onClose }: Props) {
  const createInvite = useCreateInvite(householdId)
  const { mutate, reset } = createInvite
  const invite = createInvite.data

  // The ref stops StrictMode's double effect run from creating two invites.
  const requested = useRef(false)
  useEffect(() => {
    if (open && !requested.current) {
      requested.current = true
      mutate()
    } else if (!open) {
      requested.current = false
      reset()
    }
  }, [open, mutate, reset])

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${what} copied`)
    } catch {
      toast.error('Could not copy')
    }
  }

  const share = async () => {
    if (!invite) return
    const text = `Join ${householdName} on coloc with code ${invite.displayCode}, or open this link:`
    if (navigator.share) {
      await navigator.share({ title: `Join ${householdName}`, text, url: invite.url }).catch(() => {})
    } else {
      await copy(`${text} ${invite.url}`, 'Invite')
    }
  }

  return (
    <BottomSheet open={open} title="Invite flatmates" onClose={onClose}>
      {createInvite.isPending ? (
        <div className="h-48 animate-pulse rounded-tile bg-ivory" aria-busy="true" />
      ) : createInvite.isError ? (
        <p className="muted font-medium py-6 text-center">
          {apiStatus(createInvite.error) === 403
            ? 'Only household admins can invite people.'
            : apiErrorMessage(createInvite.error, 'Could not create an invite')}
        </p>
      ) : (
        invite && (
          <div className="flex flex-col gap-4">
            <p className="muted font-medium text-sm">They can type this code in the app, or open the link. Valid for 7 days.</p>
            <button
              onClick={() => invite.displayCode && copy(invite.displayCode, 'Code')}
              className="tile tile--outline flex flex-col items-center gap-1 bg-mint p-5"
              aria-label={`Copy code ${invite.displayCode}`}
            >
              <span className="text-sm font-semibold opacity-80">Household code</span>
              <span className="text-4xl font-extrabold tracking-[0.2em]">{invite.displayCode}</span>
              <span className="flex items-center gap-1 text-xs opacity-70">
                <Copy size={12} aria-hidden /> Tap to copy
              </span>
            </button>
            <div className="flex items-center gap-2 rounded-2xl border-[1.5px] border-ink bg-ivory p-2 pl-4">
              <span className="min-w-0 flex-1 truncate text-sm">{invite.url}</span>
              <button
                onClick={() => copy(invite.url, 'Link')}
                className="icon-btn size-9"
                aria-label="Copy link"
              >
                <Copy size={16} aria-hidden />
              </button>
            </div>
            <Button onClick={share} className="w-full">
              <Share2 size={18} aria-hidden /> Share invite
            </Button>
          </div>
        )
      )}
    </BottomSheet>
  )
}
