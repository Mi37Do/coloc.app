import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { useAuthStore } from '@/stores'
import type { EventInput, HouseholdEvent, Media, RsvpResponse } from '@/types/api'

const base = (householdId: string) => `/households/${householdId}/events`

export const eventKeys = {
  all: (householdId: string) => ['households', householdId, 'events'] as const,
  range: (householdId: string, from: string, to?: string) =>
    ['households', householdId, 'events', 'range', from, to ?? ''] as const,
  one: (householdId: string, id: string) => ['households', householdId, 'events', id] as const,
  photos: (householdId: string, id: string) => ['households', householdId, 'events', id, 'photos'] as const,
}

/** Events overlapping [from, to]. Without `to`: everything from `from` on. */
export function useEvents(householdId: string | undefined, from: Date, to?: Date) {
  const fromIso = from.toISOString()
  const toIso = to?.toISOString()
  return useQuery({
    queryKey: eventKeys.range(householdId ?? '', fromIso, toIso),
    queryFn: async () =>
      (await api.get<HouseholdEvent[]>(base(householdId!), { params: { from: fromIso, ...(toIso && { to: toIso }) } })).data,
    enabled: !!householdId,
  })
}

export function useEvent(householdId: string, id: string) {
  return useQuery({
    queryKey: eventKeys.one(householdId, id),
    queryFn: async () => (await api.get<HouseholdEvent>(`${base(householdId)}/${id}`)).data,
  })
}

const useInvalidateEvents = (householdId: string) => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: eventKeys.all(householdId) })
}

export function useCreateEvent(householdId: string) {
  const invalidate = useInvalidateEvents(householdId)
  return useMutation({
    mutationFn: async (input: EventInput) => (await api.post<HouseholdEvent>(base(householdId), input)).data,
    onSuccess: invalidate,
  })
}

export function useUpdateEvent(householdId: string, id: string) {
  const invalidate = useInvalidateEvents(householdId)
  return useMutation({
    mutationFn: async (input: Partial<EventInput>) =>
      (await api.patch<HouseholdEvent>(`${base(householdId)}/${id}`, input)).data,
    onSuccess: invalidate,
  })
}

export function useSetCancelled(householdId: string, id: string) {
  const invalidate = useInvalidateEvents(householdId)
  return useMutation({
    mutationFn: async (cancelled: boolean) => {
      if (cancelled) await api.post(`${base(householdId)}/${id}/cancel`)
      else await api.delete(`${base(householdId)}/${id}/cancel`)
    },
    onSuccess: invalidate,
  })
}

export function useDeleteEvent(householdId: string) {
  const invalidate = useInvalidateEvents(householdId)
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${base(householdId)}/${id}`)
    },
    onSuccess: invalidate,
  })
}

/** RSVP, updated optimistically on the open event */
export function useRsvp(householdId: string, id: string) {
  const queryClient = useQueryClient()
  const me = useAuthStore((state) => state.user)
  const key = eventKeys.one(householdId, id)
  return useMutation({
    mutationFn: async (response: RsvpResponse) => {
      await api.put(`${base(householdId)}/${id}/rsvp`, { response })
    },
    onMutate: async (response) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<HouseholdEvent>(key)
      queryClient.setQueryData<HouseholdEvent>(key, (event) => {
        if (!event || !me) return event
        const others = event.participants.filter((p) => p.userId !== me.id)
        return {
          ...event,
          participants: [
            ...others,
            { id: 'temp', userId: me.id, response, respondedAt: new Date().toISOString(), user: me },
          ],
        }
      })
      return { previous }
    },
    onError: (_e, _r, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: eventKeys.all(householdId) }),
  })
}

export function useEventPhotos(householdId: string, id: string) {
  return useQuery({
    queryKey: eventKeys.photos(householdId, id),
    queryFn: async () => (await api.get<Media[]>(`${base(householdId)}/${id}/photos`)).data,
  })
}

export function useUploadPhotos(householdId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return (await api.post<Media[]>(`${base(householdId)}/${id}/photos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.photos(householdId, id) }),
  })
}

export function useDeletePhoto(householdId: string, eventId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) => {
      await api.delete(`/households/${householdId}/media/${mediaId}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: eventKeys.photos(householdId, eventId) }),
  })
}

/**
 * Media files need the auth header, so <img src> can't load them directly.
 * Fetch the bytes with the API client and expose a temporary object URL.
 */
export function useMediaUrl(householdId: string, mediaId: string) {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    let objectUrl: string | undefined
    let cancelled = false
    api
      .get<Blob>(`/households/${householdId}/media/${mediaId}/file`, { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(data)
        setUrl(objectUrl)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [householdId, mediaId])
  return url
}
