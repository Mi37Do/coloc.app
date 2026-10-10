import type { ReactNode } from 'react'

type Props = { label: string; error?: string; hint?: string; children: ReactNode }

// Label + control + error, the pattern every form here repeats. Controls use .field.
export function Field({ label, error, hint, children }: Props) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-bold">
      {label}
      {children}
      {error ? (
        <span className="font-semibold text-red-700">{error}</span>
      ) : (
        hint && <span className="muted font-medium">{hint}</span>
      )}
    </label>
  )
}
