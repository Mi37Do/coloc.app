/// <reference types="@capacitor-community/safe-area" />
/// <reference types="@capacitor/push-notifications" />
/// <reference types="@capacitor/splash-screen" />
/// <reference types="@capacitor/keyboard" />
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // Must match package_name in google-services.json
  appId: 'com.coloc.app',
  appName: 'coloc',
  webDir: 'dist',
  android: {
    // Lets the dev build reach an http:// API (e.g. http://10.0.2.2:3000 from the emulator)
    allowMixedContent: true,
  },
  plugins: {
    // @capacitor-community/safe-area owns insets; the app keeps using env(safe-area-inset-*)
    SystemBars: { insetsHandling: 'disable' },
    SafeArea: { statusBarStyle: 'LIGHT', navigationBarStyle: 'DARK' },
    // resizeOnFullScreen must stay off, it fights the safe-area plugin
    Keyboard: { resize: 'native' },
    SplashScreen: { launchShowDuration: 0, backgroundColor: '#D8ECC2' },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
}

export default config
