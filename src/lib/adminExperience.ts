import { templates,readyTemplates } from '../data/templates'
import type { BioSiteSummary } from './biositesApi'
export const clientStatus=(site:Pick<BioSiteSummary,'status'|'publishedRevision'>)=>site.status==='published'?'Publicado':site.publishedRevision?'Despublicado':'Rascunho'
export const modelName=(site:Pick<BioSiteSummary,'style'>&{generated?:boolean;layoutPreset?:BioSiteSummary['layoutPreset']})=>site.layoutPreset?readyTemplates.find(t=>t.id===site.layoutPreset)?.label||'Modelo pronto':site.generated?'Composição inteligente':templates.find(t=>t.bio.style===site.style)?.label||'Personalizado'
export const dateLabel=(value:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value))
export const recentClients=(sites:BioSiteSummary[])=>[...sites].sort((a,b)=>Date.parse(b.updatedAt)-Date.parse(a.updatedAt))
