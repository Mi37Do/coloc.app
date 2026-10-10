import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '@/stores'
import type { Conversation, Message } from '@/types/api'

const base = (householdId: string) => `/households/${householdId}/conversations`
const PAGE = 50

export const chatKeys = {
  conversations: (householdId: string) => ['households', householdId, 'chat'] as const,
  messages: (householdId: string, conversationId: string) =>
    ['households', householdId, 'chat', conversationId] as const,
}

export function useConversations(householdId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.conversations(householdId ?? ''),
    queryFn: async () => (await api.get<Conversation[]>(base(householdId!))).data,
    enabled: !!householdId,
  })
}

/** Newest page of a conversation, oldest first. Live messages are appended by the realtime hook. */
export function useMessages(householdId: string, conversationId: string) {
  return useQuery({
    queryKey: chatKeys.messages(householdId, conversationId),
    queryFn: async () =>
      (await api.get<Message[]>(`${base(householdId)}/${conversationId}/messages`, { params: { limit: PAGE } })).data,
    staleTime: Infinity, // the socket keeps it fresh
  })
}

/** Fetches the page before the oldest loaded message and prepends it. Resolves to false when there is no more. */
export function useLoadOlder(householdId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const key = chatKeys.messages(householdId, conversationId)
  return useMutation({
    mutationFn: async () => {
      const current = queryClient.getQueryData<Message[]>(key) ?? []
      const before = current[0]?.createdAt
      if (!before) return false
      const { data } = await api.get<Message[]>(`${base(householdId)}/${conversationId}/messages`, {
        params: { before, limit: PAGE },
      })
      queryClient.setQueryData<Message[]>(key, (list = []) => [...data, ...list])
      return data.length === PAGE
    },
  })
}

export function useSendMessage(householdId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const me = useAuthStore((state) => state.user)
  const key = chatKeys.messages(householdId, conversationId)

  return useMutation({
    mutationFn: async (body: string) =>
      (await api.post<Message>(`${base(householdId)}/${conversationId}/messages`, { body })).data,
    // Show the message right away with a temporary id; swap it for the real one after.
    onMutate: async (body) => {
      const tempId = 'temp-' + crypto.randomUUID()
      queryClient.setQueryData<Message[]>(key, (list = []) => [
        ...list,
        {
          id: tempId,
          conversationId,
          senderId: me?.id ?? null,
          body,
          editedAt: null,
          deletedAt: null,
          createdAt: new Date().toISOString(),
        },
      ])
      return { tempId }
    },
    onSuccess: (message, _body, context) =>
      queryClient.setQueryData<Message[]>(key, (list = []) => {
        const withoutTemp = list.filter((m) => m.id !== context?.tempId)
        // The socket may have delivered it already
        return withoutTemp.some((m) => m.id === message.id) ? withoutTemp : [...withoutTemp, message]
      }),
    onError: (_e, _body, context) =>
      queryClient.setQueryData<Message[]>(key, (list = []) => list.filter((m) => m.id !== context?.tempId)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations(householdId), exact: true }),
  })
}

export function useDeleteMessage(householdId: string, conversationId: string) {
  const queryClient = useQueryClient()
  const key = chatKeys.messages(householdId, conversationId)
  return useMutation({
    mutationFn: async (message: Message) => {
      await api.delete(`${base(householdId)}/${conversationId}/messages/${message.id}`)
    },
    onSuccess: (_d, message) =>
      queryClient.setQueryData<Message[]>(key, (list = []) =>
        list.map((m) => (m.id === message.id ? { ...m, deletedAt: new Date().toISOString(), body: '' } : m)),
      ),
  })
}

export function useMarkRead(householdId: string, conversationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      await api.post(`${base(householdId)}/${conversationId}/read`)
    },
    onSuccess: () =>
      queryClient.setQueryData<Conversation[]>(chatKeys.conversations(householdId), (list) =>
        list?.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      ),
  })
}

export function useStartDirect(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) =>
      (await api.post<{ id: string }>(`${base(householdId)}/direct`, { userId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.conversations(householdId), exact: true }),
  })
}
