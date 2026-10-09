import type {Bio,Action,Section,SectionKind,SectionContent} from '../types/biosite'
export function allActions(bio:Bio){return [...bio.actions,...bio.products.flatMap(i=>i.action?[i.action]:[]),...bio.services.flatMap(i=>i.action?[i.action]:[]),...bio.sections.flatMap(s=>[...(s.content?.actions||[]),...(s.content?.items||[]).flatMap(i=>i.action?[i.action]:[])])]}
export function linkedActions(bio:Bio,id:string){return allActions(bio).filter(a=>a.destination==='section'&&a.sectionId===id)}
export function sectionContent(bio:Bio,s:Section):SectionContent{
 if(s.content){const empty:SectionContent=s.kind==='products'||s.kind==='services'||s.block==='cards'?{items:[]}:s.kind==='actions'?{actions:[]}:s.kind==='gallery'?{photos:[]}:s.kind==='benefits'?{benefits:[]}:s.kind==='categories'?{highlights:[]}:s.kind==='hours'?{hours:''}:s.kind==='location'?{address:'',mapsUrl:''}:{};return {...empty,...s.content}}
 return s.kind==='products'?{items:bio.products}:s.kind==='services'?{items:bio.services}:s.kind==='gallery'?{photos:bio.photos}:s.kind==='benefits'?{benefits:bio.benefits}:s.kind==='categories'?{highlights:bio.highlights}:s.kind==='hours'?{hours:bio.hours}:s.kind==='location'?{address:bio.address,mapsUrl:bio.mapsUrl}:s.kind==='actions'?{actions:bio.actions}:{}
}
export function sectionBio(bio:Bio,s:Section):Bio{const content=sectionContent(bio,s);return {...bio,...(content.actions?{actions:content.actions}:{}),...(content.items?{[s.kind==='services'?'services':'products']:content.items}:{}),...(content.photos?{photos:content.photos}:{}),...(content.benefits?{benefits:content.benefits}:{}),...(content.highlights?{highlights:content.highlights}:{}),...(content.hours!==undefined?{hours:content.hours}:{}),...(content.address!==undefined?{address:content.address}:{}),...(content.mapsUrl!==undefined?{mapsUrl:content.mapsUrl}:{})}}
export function duplicateSection(bio:Bio,id:string){const original=bio.sections.find(s=>s.id===id);if(!original)return null;const copy=structuredClone({...original,content:sectionContent(bio,original)});copy.id=crypto.randomUUID();copy.content.items=copy.content.items?.map(i=>({...i,id:crypto.randomUUID(),action:i.action?{...i.action,id:crypto.randomUUID()}:undefined}));copy.content.actions=copy.content.actions?.map(a=>({...a,id:crypto.randomUUID()}));copy.content.highlights=copy.content.highlights?.map(h=>({...h,id:crypto.randomUUID()}));const index=bio.sections.findIndex(s=>s.id===id);return {copy,sections:[...bio.sections.slice(0,index+1),copy,...bio.sections.slice(index+1)]}}
export function removeSection(bio:Bio,id:string,buttons:'keep'|'remove'='keep'):Partial<Bio>{
 const section=bio.sections.find(s=>s.id===id);if(!section)return {}
 const points=(a:Action)=>a.destination==='section'&&a.sectionId===id
 const fix=(a:Action)=>points(a)?{...a,sectionId:undefined}:a
 const patch:Partial<Bio>={sections:bio.sections.filter(s=>s.id!==id).map(s=>s.content?{...s,content:{...s.content,actions:buttons==='remove'?s.content.actions?.filter(a=>!points(a)):s.content.actions?.map(fix),items:s.content.items?.map(i=>i.action&&points(i.action)?{...i,action:buttons==='remove'?undefined:fix(i.action)}:i)}}:s),actions:buttons==='remove'?bio.actions.filter(a=>!points(a)):bio.actions.map(fix)}
 for(const key of ['products','services'] as const)patch[key]=bio[key].map(i=>i.action&&points(i.action)?{...i,action:buttons==='remove'?undefined:{...i.action,sectionId:undefined}}:i)
 if(!bio.sections.some(s=>s.id!==id&&s.kind===section.kind&&!s.content)){
 if(section.kind==='products')patch.products=[]
 if(section.kind==='services')patch.services=[]
 if(section.kind==='gallery')patch.photos=[]
 if(section.kind==='benefits')patch.benefits=[]
 if(section.kind==='categories'){patch.highlights=[];patch.products=patch.products!.map(i=>({...i,categoryId:undefined}))}
 if(section.kind==='hours')patch.hours=''
 if(section.kind==='location'){patch.address='';patch.mapsUrl=''}
 if(section.kind==='actions')patch.actions=[]
 }
 return patch
}
export function setSectionContent(bio:Bio,section:Section,changes:Partial<SectionContent>):Partial<Bio>{
 const patch:Partial<Bio>={sections:bio.sections.map(s=>s.id===section.id?{...s,content:{...sectionContent(bio,s),...changes}}:s)}
 if(!section.content&&!bio.sections.some(s=>s.id!==section.id&&s.kind===section.kind&&!s.content)){
 if(section.kind==='products')patch.products=[];if(section.kind==='services')patch.services=[];if(section.kind==='gallery')patch.photos=[];if(section.kind==='benefits')patch.benefits=[];if(section.kind==='categories')patch.highlights=[];if(section.kind==='hours')patch.hours='';if(section.kind==='location'){patch.address='';patch.mapsUrl=''};if(section.kind==='actions')patch.actions=[]
 }
 return patch
}
export function addSection(bio:Bio,kind:SectionKind){
 const existing=bio.sections.find(s=>s.kind===kind&&!s.enabled)
 if(existing)return {section:{...existing,enabled:true},sections:bio.sections.map(s=>s.id===existing.id?{...s,enabled:true}:s)}
 const section={id:crypto.randomUUID(),kind,title:'Nova seção',text:'',enabled:true,content:{}}
 return {section,sections:[...bio.sections,section]}
}
