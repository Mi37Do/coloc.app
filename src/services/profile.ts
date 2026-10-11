import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '@/stores'
import type { User } from '@/types/api'

/** Updates the signed-in user and refreshes lists that show people (members, chats…) */
function useApplyUser() {
  const queryClient = useQueryClient()
  return (avatarUpdatedAt: string | null) => {
    const { user } = useAuthStore.getState()
    if (user) useAuthStore.setState({ user: { ...user, avatarUpdatedAt } })
    return queryClient.invalidateQueries({ queryKey: ['households'] })
  }
}

export function useSetAvatar() {
  const apply = useApplyUser()
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return (await api.put<User>('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: (user) => apply(user.avatarUpdatedAt ?? null),
  })
}

export function useRemoveAvatar() {
  const apply = useApplyUser()
  return useMutation({
    mutationFn: async () => {
      await api.delete('/users/me/avatar')
    },
    onSuccess: () => apply(null),
  })
}
