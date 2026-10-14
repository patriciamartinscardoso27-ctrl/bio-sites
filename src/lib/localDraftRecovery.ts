import type {Bio} from '../types/biosite'
import type {NeonBackup} from './neonBackups'
import {sameBio} from './biositesApi'
// Only restore unsaved work against its known base; never auto-save on opening.
export function findRecoverableDraft(copies:NeonBackup[],id:string,latest:Bio){
 return copies.filter(c=>!c.archived&&c.content.id===id&&c.saved?.id===id&&!sameBio(c.content,c.saved.content)&&!sameBio(c.content,latest))
  .sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''))[0]
}
