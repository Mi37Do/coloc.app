import { useEffect, useState } from 'react'
import { api } from './api'

// API files (GIFs, chat photos, profile pictures) need the auth header, so <img src> can't load
// them directly. The same image shows up many times (avatars especially), so each URL is
// fetched once and kept as an object URL for the session.
const cache = new Map<string, Promise<string>>()

function load(path: string) {
  let entry = cache.get(path)
  if (!entry) {
    entry = api.get<Blob>(path, { responseType: 'blob' }).then(({ data }) => URL.createObjectURL(data))
    entry.catch(() => cache.delete(path)) // retry next time
    cache.set(path, entry)
  }
  return entry
}

/** Drop cached copies whose path contains `match` (e.g. a removed GIF's id) */
export function forgetFiles(match: string) {
  for (const [path, entry] of cache) {
    if (!path.includes(match)) continue
    cache.delete(path)
    void entry.then(URL.revokeObjectURL).catch(() => {})
  }
}

/** Object URL for an API file path, or undefined while loading / if it's gone */
export function useFileUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string>()
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    if (!path) {
      setUrl(undefined)
      return
    }
    let active = true
    setFailed(false)
    load(path).then(
      (u) => active && setUrl(u),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [path])
  return { url, failed }
}

export const mediaPath = (householdId: string, mediaId: string) => `/households/${householdId}/media/${mediaId}/file`

export const chatImagePath = (householdId: string, conversationId: string, mediaId: string) =>
  `/households/${householdId}/conversations/${conversationId}/images/${mediaId}/file`

/** The version query makes a new picture a new URL, so the cache never shows a stale one */
export const avatarPath = (userId: string, updatedAt: string) => `/users/${userId}/avatar?v=${encodeURIComponent(updatedAt)}`
