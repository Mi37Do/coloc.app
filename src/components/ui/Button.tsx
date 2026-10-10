import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

// Thin wrapper over the .pill classes (see assets/main.css).
const variants = {
  dark: '',
  light: 'pill--light',
  mint: 'pill--mint',
  blush: 'pill--blush',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
}

export function Button({ variant = 'dark', className, ...props }: ButtonProps) {
  return <button className={cn('pill', variants[variant], className)} {...props} />
}
