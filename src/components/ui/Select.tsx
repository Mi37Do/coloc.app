import type { ReactNode } from 'react'
import { Field as HField, Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export type SelectOption<T> = { value: T; label: string; icon?: ReactNode; disabled?: boolean }

type Props<T> = {
  value: T | undefined
  onChange: (value: T) => void
  options: SelectOption<T>[]
  label?: string
  placeholder?: string
  /** Hide the label visually but keep it for screen readers */
  srLabel?: boolean
  className?: string
  buttonClassName?: string
}

/** Dropdown in the app's style (Headless UI Listbox): outlined field, floating rounded panel. */
export function Select<T extends string | number>({
  value,
  onChange,
  options,
  label,
  placeholder = 'Choose…',
  srLabel,
  className,
  buttonClassName,
}: Props<T>) {
  const selected = options.find((o) => o.value === value)

  return (
    <HField className={cn('flex flex-col gap-1.5', className)}>
      {label && <Label className={cn('text-sm font-bold', srLabel && 'sr-only')}>{label}</Label>}
      <Listbox value={value} onChange={onChange}>
        <ListboxButton
          className={cn(
            'group field flex items-center justify-between gap-2 text-left data-open:shadow-[0_0_0_4px_rgb(181_220_141/60%)]',
            buttonClassName,
          )}
        >
          <span className={cn('flex min-w-0 items-center gap-2 truncate', !selected && 'text-neutral-gray')}>
            {selected?.icon}
            {selected?.label ?? placeholder}
          </span>
          <ChevronDown size={18} className="shrink-0 transition-transform group-data-open:rotate-180" aria-hidden />
        </ListboxButton>
        <ListboxOptions anchor="bottom start" transition className="popover max-h-60 w-(--button-width) min-w-40 overflow-y-auto">
          {options.map((o) => (
            <ListboxOption key={String(o.value)} value={o.value} disabled={o.disabled} className="group option">
              {o.icon}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              <Check size={16} strokeWidth={3} className="invisible shrink-0 group-data-selected:visible" aria-hidden />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </Listbox>
    </HField>
  )
}
