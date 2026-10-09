import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Shared src modules run as TypeScript locally and emitted JavaScript on Vercel.
// Resolve only relative files inside src; never intercept packages or other paths.
registerHooks({
  resolve(specifier, context, next) {
    if (!specifier.startsWith('.') || !context.parentURL?.startsWith('file:')) return next(specifier, context)
    const url = new URL(specifier, context.parentURL)
    if (!url.pathname.includes('/src/') || url.search || url.hash) return next(specifier, context)
    const pathname = fileURLToPath(url)
    if (existsSync(pathname)) return next(specifier, context)
    const candidates = /\.ts$/.test(pathname)
      ? [pathname.replace(/\.ts$/, '.js')]
      : /\.[^/\\]+$/.test(pathname) ? [] : [pathname + '.js', pathname + '.ts']
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        const resolved = new URL(url)
        resolved.pathname = resolved.pathname.replace(/\.ts$/, '.js')
        if (!/\.ts$/.test(pathname)) resolved.pathname += candidate.endsWith('.js') ? '.js' : '.ts'
        return next(resolved.href, context)
      }
    }
    return next(specifier, context)
  },
})
