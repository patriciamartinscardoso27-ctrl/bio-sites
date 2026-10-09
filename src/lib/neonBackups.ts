import type { Bio } from '../types/biosite'
import type { SavedBioSite } from './biositesApi'

const prefix = 'vitrine-neon-backup-v1:'
export interface NeonBackup { content: Bio; saved?: SavedBioSite }
export function keepNeonBackup(content: Bio, saved?: SavedBioSite) {
  // Separate keys: never overwrite/import the legacy drafts key or other sites.
  localStorage.setItem(prefix + content.id, JSON.stringify({content,saved}))
}
export function readNeonBackups(): NeonBackup[] {
  const backups: NeonBackup[]=[]
  for(let i=0;i<localStorage.length;i++) {
    const key=localStorage.key(i)
    if(!key?.startsWith(prefix)) continue
    try {
      const value=JSON.parse(localStorage.getItem(key)||'null')
      if(value?.content && typeof value.content.id==='string' && typeof value.content.name==='string'
        && ['sections','actions','products','services','photos','highlights','benefits'].every(k=>Array.isArray(value.content[k]))) backups.push(value)
    } catch { /* Keep unreadable backups intact. */ }
  }
  return backups
}
