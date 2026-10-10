import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { TopPanel } from './TopPanel'

type Props = {
  title: string
  subtitle?: ReactNode
  /** Where the back button goes; omit for no back button */
  back?: string
  /** Right-hand action, e.g. an icon button */
  action?: ReactNode
  tone?: 'mint' | 'sky' | 'butter' | 'blush'
  children?: ReactNode
}

// The standard top card: back, slab-serif title, action. Collapses into an app bar on scroll.
export function ScreenHeader({ title, subtitle, back, action, tone = 'mint', children }: Props) {
  const navigate = useNavigate()
  const backButton = back && (
    <button className="icon-btn icon-btn--light border-2 border-ink" onClick={() => navigate(back)} aria-label="Back">
      <ArrowLeft size={20} aria-hidden />
    </button>
  )

  return (
    <TopPanel
      tone={tone}
      bar={
        <>
          {backButton}
          <p className="min-w-0 flex-1 truncate font-display text-xl">{title}</p>
          {action}
        </>
      }
    >
      <div className="flex items-start gap-3">
        {backButton}
        <div className="min-w-0 flex-1 pt-1">
          <h1 className="font-display text-[30px] leading-[1.1]">{title}</h1>
          {subtitle && <p className="muted mt-1 text-sm font-semibold">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </TopPanel>
  )
}
