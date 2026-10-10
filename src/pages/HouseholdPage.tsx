import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft, LogOut, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProgressRing } from '@/components/ui/ProgressRing'
import { TopPanel } from '@/components/ui/TopPanel'
import { CreateHousehold, monthProgress, roomieScores } from '@/features/chores'
import { InviteSheet } from '@/features/household/InviteSheet'
import { useActiveHousehold, useChores, useLeaveHousehold, useMembers } from '@/services/households'
import { useAuthStore } from '@/stores'
import type { Chore, Household, Member } from '@/types/api'
import { apiErrorMessage } from '@/utils/api-error'
import { weekOf } from '@/utils/dates'

type Tab = 'info' | 'progress'

export function HouseholdPage() {
  const { active, isPending } = useActiveHousehold()
  if (isPending) return <div className="panel panel--mint h-56 animate-pulse" aria-busy="true" />
  if (!active) return <CreateHousehold />
  return <Household household={active} />
}

function Household({ household }: { household: Household }) {
  const navigate = useNavigate()
  const { data: members = [] } = useMembers(household.id)
  const { data: chores = [] } = useChores(household.id)
  const [tab, setTab] = useState<Tab>('info')

  const backButton = (
    <button
      className="icon-btn icon-btn--light border-2 border-ink"
      onClick={() => navigate('/')}
      aria-label="Back to home"
    >
      <ArrowLeft size={20} aria-hidden />
    </button>
  )

  return (
    <>
      <TopPanel
        className="relative flex flex-col items-center gap-2 px-16 text-center"
        bar={
          <>
            {backButton}
            <p className="min-w-0 flex-1 truncate font-display text-xl">{household.name}</p>
            <AvatarStack people={members.map((m) => m.user)} />
          </>
        }
      >
        <div className="absolute top-[max(1.25rem,var(--safe-top))] left-4">{backButton}</div>
        <h1 className="font-display text-[28px] leading-tight">{household.name}</h1>
        <p className="muted text-sm font-semibold">
          {members.length} {members.length === 1 ? 'member' : 'members'}
          {household.city ? ` · ${household.city}` : ''}
        </p>
        <AvatarStack people={members.map((m) => m.user)} max={5} size="md" />
      </TopPanel>

      <div className="panel p-1.5">
        <div className="segmented bg-ivory" role="tablist" aria-label="Household">
          <button role="tab" aria-selected={tab === 'info'} onClick={() => setTab('info')}>
            Information
          </button>
          <button role="tab" aria-selected={tab === 'progress'} onClick={() => setTab('progress')}>
            Progress
          </button>
        </div>
      </div>

      {tab === 'info' ? (
        <Information household={household} members={members} />
      ) : (
        <Progress members={members} chores={chores} />
      )}
    </>
  )
}

function Information({ household, members }: { household: Household; members: Member[] }) {
  const me = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const leave = useLeaveHousehold(household.id)
  const [inviting, setInviting] = useState(false)
  const [confirmLeave, setConfirmLeave] = useState(false)
  const isAdmin = members.some((m) => m.userId === me?.id && m.role === 'admin')

  const onLeave = () =>
    leave.mutate(undefined, {
      onSuccess: () => {
        toast.success(`You left ${household.name}`)
        navigate('/', { replace: true })
      },
      onError: (e) => toast.error(apiErrorMessage(e, 'Could not leave the household')),
    })

  return (
    <section className="panel flex flex-1 flex-col gap-5 pb-6" aria-label="Members">
      <ul className="flex flex-col gap-4">
        {members.map(({ user, role }) => (
          <li key={user.id} className="flex items-center gap-3">
            <Avatar person={user} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">
                {user.firstname} {user.lastname}
                {user.id === me?.id && <span className="muted font-semibold"> (you)</span>}
              </p>
              <p className="muted truncate text-sm font-semibold">@{user.username}</p>
            </div>
            {role === 'admin' && <span className="badge bg-mint">Admin</span>}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2.5">
        {isAdmin && (
          <Button variant="light" onClick={() => setInviting(true)}>
            <UserPlus size={19} aria-hidden /> Invite friends
          </Button>
        )}
        <Button variant="blush" onClick={() => setConfirmLeave(true)} disabled={leave.isPending}>
          Leave group <LogOut size={19} aria-hidden />
        </Button>
      </div>

      <InviteSheet householdId={household.id} householdName={household.name} open={inviting} onClose={() => setInviting(false)} />
      <ConfirmDialog
        open={confirmLeave}
        title={`Leave ${household.name}?`}
        description={
          members.length <= 1
            ? "You're the last member, so the household and its chores will be deleted."
            : 'You can rejoin later with a new invite.'
        }
        confirmLabel="Leave"
        destructive
        onConfirm={onLeave}
        onClose={() => setConfirmLeave(false)}
      />
    </section>
  )
}

function Progress({ members, chores }: { members: Member[]; chores: Chore[] }) {
  const me = useAuthStore((state) => state.user)
  const progress = monthProgress(chores)
  const scores = roomieScores(chores, members)
  const mine = scores.find((s) => s.member.userId === me?.id)
  const weekStart = weekOf(new Date())[0]
  const mineThisWeek = chores.filter(
    (c) => c.completedById === me?.id && c.completedAt && new Date(c.completedAt) >= weekStart,
  ).length

  return (
    <>
      <section className="panel panel--mint flex flex-col gap-4" aria-labelledby="progress-title">
        <div className="flex items-center justify-between">
          <h2 id="progress-title" className="text-[17px] font-bold">
            Household progress
          </h2>
          <span className="text-sm font-bold">This month</span>
        </div>
        <div className="flex justify-center py-2">
          <ProgressRing percent={progress.percent} label="Household progress this month" />
        </div>
        <p className="text-center text-sm font-semibold">
          {progress.done} of {progress.total} chores done
        </p>
      </section>

      <section className="panel flex flex-1 flex-col gap-4 pb-6" aria-labelledby="rate-title">
        <h2 id="rate-title" className="text-[17px] font-bold">
          Roomies rate
        </h2>
        <ul className="flex flex-col gap-4">
          {scores.map(({ member, done, share }) => (
            <li key={member.userId} className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar person={member.user} size="sm" />
                <span className="min-w-0 flex-1 truncate font-bold">
                  {member.user.firstname} {member.user.lastname}
                </span>
                <span className="font-extrabold tabular-nums">
                  {done} <span className="text-sm font-bold">done</span>
                </span>
              </div>
              <div className="meter" aria-hidden>
                <span style={{ width: `${Math.max(share * 100, done ? 8 : 0)}%` }} />
              </div>
            </li>
          ))}
        </ul>

        <hr className="border-line" />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold">Your monthly score</p>
            <p className="muted text-sm font-semibold">+{mineThisWeek} this week</p>
          </div>
          <span className="text-2xl font-extrabold tabular-nums">{mine?.done ?? 0}</span>
        </div>
      </section>
    </>
  )
}
