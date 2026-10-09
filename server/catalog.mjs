import './source-modules.mjs'
const { templates, categories, labels } = await import('../src/data/templates.ts')
const { actionTypes, genericIcons } = await import('../src/lib/actionLinks.ts')
export const catalog = {
  models: templates.map(t => ({ id: t.id, style: t.bio.style })),
  categories: categories.map(c => c.label.toLowerCase()),
  sectionKinds: Object.keys(labels),
  actionKinds: actionTypes.map(a => a.kind),
  icons: genericIcons.map(i => i.id),
}
