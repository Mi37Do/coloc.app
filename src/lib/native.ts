import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { DataRouter } from 'react-router'

/** True inside the Android/iOS app, false in a browser */
export const isNative = Capacitor.isNativePlatform()

/**
 * Turns an incoming link into an in-app path, or null if it isn't one of ours.
 *   coloc://join/abc123            -> /join/abc123
 *   https://coloc.example/join/abc -> /join/abc
 */
export function deepLinkToPath(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  // For custom schemes, "join" is parsed as the host: coloc://join/abc -> host "join", path "/abc"
  const path = parsed.protocol.startsWith('http') ? parsed.pathname : `/${parsed.host}${parsed.pathname}`
  const match = path.match(/^\/join\/([A-Za-z0-9_-]{8,64})\/?$/)
  return match ? `/join/${match[1]}` : null
}

/** Sets up the status bar, keyboard, Android back button and deep links. Call once at startup. */
export function initNative(router: DataRouter) {
  if (!isNative) return

  void StatusBar.setStyle({ style: Style.Light }).catch(() => {}) // dark icons on the mint header
  if (Capacitor.getPlatform() === 'android') void StatusBar.setBackgroundColor({ color: '#D8ECC2' }).catch(() => {})
  void Keyboard.setAccessoryBarVisible({ isVisible: false }).catch(() => {})

  // Android back: go back a screen; leave the app only from the first screens
  void App.addListener('backButton', () => {
    const { pathname } = router.state.location
    if (pathname === '/' || pathname === '/login') void App.exitApp()
    else void router.navigate(-1)
  })

  // Opened from an invite link
  void App.addListener('appUrlOpen', ({ url }) => {
    const path = deepLinkToPath(url)
    if (path) void router.navigate(path)
  })
}

/** Hide the splash screen once the first screen has rendered */
export function hideSplash() {
  if (isNative) void SplashScreen.hide({ fadeOutDuration: 200 }).catch(() => {})
}

/** Short tick for taps such as ticking a chore */
export function tap() {
  if (isNative) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {})
}

/** Success buzz, e.g. a chore completed */
export function success() {
  if (isNative) void Haptics.notification({ type: NotificationType.Success }).catch(() => {})
}
