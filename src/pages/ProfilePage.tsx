import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Check, LogOut } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TopPanel } from '@/components/ui/TopPanel'
import { useHouseholds } from '@/services/households'
import { useAuthStore } from '@/stores'
import { cn } from '@/utils/cn'

export function ProfilePage() {
  const user = useAuthStore((state) => state.user)
  const householdId = useAuthStore((state) => state.householdId)
  const setHousehold = useAuthStore((state) => state.setHousehold)
  const logout = useAuthStore((state) => state.logout)
  const { data: households = [] } = useHouseholds()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (!user) return null

  return (
    <>
      <TopPanel
        className="flex flex-col items-center gap-3 pb-7 text-center"
        bar={
          <>
            <Avatar person={user} />
            <p className="min-w-0 flex-1 truncate font-display text-xl">
              {user.firstname} {user.lastname}
            </p>
          </>
        }
      >
        <Avatar person={user} size="lg" className="size-20 text-2xl" />
        <div>
          <h1 className="font-display text-[28px] leading-tight">
            {user.firstname} {user.lastname}
          </h1>
          <p className="muted mt-1 text-sm font-semibold">
            @{user.username} · {user.email}
          </p>
        </div>
      </TopPanel>

      <section className="panel flex flex-col gap-3" aria-labelledby="households-title">
        <h2 id="households-title" className="text-[17px] font-bold">
          Your households
        </h2>
        {households.length === 0 ? (
          <p className="muted text-sm font-medium">You're not in a household yet.</p>
        ) : (
          <ul className="flex flex-col gap-2" role="radiogroup" aria-label="Active household">
            {households.map((h) => {
              const active = h.id === householdId
              return (
                <li key={h.id}>
                  <button
                    role="radio"
                    aria-checked={active}
                    onClick={() => setHousehold(h.id)}
                    className={cn(
                      'flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] px-4 text-left font-bold transition-colors',
                      active ? 'border-ink bg-butter' : 'border-line bg-paper',
                    )}
                  >
                    <span className="truncate">{h.name}</span>
                    <span
                      className={cn(
                        'grid size-6 shrink-0 place-items-center rounded-full border-[1.5px] border-ink',
                        active && 'bg-ink text-paper',
                      )}
                      aria-hidden
                    >
                      {active && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="panel panel--butter flex flex-1 flex-col gap-6 pb-6">
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="text-5xl" aria-hidden>
            🏡
          </span>
          <p className="font-display text-2xl">Home is better shared</p>
          <p className="muted text-sm font-semibold">coloc · chores, shopping and bills for flatmates</p>
        </div>
        <Button variant="blush" onClick={() => setConfirmOpen(true)}>
          Sign out <LogOut size={19} aria-hidden />
        </Button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Sign out?"
        description="You will need to sign in again to see your household."
        confirmLabel="Sign out"
        destructive
        onConfirm={() => {
          logout()
          queryClient.clear()
          navigate('/login')
        }}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
