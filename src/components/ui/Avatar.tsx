import { cn } from '@/utils/cn'

type Person = { id: string; firstname: string; lastname: string }

// Soft tints from the palette, picked from the user id so a person keeps their colour.
const tints = ['bg-sage', 'bg-sky', 'bg-butter', 'bg-blush', 'bg-mint']

function tintFor(id: string) {
  let hash = 0
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0
  return tints[Math.abs(hash) % tints.length]
}

const sizes = { sm: 'size-8 text-xs', md: 'size-11 text-sm', lg: 'size-14 text-lg' }

export function Avatar({ person, size = 'md', className }: { person: Person; size?: keyof typeof sizes; className?: string }) {
  const initials = (person.firstname[0] ?? '') + (person.lastname[0] ?? '')
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-full border-2 border-ink font-extrabold text-ink',
        tintFor(person.id),
        sizes[size],
        className,
      )}
      aria-hidden
    >
      {initials.toUpperCase()}
    </span>
  )
}

/** Overlapping avatars, like the household header in the reference */
export function AvatarStack({ people, max = 3, size = 'sm' }: { people: Person[]; max?: number; size?: keyof typeof sizes }) {
  const shown = people.slice(0, max)
  const extra = people.length - shown.length
  return (
    <span className="flex items-center" aria-label={people.map((p) => p.firstname).join(', ')}>
      {shown.map((p, i) => (
        <Avatar key={p.id} person={p} size={size} className={cn(i > 0 && '-ml-2.5')} />
      ))}
      {extra > 0 && (
        <span className={cn('-ml-2.5 grid place-items-center rounded-full border-2 border-ink bg-paper font-extrabold', sizes[size])}>
          +{extra}
        </span>
      )}
    </span>
  )
}
