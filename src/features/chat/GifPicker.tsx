import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { useAddGifs, useCachedMediaUrl, useGifLibrary, useRemoveGif } from '@/services/gifs'
import type { Media } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { cn } from '@/utils/cn'

/** An animated GIF from the household library */
export function GifImage({ householdId, mediaId, className, alt = 'GIF' }: { householdId: string; mediaId: string; className?: string; alt?: string }) {
  const { url, failed } = useCachedMediaUrl(householdId, mediaId)
  if (failed) {
    return (
      <span className={cn('grid place-items-center bg-ivory text-xs font-bold text-muted-ink', className)}>GIF removed</span>
    )
  }
  return url ? (
    <img src={url} alt={alt} className={cn('object-cover', className)} />
  ) : (
    <span className={cn('block animate-pulse bg-ivory', className)} aria-busy="true" />
  )
}

type Props = {
  householdId: string
  open: boolean
  onClose: () => void
  onPick: (gif: Media) => void
  meId?: string
  isAdmin: boolean
}

/** The household's shared GIF library: pick one to send, or add GIFs from this device for everyone */
export function GifPicker({ householdId, open, onClose, onPick, meId, isAdmin }: Props) {
  const { data: gifs, isPending } = useGifLibrary(householdId, open)
  const add = useAddGifs(householdId)
  const remove = useRemoveGif(householdId)
  const input = useRef<HTMLInputElement>(null)
  const [managing, setManaging] = useState(false)

  const onFiles = (files: FileList | null) => {
    const list = [...(files ?? [])].filter((f) => f.type === 'image/gif' || f.name.toLowerCase().endsWith('.gif')).slice(0, 10)
    if (input.current) input.current.value = ''
    if (!list.length) {
      if (files?.length) toast.error('Only .gif files can be added')
      return
    }
    add.mutate(list, {
      onSuccess: (added) => toast.success(`${added.length} GIF${added.length === 1 ? '' : 's'} added for everyone`),
      onError: (e) => toast.error(apiErrorMessage(e, 'Could not add the GIF. GIFs up to 10 MB.')),
    })
  }

  const canRemove = (g: Media) => isAdmin || g.uploadedBy?.id === meId
  const removable = (gifs ?? []).some(canRemove)

  return (
    <BottomSheet
      open={open}
      title="GIFs"
      onClose={() => {
        setManaging(false)
        onClose()
      }}
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Button className="flex-1" onClick={() => input.current?.click()} disabled={add.isPending}>
            <ImagePlus size={18} aria-hidden /> {add.isPending ? 'Adding…' : 'Add GIFs'}
          </Button>
          {removable && (
            <Button variant={managing ? 'dark' : 'light'} onClick={() => setManaging((m) => !m)} aria-pressed={managing}>
              {managing ? 'Done' : 'Manage'}
            </Button>
          )}
          <input ref={input} type="file" accept="image/gif" multiple hidden onChange={(e) => onFiles(e.target.files)} />
        </div>
        <p className="muted -mt-2 text-xs font-semibold">GIFs you add here can be used by everyone in the household.</p>

        {isPending ? (
          <div className="grid grid-cols-3 gap-1.5" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-ivory" />
            ))}
          </div>
        ) : !gifs?.length ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <span className="text-5xl" aria-hidden>
              🎞️
            </span>
            <p className="font-bold">No GIFs yet</p>
            <p className="muted max-w-64 text-sm font-medium">Add your favourites from this device and the whole house can use them.</p>
          </div>
        ) : (
          <ul className="grid max-h-[50dvh] grid-cols-3 gap-1.5 overflow-y-auto">
            {gifs.map((g) => (
              <li key={g.id} className="relative">
                <button
                  onClick={() => {
                    if (managing) return
                    onPick(g)
                    onClose()
                  }}
                  className={cn(
                    'block aspect-square w-full overflow-hidden rounded-xl transition-transform active:scale-95',
                    managing && !canRemove(g) && 'opacity-40',
                  )}
                  aria-label={managing ? g.originalName : `Send ${g.originalName}`}
                  disabled={managing}
                >
                  <GifImage householdId={householdId} mediaId={g.id} alt={g.originalName} className="size-full" />
                </button>
                {managing && canRemove(g) && (
                  <button
                    onClick={() =>
                      remove.mutate(g.id, {
                        onSuccess: () => toast.success('GIF removed'),
                        onError: (e) => toast.error(apiErrorMessage(e, 'Could not remove the GIF')),
                      })
                    }
                    className="absolute top-1 right-1 grid size-8 place-items-center rounded-full border-2 border-ink bg-blush"
                    aria-label={`Remove ${g.originalName}`}
                  >
                    <Trash2 size={14} aria-hidden />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </BottomSheet>
  )
}
