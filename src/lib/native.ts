import { App } from '@capacitor/app'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Clipboard } from '@capacitor/clipboard'
import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { Keyboard } from '@capacitor/keyboard'
import { Network } from '@capacitor/network'
import { Share } from '@capacitor/share'
import { SplashScreen } from '@capacitor/splash-screen'
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

/** Sets up system bars, keyboard, Android back button and deep links. Call once at startup. */
export function initNative(router: DataRouter) {
  if (!isNative) return

  // Edge-to-edge: the page draws under the bars, so only the icon colours are set here.
  // Status bar sits on the mint header (dark icons); the gesture bar sits on the black tab bar (light icons).
  void SystemBars.setStyle({ style: SystemBarsStyle.Light, bar: SystemBarType.StatusBar }).catch(() => {})
  void SystemBars.setStyle({ style: SystemBarsStyle.Dark, bar: SystemBarType.NavigationBar }).catch(() => {})
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

/** Copies text. Uses the native clipboard in the app, the browser's elsewhere. Resolves false on failure. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (isNative) await Clipboard.write({ string: text })
    else await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** Opens the system share sheet. Returns false when sharing isn't possible (so callers can fall back to copying). */
export async function shareContent(options: { title: string; text: string; url?: string }): Promise<boolean> {
  try {
    if (isNative) {
      await Share.share({ ...options, dialogTitle: options.title })
      return true
    }
    if (!navigator.share) return false
    await navigator.share(options)
    return true
  } catch (error) {
    // Closing the sheet counts as handled; only "not supported" should trigger the fallback
    return error instanceof Error && (error.name === 'AbortError' || /cancel/i.test(error.message))
  }
}

/**
 * Photos from the camera or gallery in the app, as Files ready to upload.
 * Returns null outside the app (use a file input there) and [] when the user cancels.
 */
export async function pickPhotos(): Promise<File[] | null> {
  if (!isNative) return null
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Uri,
      quality: 80,
      width: 2000, // keeps uploads well under the API's 10 MB limit
      correctOrientation: true,
      promptLabelHeader: 'Add a photo',
    })
    if (!photo.webPath) return []
    const blob = await (await fetch(photo.webPath)).blob()
    const type = blob.type || `image/${photo.format || 'jpeg'}`
    return [new File([blob], `photo-${Date.now()}.${photo.format || 'jpeg'}`, { type })]
  } catch {
    return [] // cancelled or permission denied
  }
}

/** Reports connectivity (native plugin in the app, the browser's online/offline events elsewhere) */
export function watchNetwork(onChange: (online: boolean) => void): () => void {
  if (!isNative) {
    const up = () => onChange(true)
    const down = () => onChange(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    onChange(navigator.onLine)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }
  let handle: { remove: () => Promise<void> } | undefined
  let stopped = false
  void Network.getStatus().then((s) => !stopped && onChange(s.connected))
  void Network.addListener('networkStatusChange', (s) => onChange(s.connected)).then((h) => {
    if (stopped) void h.remove()
    else handle = h
  })
  return () => {
    stopped = true
    void handle?.remove()
  }
}
