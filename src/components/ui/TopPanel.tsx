import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Props = {
  /** Panel colour, one of the .panel--* tones */
  tone?: 'mint' | 'sky' | 'butter' | 'blush'
  /** The compact app bar shown once the panel scrolls away (avatar, title, actions) */
  bar: ReactNode
  /** The full panel content */
  children: ReactNode
  className?: string
}

const BAR_HEIGHT = 72
/** px of scroll before the bar takes over */
const SWITCH_AFTER = 24

/**
 * The top card of a screen. At rest it's a full rounded panel; once you start
 * scrolling, a compact app bar of the same colour slides in over it, rounded only
 * at the bottom. The full panel never changes size, so scrolling doesn't jump.
 */
export function TopPanel({ tone = 'mint', bar, children, className }: Props) {
  const ref = useRef<HTMLElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    // Switch to the bar as soon as the panel's top row starts sliding under the edge.
    let frame = 0
    const update = () => {
      frame = 0
      setStuck(el.getBoundingClientRect().top < -SWITCH_AFTER)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <>
      <header ref={ref} className={cn('panel pt-[max(1.25rem,var(--safe-top))]', `panel--${tone}`, className)}>
        {children}
      </header>

      <div
        className={cn(
          'fixed inset-x-0 top-0 z-30 mx-auto w-full max-w-md px-0 transition duration-200 ease-out',
          stuck ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
        )}
        // Hidden copy: keep it out of the tab order and the accessibility tree.
        inert={!stuck}
        aria-hidden={!stuck}
      >
        <div
          className={cn(
            'flex items-center gap-3 rounded-b-panel px-5 pt-[max(0.75rem,var(--safe-top))] pb-3 shadow-[0_8px_24px_rgb(11_11_11/14%)]',
            `panel--${tone}`,
          )}
          style={{ minHeight: BAR_HEIGHT }}
        >
          {bar}
        </div>
      </div>
    </>
  )
}
