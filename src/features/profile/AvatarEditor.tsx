import { useState } from 'react'
import { Camera, ImagePlus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar } from '@/components/ui/Avatar'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { useRemoveAvatar, useSetAvatar } from '@/services/profile'
import type { User } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { chooseImages, squareJpeg } from '@/utils/images'

/** The big avatar on Settings: tap to add, change or remove your profile picture */
export function AvatarEditor({ user }: { user: User }) {
  const setAvatar = useSetAvatar()
  const removeAvatar = useRemoveAvatar()
  const [menuOpen, setMenuOpen] = useState(false)
  const busy = setAvatar.isPending || removeAvatar.isPending

  const choose = async () => {
    setMenuOpen(false)
    const [file] = await chooseImages()
    if (!file) return
    try {
      await setAvatar.mutateAsync(await squareJpeg(file))
      toast.success('Profile picture updated')
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not use that image'))
    }
  }

  const row = 'flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 text-left font-bold hover:bg-ivory'

  return (
    <>
      <button
        onClick={() => (user.avatarUpdatedAt ? setMenuOpen(true) : void choose())}
        disabled={busy}
        className="relative rounded-full transition-transform active:scale-95"
        aria-label={user.avatarUpdatedAt ? 'Change profile picture' : 'Add a profile picture'}
      >
        <Avatar person={user} size="lg" className={busy ? 'size-20 animate-pulse text-2xl' : 'size-20 text-2xl'} />
        <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full border-2 border-mint bg-ink text-paper" aria-hidden>
          <Camera size={15} />
        </span>
      </button>

      <BottomSheet open={menuOpen} title="Profile picture" onClose={() => setMenuOpen(false)}>
        <div className="flex flex-col gap-1">
          <button className={row} onClick={() => void choose()}>
            <ImagePlus size={18} aria-hidden /> Change photo
          </button>
          <button
            className={`${row} text-red-700`}
            onClick={() => {
              setMenuOpen(false)
              removeAvatar.mutate(undefined, {
                onSuccess: () => toast.success('Profile picture removed'),
                onError: (e) => toast.error(apiErrorMessage(e, 'Could not remove it')),
              })
            }}
          >
            <Trash2 size={18} aria-hidden /> Remove photo
          </button>
        </div>
      </BottomSheet>
    </>
  )
}
