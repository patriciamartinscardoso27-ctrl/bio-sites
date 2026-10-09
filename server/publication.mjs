import {ApiError} from './validation.mjs'
export const auditDraftIds=new Set(['046190c7-5a53-4354-9115-3b64fc5e042e','fd6f8f5c-9832-4000-ab1a-21b9d36da31a','132586fb-f686-4be4-a2f5-1e9e0c431dbc'])
export function validateSlug(slug){if(typeof slug!=='string'||slug.length<1||slug.length>100||!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))throw new ApiError(400,'Endereço inválido. Use letras minúsculas, números e hífens, até 100 caracteres.');return slug}
export function assertPublishable(record){if(auditDraftIds.has(record.id)||/TESTE\s+AUDITORIA/i.test(record.content.name))throw new ApiError(403,'Rascunhos TESTE AUDITORIA não podem ser publicados ou alterados por este fluxo.')}
export function publicContent(content){
 const keys=['id','style','name','category','headline','tagline','highlights','benefits','description','color','cover','logo','phone','address','hours','instagram','telephone','email','facebook','tiktok','reviewsUrl','mapsUrl','website','menuUrl','sections','actions','services','products','photos','manual','appearance','heroEnabled','heroLayout','heroVisual','textVisual','designVisual','renderMode','layoutPreset']
 const result=Object.fromEntries(keys.filter(k=>content[k]!==undefined).map(k=>[k,structuredClone(content[k])]))
 // Rendering needs the palette, never internal source names or composition metadata.
 if(content.identity)result.identity={brandColors:content.identity.brandColors,extractedColors:content.identity.extractedColors}
 if(content.composition)result.composition={preferences:{categoryId:content.composition.preferences?.categoryId}}
 return result
}
