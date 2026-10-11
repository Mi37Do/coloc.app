import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import { forgetFiles, mediaPath, useFileUrl } from './files'
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
      forgetFiles(mediaId)
      return queryClient.invalidateQueries({ queryKey: gifKeys.library(householdId) })
    },
  })
}

/** Object URL for a household media file (GIFs) */
export function useCachedMediaUrl(householdId: string, mediaId: string | null | undefined) {
  return useFileUrl(mediaId ? mediaPath(householdId, mediaId) : null)
}
