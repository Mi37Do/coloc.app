import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    react(),
    // Makes components re-render when a signal they read changes, like Vue refs.
    babel({ include: /\.[jt]sx$/, plugins: ['module:@preact/signals-react-transform'] }),
    tailwindcss(),
  ],
  // The transform injects this import, so Vite can't discover it by scanning the source.
  optimizeDeps: { include: ['@preact/signals-react/runtime'] },
  resolve: {
    // Same "@" alias as a Vue project: import { x } from '@/lib/x'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
