import { useMemo, useState } from 'react'
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Field as HField,
  Label,
} from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { SelectOption } from './Select'

type Props<T> = {
  value: T | undefined
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label: string
  placeholder?: string
  error?: string
  className?: string
}

// Accent- and case-insensitive: "cote" finds "Côte d'Ivoire"
const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/** Searchable dropdown (Headless UI Combobox) for long lists such as countries. */
export function ComboboxField<T extends string | number>({ value, onChange, options, label, placeholder, error, className }: Props<T>) {
  const [query, setQuery] = useState('')
  const selected = options.find((o) => o.value === value) ?? null

  const filtered = useMemo(() => {
    if (!query.trim()) return options
    const q = fold(query.trim())
    // Prefix matches first, then anywhere
    const starts = options.filter((o) => fold(o.label).startsWith(q))
    const contains = options.filter((o) => !fold(o.label).startsWith(q) && fold(o.label).includes(q))
    return [...starts, ...contains]
  }, [options, query])

  return (
    <HField className={cn('flex flex-col gap-1.5', className)}>
      <Label className="text-sm font-bold">{label}</Label>
      <Combobox
        value={selected}
        onChange={(o: SelectOption<T> | null) => o && onChange(o.value)}
        onClose={() => setQuery('')}
        immediate
      >
        <div className="relative">
          <ComboboxInput
            className="field pr-10"
            placeholder={placeholder}
            aria-invalid={!!error}
            autoComplete="off"
            displayValue={(o: SelectOption<T> | null) => o?.label ?? ''}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ComboboxButton className="absolute inset-y-0 right-0 grid w-10 place-items-center" aria-label={`Show ${label.toLowerCase()} options`}>
            <ChevronDown size={18} aria-hidden />
          </ComboboxButton>
        </div>
        <ComboboxOptions anchor="bottom start" transition className="popover max-h-64 w-(--input-width) overflow-y-auto empty:invisible">
          {filtered.length === 0 && query ? (
            <div className="muted px-3 py-3 text-sm font-semibold">No match for "{query}"</div>
          ) : (
            filtered.map((o) => (
              <ComboboxOption key={String(o.value)} value={o} className="group option">
                {o.icon}
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                <Check size={16} strokeWidth={3} className="invisible shrink-0 group-data-selected:visible" aria-hidden />
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </Combobox>
      {error && <span className="text-sm font-semibold text-red-700">{error}</span>}
    </HField>
  )
}
