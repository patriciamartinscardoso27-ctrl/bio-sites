import { registerHooks } from 'node:module'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Node 24 strips TypeScript types. Resolve the existing extensionless data imports
// without copying or changing the frontend's source of truth for the 21 models.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
      const url = new URL(specifier + '.ts', context.parentURL)
      if (existsSync(fileURLToPath(url))) return next(url.href, context)
    }
    return next(specifier, context)
  },
})
const { templates, categories, labels } = await import('../src/data/templates.ts')
const { actionTypes, genericIcons } = await import('../src/lib/actionLinks.ts')
export const catalog = {
  models: templates.map(t => ({ id: t.id, style: t.bio.style })),
  categories: categories.map(c => c.label.toLowerCase()),
  sectionKinds: Object.keys(labels),
  actionKinds: actionTypes.map(a => a.kind),
  icons: genericIcons.map(i => i.id),
}
