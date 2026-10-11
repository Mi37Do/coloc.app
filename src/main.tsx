import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { setupNative } from './lib/native'
import './assets/main.css'

setupNative()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
