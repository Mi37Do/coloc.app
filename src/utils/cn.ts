import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combine classes like Vue's :class binding: cn('px-4', isActive && 'font-bold', props.class)
// Conflicting Tailwind classes are merged, so the last one wins.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
