import type { ReactNode } from 'react'
import { NoteWall } from './NoteWall'
import { cn } from '@/utils/cn'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  art?: 'chores' | 'mail' | 'home'
  tone?: 'mint' | 'sky' | 'butter'
  children: ReactNode
  footer?: ReactNode
}

// Onboarding-style screen: an illustrated panel on top, then a panel with a
// slab-serif headline and the form. Used for sign-in, sign-up, confirm, join.
export function AuthScreen({ title, subtitle, art = 'chores', tone = 'mint', children, footer }: Props) {
  return (
    <div className="canvas">
      <div
        className={cn(
          'panel flex min-h-56 flex-1 items-center justify-center pt-[max(2rem,var(--safe-top))] pb-8',
          `panel--${tone}`,
        )}
      >
        <NoteWall preset={art} />
      </div>
      <div className="panel flex flex-col gap-5 pb-[max(1.5rem,var(--safe-bottom))]">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[32px] leading-[1.1]">{title}</h1>
          {subtitle && <p className="muted font-medium">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="text-center text-sm font-semibold">{footer}</div>}
      </div>
    </div>
  )
}
