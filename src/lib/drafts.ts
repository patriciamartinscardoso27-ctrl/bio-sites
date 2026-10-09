import type { Bio } from '../types/biosite'

const key = 'vitrine-premium-drafts-v1'
export function loadDrafts(): Bio[] | undefined {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(key) || 'null')
    if (Array.isArray(data) && data.length && data.every(b => b && typeof b.id === 'string' && typeof b.name === 'string' && Array.isArray(b.sections) && Array.isArray(b.actions) && Array.isArray(b.products) && Array.isArray(b.services) && Array.isArray(b.photos))) return data as Bio[]
  } catch { /* A missing or invalid local draft must not prevent opening the editor. */ }
  return undefined
}
export function saveDrafts(bios: Bio[]) { localStorage.setItem(key, JSON.stringify(bios)) }
