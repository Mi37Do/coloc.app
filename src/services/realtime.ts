import { useEffect } from 'react'
import { io, type Socket } from 'socket.io-client'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { create } from 'zustand'
import { api } from './api'
import { chatKeys } from './chat'
import { notificationKeys } from './notifications'
import { useAuthStore } from '@/stores'
import type { AppNotification, Message } from '@/types/api'

let socket: Socket | null = null

/** The shared socket, or null when signed out. */
export const getSocket = () => socket

// Who is typing where: conversationId -> userId -> expiry timestamp
type TypingState = {
  typing: Record<string, Record<string, number>>
  setTyping: (conversationId: string, userId: string) => void
  prune: () => void
}

export const useTypingStore = create<TypingState>()((set) => ({
  typing: {},
  setTyping: (conversationId, userId) =>
    set((state) => ({
      typing: {
        ...state.typing,
        [conversationId]: { ...state.typing[conversationId], [userId]: Date.now() + 4000 },
      },
    })),
  prune: () =>
    set((state) => {
      const now = Date.now()
      const typing: TypingState['typing'] = {}
      for (const [cid, users] of Object.entries(state.typing)) {
        const alive = Object.fromEntries(Object.entries(users).filter(([, until]) => until > now))
        if (Object.keys(alive).length) typing[cid] = alive
      }
      return { typing }
    }),
}))

/** Tells the others you're typing; the API ignores repeats within a short window. */
export function emitTyping(conversationId: string) {
  socket?.emit('chat:typing', { conversationId })
}

/**
 * Connects the socket while signed in and keeps the query cache in sync:
 * chat messages, typing, and notifications arrive live. Mount once (AppLayout).
 */
export function useRealtime() {
  const token = useAuthStore((state) => state.token)
  const householdId = useAuthStore((state) => state.householdId)
  const meId = useAuthStore((state) => state.user?.id)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!token) return
    const url = String(api.defaults.baseURL ?? 'http://localhost:3000')
    const s = io(url, { auth: { token }, transports: ['websocket'] })
    socket = s

    const upsert = (message: Message) => {
      if (!householdId) return
      const key = chatKeys.messages(householdId, message.conversationId)
      queryClient.setQueryData<Message[]>(key, (list) => {
        if (!list) return list // not open; it'll load fresh
        const i = list.findIndex((m) => m.id === message.id)
        if (i === -1) return [...list, message]
        const next = [...list]
        next[i] = message
        return next
      })
      queryClient.invalidateQueries({ queryKey: chatKeys.conversations(householdId), exact: true })
    }

    s.on('chat:message', upsert)
    s.on('chat:message:updated', upsert)
    s.on('chat:typing', ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      if (userId !== meId) useTypingStore.getState().setTyping(conversationId, userId)
    })
    s.on('notification', (n: AppNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      // Something changed in the household: refresh what the notification is about.
      if (n.householdId) {
        const area = n.type.startsWith('chore')
          ? 'chores'
          : n.type.startsWith('bill')
            ? 'bills'
            : n.type.startsWith('event')
              ? 'events'
              : null
        if (area) queryClient.invalidateQueries({ queryKey: ['households', n.householdId, area] })
        if (n.type === 'member_joined') queryClient.invalidateQueries({ queryKey: ['households'] })
      }
      toast(n.title, { description: n.body ?? undefined })
    })

    const prune = setInterval(() => useTypingStore.getState().prune(), 1000)
    return () => {
      clearInterval(prune)
      s.disconnect()
      if (socket === s) socket = null
    }
  }, [token, householdId, meId, queryClient])
}
