import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Capacitor } from '@capacitor/core'
import { PushNotifications, type PushNotificationSchema } from '@capacitor/push-notifications'
import { api } from './api'
import { notificationKeys } from './notifications'
import { useAuthStore } from '@/stores'
import type { NotificationType } from '@/types/api'

/** The FCM device token of this phone, kept so logout can unregister it */
let deviceToken: string | null = null

/** Where tapping a notification takes you; the API can override it with data.url */
function routeFor(data: PushNotificationSchema['data']): string {
  if (typeof data?.url === 'string') return data.url
  const type = data?.type as NotificationType | undefined
  switch (type) {
    case 'bill_created':
    case 'bill_due':
      return '/bills'
    case 'event_created':
    case 'event_cancelled':
    case 'event_soon':
      return data?.eventId ? `/events/${data.eventId}` : '/events'
    case 'household_invite':
    case 'member_joined':
      return '/household'
    case 'chore_assigned':
    case 'chore_due':
      return '/'
    default:
      return '/notifications'
  }
}

/**
 * Native Android push (FCM). Asks for permission, sends the device token to the API,
 * refreshes the in-app notifications when one arrives, and opens the right screen on tap.
 * No-op in the browser. Mount once, inside the signed-in layout.
 */
export function usePushNotifications() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const signedIn = useAuthStore((state) => !!state.token)

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !signedIn) return
    let cancelled = false

    const listeners = [
      PushNotifications.addListener('registration', ({ value }) => {
        deviceToken = value
        api.post('/devices', { token: value, platform: Capacitor.getPlatform() }).catch(() => {})
      }),
      PushNotifications.addListener('registrationError', (error) => {
        console.warn('Push registration failed', error)
      }),
      // Shown by Android itself (presentationOptions); keep the bell and lists fresh
      PushNotifications.addListener('pushNotificationReceived', () => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      }),
      PushNotifications.addListener('pushNotificationActionPerformed', ({ notification }) => {
        queryClient.invalidateQueries({ queryKey: notificationKeys.all })
        navigate(routeFor(notification.data))
      }),
    ]

    ;(async () => {
      // Must match default_notification_channel_id in AndroidManifest.xml
      await PushNotifications.createChannel({
        id: 'default',
        name: 'Household updates',
        description: 'Chores, bills, events and invites',
        importance: 4,
        visibility: 1,
      })
      let { receive } = await PushNotifications.checkPermissions()
      if (receive === 'prompt' || receive === 'prompt-with-rationale') {
        receive = (await PushNotifications.requestPermissions()).receive
      }
      if (receive === 'granted' && !cancelled) await PushNotifications.register()
    })().catch((error) => console.warn('Push setup failed', error))

    return () => {
      cancelled = true
      listeners.forEach((listener) => listener.then((l) => l.remove()))
    }
  }, [signedIn, navigate, queryClient])
}

/** Call before clearing the session so this phone stops getting the user's pushes */
export async function unregisterPush() {
  if (!Capacitor.isNativePlatform() || !deviceToken) return
  const token = deviceToken
  deviceToken = null
  await api.delete(`/devices/${encodeURIComponent(token)}`).catch(() => {})
  await PushNotifications.unregister().catch(() => {})
}
