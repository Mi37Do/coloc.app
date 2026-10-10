import { useMutation } from '@tanstack/react-query'
import { api } from './api'
import type { HouseholdInvite, InvitePreview } from '@/types/api'
import type { PendingInvite } from '@/stores/auth.store'

/** Public: which household an invite link or code points to */
export async function previewInvite({ kind, value }: Pick<PendingInvite, 'kind' | 'value'>) {
  const path = kind === 'token' ? `/invites/${value}` : `/invites/code/${encodeURIComponent(value)}`
  return (await api.get<InvitePreview>(path)).data
}

/** Admins only. Creates a link + code that stays valid for 7 days. */
export function useCreateInvite(householdId: string) {
  return useMutation({
    mutationFn: async () =>
      (await api.post<HouseholdInvite>(`/households/${householdId}/invite-links`, { expiresInHours: 24 * 7 })).data,
  })
}

/** "k7qm2x" -> "K7Q-M2X" while typing; same alphabet as the API (no 0/O/1/I/L) */
export function formatInviteCode(raw: string) {
  const clean = raw
    .toUpperCase()
    .replace(/[^ABCDEFGHJKMNPQRSTUVWXYZ23456789]/g, '')
    .slice(0, 6)
  return clean.length > 3 ? `${clean.slice(0, 3)}-${clean.slice(3)}` : clean
}
