import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginInput } from '@/schemas/auth.schema'
import type { AuthResponse, Membership, RegisterInput, User } from '@/types/api'
import { api } from '@/services/api'

/** An invite the user opened before they could accept it (signed out or unconfirmed) */
export type PendingInvite = { kind: 'token' | 'code'; value: string; householdName?: string }

type AuthState = {
  user: User | null
  token: string | null
  /** The household the tabs show; defaults to the first one the user belongs to */
  householdId: string | null
  pendingInvite: PendingInvite | null
  login: (credentials: LoginInput) => Promise<AuthResponse>
  register: (input: RegisterInput) => Promise<AuthResponse>
  verifyEmail: (code: string) => Promise<AuthResponse>
  resendCode: () => Promise<void>
  /** Accepts an invite link or code and switches to that household */
  joinHousehold: (invite: PendingInvite) => Promise<string>
  setHousehold: (householdId: string | null) => void
  setPendingInvite: (invite: PendingInvite | null) => void
  logout: () => void
}

// Pinia option-style store: state and actions together, with persistence built in
// (pinia-plugin-persistedstate). Outside components use useAuthStore.getState().
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => {
      const startSession = (data: AuthResponse) => {
        set((state) => ({
          user: data.user,
          token: data.accessToken,
          householdId: data.joinedHouseholdId ?? state.householdId,
          // The API joined the household from the link during login
          pendingInvite: data.joinedHouseholdId ? null : state.pendingInvite,
        }))
        return data
      }

      return {
        user: null,
        token: null,
        householdId: null,
        pendingInvite: null,
        login: async (credentials) => {
          const pending = get().pendingInvite
          const { data } = await api.post<AuthResponse>('/auth/login', {
            ...credentials,
            ...(pending?.kind === 'token' && { inviteToken: pending.value }),
          })
          return startSession(data)
        },
        register: async (input) => {
          const { data } = await api.post<AuthResponse>('/auth/register', input)
          return startSession(data)
        },
        verifyEmail: async (code) => {
          const { data } = await api.post<AuthResponse>('/auth/verify-email', { code })
          return startSession(data)
        },
        resendCode: async () => {
          await api.post('/auth/resend-code')
        },
        joinHousehold: async ({ kind, value }) => {
          const path = kind === 'token' ? `/invites/${value}/accept` : `/invites/code/${value}/accept`
          const { data } = await api.post<Membership>(path)
          set({ householdId: data.householdId, pendingInvite: null })
          return data.householdId
        },
        setHousehold: (householdId) => set({ householdId }),
        setPendingInvite: (pendingInvite) => set({ pendingInvite }),
        logout: () => set({ user: null, token: null, householdId: null, pendingInvite: null }),
      }
    },
    { name: 'auth' },
  ),
)
