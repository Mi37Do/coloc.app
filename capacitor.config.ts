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
    // Edge-to-edge: the web view draws under the system bars and Capacitor injects
    // --safe-area-inset-* CSS variables (see src/assets/main.css).
    SystemBars: {
      insetsHandling: 'css',
      // The page already sets viewport-fit=cover; telling Capacitor up front avoids a layout jump
      initialViewportFitValueHint: 'cover',
    },
  },
}

export default config
