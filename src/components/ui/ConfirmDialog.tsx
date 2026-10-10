import { Description, Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button } from './Button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
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
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
        >
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          {description && (
            <Description className="mt-2 text-sm text-slate-500 dark:text-slate-400">{description}</Description>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
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
