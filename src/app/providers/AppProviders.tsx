import type { ReactNode } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/query-client'

// Everything Vue would register with app.use(...) goes here.
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "!rounded-2xl !border-[1.5px] !border-ink !font-sans !font-semibold !shadow-none",
            success: "!bg-mint !text-ink",
            error: "!bg-blush !text-ink",
            warning: "!bg-butter !text-ink",
          },
        }}
      />
    </QueryClientProvider>
  )
}
