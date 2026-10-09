import type {Bio,Section,Highlight,Action} from '../types/biosite'
export function sectionAction(bio:Bio,section:Section):Action {
 return section.action||{id:section.id+'-action',kind:section.kind==='location'?'location':'whatsapp',label:section.ctaLabel||section.title,message:section.kind==='promotion'?section.title:'Olá! Gostaria de mais informações.',...(section.kind==='location'?{source:'custom' as const,url:section.content?.mapsUrl||bio.mapsUrl||'',mode:'url' as const}: {})}
}
export function collectionAction(bio:Bio,highlight:Highlight):Action {
 const products=bio.sections.find(s=>s.kind==='products'&&s.enabled)
 return highlight.action||{id:highlight.id+'-action',kind:'custom',label:highlight.label,message:'',...(products?{destination:'section' as const,sectionId:products.id}:{kind:'whatsapp',message:'Olá! Gostaria de conhecer '+highlight.label})}
}
