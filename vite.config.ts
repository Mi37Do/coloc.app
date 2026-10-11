import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

export default defineConfig(({ mode }) => {
  // Dev only: set VITE_DEV_PROXY (and VITE_API_URL=/api) to route API calls through this dev server.
  // The browser then only talks to localhost, which helps when it can't reach the API host directly.
  const proxyTarget = loadEnv(mode, process.cwd(), 'VITE_').VITE_DEV_PROXY

  return {
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
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              ws: true, // socket.io
              rewrite: (path) => path.replace(/^\/api/, ''),
              // A socket cut mid-write (page reload, hot update reconnect) is expected; log anything else
              configure: (proxy) => {
                const quiet = new Set(['ECONNABORTED', 'ECONNRESET', 'EPIPE'])
                proxy.removeAllListeners('error')
                proxy.on('error', (err: NodeJS.ErrnoException) => {
                  if (!quiet.has(err.code ?? '')) console.error('[api proxy]', err.message)
                })
              },
            },
          },
        }
      : undefined,
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  }
})
