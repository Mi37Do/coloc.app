import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'

/** Native-only setup (Android): back button and splash. Safe to call in the browser. */
export function setupNative() {
  if (!Capacitor.isNativePlatform()) return
  document.documentElement.classList.add('native')

  // Hardware back button: go back in the app, leave it from the first screen
  App.addListener('backButton', ({ canGoBack }) => {
    if (canGoBack) window.history.back()
    else App.minimizeApp()
  })

  SplashScreen.hide().catch(() => {})
}
