import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { Media } from '@/types/api'

export const gifKeys = {
  library: (householdId: string) => ['households', householdId, 'gifs'] as const,
}

/** The household's shared GIF library, newest first */
export function useGifLibrary(householdId: string, enabled = true) {
  return useQuery({
    queryKey: gifKeys.library(householdId),
    queryFn: async () => (await api.get<Media[]>(`/households/${householdId}/gifs`)).data,
    enabled,
  })
}

/** Adds GIFs from the device to the library (up to 10, 10 MB each) */
export function useAddGifs(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (files: File[]) => {
      const form = new FormData()
      for (const f of files) form.append('files', f)
      return (
        await api.post<Media[]>(`/households/${householdId}/gifs`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: gifKeys.library(householdId) }),
  })
}

/** Uploader or admin. Messages that used it show "GIF removed". */
export function useRemoveGif(householdId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (mediaId: string) => {
      await api.delete(`/households/${householdId}/media/${mediaId}`)
    },
    onSuccess: (_d, mediaId) => {
      forgetMedia(mediaId)
      return queryClient.invalidateQueries({ queryKey: gifKeys.library(householdId) })
    },
  })
}

// Media files need the auth header, so <img src> can't load them directly. The same GIF shows
// up many times (picker + every message using it), so each file is fetched once and kept as an
// object URL for the session.
const cache = new Map<string, Promise<string>>()

function loadMedia(householdId: string, mediaId: string) {
  let entry = cache.get(mediaId)
  if (!entry) {
    entry = api
      .get<Blob>(`/households/${householdId}/media/${mediaId}/file`, { responseType: 'blob' })
      .then(({ data }) => URL.createObjectURL(data))
    entry.catch(() => cache.delete(mediaId)) // retry next time
    cache.set(mediaId, entry)
  }
  return entry
}

function forgetMedia(mediaId: string) {
  const entry = cache.get(mediaId)
  cache.delete(mediaId)
  void entry?.then(URL.revokeObjectURL).catch(() => {})
}

/** Object URL for a media file, or undefined while loading / if it's gone */
export function useCachedMediaUrl(householdId: string, mediaId: string | null | undefined) {
  const [url, setUrl] = useState<string>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!mediaId) return
    let active = true
    setFailed(false)
    loadMedia(householdId, mediaId).then(
      (u) => active && setUrl(u),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [householdId, mediaId])
  return { url, failed }
}
