import { cn } from '@/utils/cn'

// A pinned-notes wall drawn in CSS, standing in for the reference's illustrations.
const presets = {
  chores: [
    ['🧺', 'Laundry'],
    ['🍽️', 'Dishes'],
    ['🗑️', 'Trash'],
    ['🪴', 'Plants'],
    ['🧹', 'Vacuum'],
    ['🛁', 'Bathroom'],
  ],
  mail: [
    ['✉️', 'Check inbox'],
    ['🔢', '6 digits'],
    ['⏱️', '15 min'],
    ['✅', 'Confirm'],
  ],
  home: [
    ['🔑', 'Get a code'],
    ['🏠', 'Our flat'],
    ['🤝', 'Roomies'],
    ['🧾', 'Bills'],
    ['🛒', 'Shopping'],
    ['🧽', 'Chores'],
  ],
} as const

const tilts = ['-rotate-6', 'rotate-3', '-rotate-2', 'rotate-6', 'rotate-1', '-rotate-4']
const fills = ['bg-paper', 'bg-butter', 'bg-paper', 'bg-sky', 'bg-butter', 'bg-paper']

export function NoteWall({ preset = 'chores', className }: { preset?: keyof typeof presets; className?: string }) {
  const notes = presets[preset]
  return (
    <div className={cn('relative mx-auto grid w-full max-w-72 grid-cols-3 gap-3 py-2', className)} aria-hidden>
      {notes.map(([emoji, label], i) => (
        <div
          key={label}
          className={cn(
            'flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-[1.5px] border-ink p-1 text-center shadow-[3px_3px_0_#0B0B0B]',
            tilts[i % tilts.length],
            fills[i % fills.length],
            i % 2 === 1 && 'translate-y-3',
          )}
        >
          <span className="text-2xl leading-none">{emoji}</span>
          <span className="font-display text-[13px] leading-tight font-semibold">{label}</span>
        </div>
      ))}
      <span className="absolute -top-3 -left-2 text-lg">✦</span>
      <span className="absolute top-1/2 -right-4 text-sm">✦</span>
      <span className="absolute -bottom-2 left-1/3 text-xs">✦</span>
    </div>
  )
}
