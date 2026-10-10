import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'coloc.app',
  appName: 'coloc',
  // Vite's build output
  webDir: 'dist',
  backgroundColor: '#D8ECC2',
  server: {
    // Serve the app from https://localhost so cookies/storage behave like a real site
    androidScheme: 'https',
    // The dev API runs over plain http on your network. Remove for a production https API.
    cleartext: true,
  },
  android: {
    // The page is https://localhost but the dev API is http: allow it. Remove both for a production https API.
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      // The app hides it itself once the first screen is ready (see src/lib/native.ts)
      launchAutoHide: false,
      backgroundColor: '#D8ECC2',
      showSpinner: false,
    },
    Keyboard: {
      // Shrink the page above the keyboard so the chat box and sheets stay visible
      resize: 'body',
    },
    StatusBar: {
      backgroundColor: '#D8ECC2',
      style: 'LIGHT',
    },
  },
}

export default config
