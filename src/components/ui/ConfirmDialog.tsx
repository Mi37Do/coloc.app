import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  /** Blush confirm button for leaving, deleting and signing out */
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

// A reusable modal, like a Vue component used with v-model:open.
// Headless UI handles focus trapping, Escape, click-outside and aria attributes.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-ink/50 transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="panel w-full max-w-sm border-2 border-ink transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
          {description && <Description className="muted mt-2 font-medium">{description}</Description>}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant={destructive ? 'blush' : 'dark'}
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
