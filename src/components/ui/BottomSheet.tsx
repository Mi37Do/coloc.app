import type { ReactNode } from 'react'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { X } from 'lucide-react'

type BottomSheetProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

// A mobile sheet that slides up from the bottom. Headless UI handles focus and Escape.
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-ink/50 transition-opacity duration-200 data-closed:opacity-0"
      />
      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md">
        <DialogPanel
          transition
          className="max-h-[90dvh] overflow-y-auto rounded-t-[1.75rem] border-x-2 border-t-2 border-ink bg-paper px-5 pt-3 pb-[max(1.5rem,var(--safe-bottom))] transition duration-250 ease-out data-closed:translate-y-full"
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />
          <div className="mb-5 flex items-center justify-between gap-3">
            <DialogTitle className="font-display text-2xl">{title}</DialogTitle>
            <button onClick={onClose} className="icon-btn icon-btn--light border-2 border-ink" aria-label="Close">
              <X size={18} aria-hidden />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
