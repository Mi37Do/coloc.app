import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { NoteWall } from '@/components/ui/NoteWall'
import { useCreateHousehold } from '@/services/households'
import { formatInviteCode, previewInvite } from '@/services/invites'
import { useAuthStore } from '@/stores'
import type { InvitePreview } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'

type Mode = 'create' | 'join'

// Shown when the user belongs to no household yet: start one, or join with a code.
export function CreateHousehold() {
  const [mode, setMode] = useState<Mode>('create')

  return (
    <>
      <section className="panel panel--sky flex flex-col gap-6 pb-8">
        <NoteWall preset="home" className="mt-4" />
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[32px] leading-[1.1]">Set up your home</h2>
          <p className="font-medium">
            Start a new household, or join your flatmates with the code they shared. Got a link? Just open it.
          </p>
        </div>
      </section>

      <section className="panel flex flex-1 flex-col gap-5 pb-6">
        <div className="segmented bg-ivory" role="tablist" aria-label="Create or join">
          <button role="tab" aria-selected={mode === 'create'} onClick={() => setMode('create')}>
            Create
          </button>
          <button role="tab" aria-selected={mode === 'join'} onClick={() => setMode('join')}>
            Join with a code
          </button>
        </div>
        {mode === 'create' ? <CreateForm /> : <JoinForm />}
      </section>
    </>
  )
}

function CreateForm() {
  const [name, setName] = useState('')
  const createHousehold = useCreateHousehold()
  const setHousehold = useAuthStore((state) => state.setHousehold)

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    try {
      const household = await createHousehold.mutateAsync({ name: name.trim() })
      setHousehold(household.id)
      toast.success(`${household.name} is ready`)
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Could not create the household'))
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" role="tabpanel">
      <Field label="Household name" hint="You'll be its admin and can invite flatmates.">
        <input
          className="field"
          placeholder="Apartment on Rue des Lilas"
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
      <Button type="submit" disabled={!name.trim() || createHousehold.isPending}>
        {createHousehold.isPending ? 'Creating…' : 'Create household'}
      </Button>
    </form>
  )
}

function JoinForm() {
  const joinHousehold = useAuthStore((state) => state.joinHousehold)
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [found, setFound] = useState<InvitePreview>()
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const complete = code.length === 7 // "K7Q-M2X"

  const lookUp = async (event: FormEvent) => {
    event.preventDefault()
    if (!complete) return
    setBusy(true)
    setError(undefined)
    try {
      setFound(await previewInvite({ kind: 'code', value: code }))
    } catch (err) {
      setError(apiErrorMessage(err, 'No household uses this code'))
    } finally {
      setBusy(false)
    }
  }

  const join = async () => {
    if (!found) return
    setBusy(true)
    try {
      await joinHousehold({ kind: 'code', value: code })
      await queryClient.invalidateQueries({ queryKey: ['households'] })
      toast.success(`You joined ${found.household.name}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not join the household'))
      setBusy(false)
    }
  }

  if (found) {
    return (
      <div className="flex flex-col gap-4" role="tabpanel">
        <div className="tile tile--outline bg-butter">
          <p className="text-sm font-bold">Code {code}</p>
          <p className="mt-1 font-display text-2xl">{found.household.name}</p>
          <p className="mt-1 text-sm font-semibold">
            {found.memberCount} {found.memberCount === 1 ? 'member' : 'members'}
            {found.household.city ? ` · ${found.household.city}` : ''}
          </p>
        </div>
        <Button onClick={join} disabled={busy}>
          {busy ? 'Joining…' : `Join ${found.household.name}`}
        </Button>
        <Button variant="light" onClick={() => setFound(undefined)} disabled={busy}>
          Use a different code
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={lookUp} className="flex flex-col gap-4" role="tabpanel">
      <Field label="Household code" error={error} hint="6 characters, like K7Q-M2X">
        <input
          className="field text-center text-2xl font-extrabold tracking-[0.3em] uppercase"
          placeholder="ABC-234"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={!!error}
          value={code}
          onChange={(e) => {
            setCode(formatInviteCode(e.target.value))
            setError(undefined)
          }}
        />
      </Field>
      <Button type="submit" disabled={!complete || busy}>
        {busy ? 'Looking it up…' : 'Find household'}
      </Button>
    </form>
  )
}
