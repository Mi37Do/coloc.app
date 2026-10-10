import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LoginInput } from '@/schemas/auth.schema'

type User = { email: string; name: string }

type AuthState = {
  user: User | null
  token: string | null
  login: (credentials: LoginInput) => Promise<void>
  logout: () => void
}

// Pinia option-style store: state and actions together, with persistence built in
// (pinia-plugin-persistedstate). Outside components use useAuthStore.getState().
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: async ({ email }) => {
        // Replace with a real call, e.g. await api.post('/auth/login', credentials)
        await new Promise((resolve) => setTimeout(resolve, 500))
        set({ user: { email, name: email.split('@')[0] }, token: 'demo-token' })
      },
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'auth' },
  ),
)
