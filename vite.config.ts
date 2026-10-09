import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { createApi, createAdminPageGuard, localRequest, canonicalLocalPage } from './server/api.mjs'

// https://vite.dev/config/
export default defineConfig({
  server: { host: '127.0.0.1', strictPort: true, fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/server/**', '**/scripts/**', '**/migrations/**'] } },
  preview: { host: '127.0.0.1' },
  plugins: [react(), tailwindcss(), {
    name: 'biosite-server-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!localRequest(req)) { res.statusCode = 403; res.end('Acesso local somente.'); return }
        next()
      })
      server.middlewares.use(createApi())
      server.middlewares.use(canonicalLocalPage)
      server.middlewares.use(createAdminPageGuard())
    },
    configurePreviewServer(server) { server.middlewares.use(createApi());server.middlewares.use(canonicalLocalPage);server.middlewares.use(createAdminPageGuard()) },
  }],
})

