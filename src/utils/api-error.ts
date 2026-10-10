import { isAxiosError } from 'axios'

/** The API's own message when there is one (Nest sends a string or a list), else the fallback */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  if (!error.response) return 'Could not reach the server'
  const message = (error.response.data as { message?: string | string[] } | undefined)?.message
  if (Array.isArray(message)) return message[0] ?? fallback
  return message || fallback
}

export function apiStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined
}
