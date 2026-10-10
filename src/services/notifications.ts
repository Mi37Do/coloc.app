import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { AppNotification } from '@/types/api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unread: ['notifications', 'unread'] as const,
}

export function useNotifications() {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: async () => (await api.get<AppNotification[]>('/notifications', { params: { limit: 50 } })).data,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => (await api.get<{ count: number }>('/notifications/unread-count')).data.count,
    // The socket pushes new ones; this is only a fallback
    refetchInterval: 5 * 60_000,
  })
}

const useInvalidate = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: notificationKeys.all })
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/notifications/${id}/read`)
    },
    onSuccess: invalidate,
  })
}

export function useMarkAllRead() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async () => {
      await api.post('/notifications/read-all')
    },
    onSuccess: invalidate,
  })
}

export function useDeleteNotification() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/notifications/${id}`)
    },
    onSuccess: invalidate,
  })
}
