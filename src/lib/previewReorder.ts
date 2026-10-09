import type {Bio,SectionContent} from '../types/biosite'
import {sectionContent} from './sections'
export type ReorderScope='sections'|'actions'|'items'|'photos'|'benefits'|'testimonials'|'highlights'
export interface ReorderList {scope:ReorderScope;sectionId?:string}
export function moveOnly<T>(values:readonly T[],from:number,to:number):T[]{
 if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||to<0||from>=values.length||to>=values.length||from===to)return [...values]
 const result=[...values], [value]=result.splice(from,1);result.splice(to,0,value);return result
}
export function reorderPreview(bio:Bio,list:ReorderList,source:string,target:string):Partial<Bio>{
 if(source===target)return {}
 if(list.scope==='sections'){
  const from=bio.sections.findIndex(s=>s.id===source),to=bio.sections.findIndex(s=>s.id===target)
  return from<0||to<0?{}:{sections:moveOnly(bio.sections,from,to)}
 }
 const section=bio.sections.find(s=>s.id===list.sectionId);if(!section)return {}
 const content=sectionContent(bio,section)
 const key=list.scope
 const allowed=key==='items'?(section.kind==='products'||section.kind==='services'||section.block==='cards'):key==='actions'?section.kind==='actions':key==='photos'?section.kind==='gallery':key==='benefits'?section.kind==='benefits':key==='highlights'?section.kind==='categories':section.kind==='testimonials'
 if(!allowed)return {}
 const values=key==='testimonials'?section.text.split('\n'):content[key as keyof SectionContent]
 if(!Array.isArray(values))return {}
 const index=(id:string)=>['actions','items','highlights'].includes(key)?values.findIndex(v=>typeof v==='object'&&v&&'id' in v&&v.id===id):/^\d+$/.test(id)?Number(id):-1
 const from=index(source),to=index(target);if(from<0||to<0||from>=values.length||to>=values.length)return {}
 const next=moveOnly<unknown>(values,from,to)
 if(key==='testimonials')return {sections:bio.sections.map(s=>s.id===section.id?{...s,text:next.join('\n')}:s)}
 // Legacy arrays stay legacy; owned content stays owned. No detachment or data migration.
 if(!section.content){const field=key==='items'?(section.kind==='services'?'services':'products'):key;return {[field]:next}}
 return {sections:bio.sections.map(s=>s.id===section.id?{...s,content:{...s.content,[key]:next}}:s)}
}
