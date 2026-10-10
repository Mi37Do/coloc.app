import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { hideSplash, initNative } from '@/lib/native'
import { router } from '@/router'
import './assets/main.css'

initNative(router)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The router's first screen is ready on the next frame; until then the native splash stays up.
requestAnimationFrame(() => requestAnimationFrame(hideSplash))
