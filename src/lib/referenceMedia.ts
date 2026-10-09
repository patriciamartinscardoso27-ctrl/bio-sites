import type {Bio} from '../types/biosite'
import type {ReferenceDesignSpec} from './referenceDesign'
export interface UploadedVisual {role:'logo'|'instagram'|'reference'|'content';preview:string}
// Gemini returns indices, never URLs or base64. Only explicitly supplied content
// photos may populate the site; a layout screenshot is not a content asset.
export function applyReferenceMedia(input:Bio,spec:ReferenceDesignSpec,uploads:UploadedVisual[]):Bio{
 const bio=structuredClone(input),used=new Set<number>()
 const take=(index:unknown)=>{if(!Number.isInteger(index)||used.has(Number(index)))return undefined;const source=uploads[Number(index)];if(source?.role!=='content'||!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(source.preview))return undefined;used.add(Number(index));return source.preview}
 const hero=take(spec.heroImageIndex);if(hero)bio.cover=hero
 bio.sections=bio.sections.map((section,i)=>{
  const slots=section.content?.items?.length??(section.kind==='gallery'?section.content?.photos?.length:section.kind==='categories'?section.content?.highlights?.length:section.kind==='actions'?0:1)??1;const indices=(spec.blocks?.[i]?.mediaIndices||[]).slice(0,slots),photos=indices.map(take).filter((v):v is string=>Boolean(v));if(!photos.length)return section
  if(section.content?.items){section.content.items=section.content.items.map((item,n)=>({...item,...(photos[n]?{image:photos[n]}:{})}))}
  else if(section.kind==='gallery')section.content={...section.content,photos:(section.content?.photos||[]).map((url,n)=>photos[n]||url)}
  else if(section.kind==='categories')section.content={...section.content,highlights:(section.content?.highlights||[]).map((h,n)=>({...h,image:photos[n]||h.image}))}
  else section.image=photos[0]
  return section
 })
 const logo=uploads.find(u=>u.role==='logo');if(logo)bio.logo=logo.preview
 return bio
}
