import type { Bio } from '../types/biosite'

export interface BioSiteSummary {
  id: string; slug: string; status: 'published' | 'unpublished'; lockVersion: string;
  draftRevision: string; publishedRevision: string | null; createdAt: string; updatedAt: string;
  publishedAt: string | null; name: string; category: string; style: string;
  logo?:string; phone?:string; telephone?:string; email?:string; responsible?:string; address?:string; city?:string; templateId?:string; generated?:boolean; layoutPreset?:Bio['layoutPreset'];
}
export interface SavedBioSite extends Omit<BioSiteSummary, 'name' | 'category' | 'style'> { templateId: string; content: Bio }
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { 'Content-Type':'application/json' }, credentials:'same-origin', cache:'no-store', signal:AbortSignal.timeout(25000) })
  const result = await response.json()
  if(response.status===401)window.dispatchEvent(new Event('biosite-session-expired'))
  if (!response.ok) throw new Error(result.error || 'Não foi possível acessar o servidor.')
  return result as T
}
export const biositesApi = {
  async list(ownerId?:string): Promise<BioSiteSummary[]> {
    const items: BioSiteSummary[]=[]
    let cursor: string | null = null
    do {
      const params=new URLSearchParams();if(cursor)params.set('cursor',cursor);if(ownerId)params.set('ownerId',ownerId)
      const page: {items:BioSiteSummary[];nextCursor:string|null} = await request(`/api/biosites${params.size?'?'+params.toString():''}`)
      items.push(...page.items);cursor=page.nextCursor
    } while(cursor)
    return items
  },
  get: (id:string) => request<SavedBioSite>(`/api/biosites/${encodeURIComponent(id)}`),
  create: (content:Bio) => request<SavedBioSite>('/api/biosites',{method:'POST',body:JSON.stringify({content})}),
  save: (content:Bio,lockVersion:string) => request<SavedBioSite>(`/api/biosites/${encodeURIComponent(content.id)}/draft`,{method:'PUT',body:JSON.stringify({content,lockVersion})}),
  publicationConfig:()=>request<{origin:string;writesEnabled:boolean}>('/api/publication/config'),
  publish:(record:SavedBioSite)=>request<SavedBioSite>(`/api/biosites/${encodeURIComponent(record.id)}/publish`,{method:'POST',body:JSON.stringify({lockVersion:record.lockVersion,draftRevision:record.draftRevision})}),
  unpublish:(record:SavedBioSite)=>request<SavedBioSite>(`/api/biosites/${encodeURIComponent(record.id)}/unpublish`,{method:'POST',body:JSON.stringify({lockVersion:record.lockVersion})}),
}
export function summarize(saved: SavedBioSite): BioSiteSummary {
  const {content,templateId: _templateId,...metadata}=saved
  return {...metadata,layoutPreset:content.layoutPreset,...(content.composition?{generated:true}:{}),name:content.name,category:content.category,style:content.style,logo:content.logo,phone:content.phone,telephone:content.telephone,email:content.email,responsible:content.client?.responsible,address:content.address,city:content.client?.city||content.address,templateId:_templateId}
}
export function sameBio(a: Bio, b: Bio): boolean {
  const canonical=(value:unknown):unknown=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'
    ? Object.fromEntries(Object.entries(value).sort(([left],[right])=>left.localeCompare(right)).filter(([,v])=>v!==undefined).map(([k,v])=>[k,canonical(v)])) : value
  // JSONB may reorder object keys, but array order remains meaningful.
  return JSON.stringify(canonical(a))===JSON.stringify(canonical(b))
}
