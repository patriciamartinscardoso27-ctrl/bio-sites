import {randomUUID} from 'node:crypto'
import {ApiError,validateBio} from './validation.mjs'
const {assertPremiumPackage,exportPremiumDesign,importPremiumDesign}=await import('../src/lib/premiumDesignPackage.ts')
const {safeWebUrl}=await import('../src/lib/actionLinks.ts')

function checkLinks(value,key=''){
 if(Array.isArray(value)){value.forEach(v=>checkLinks(v,key));return}
 if(value&&typeof value==='object'){for(const [k,v] of Object.entries(value))checkLinks(v,k);return}
 if(typeof value==='string'&&value&&['url','mapsUrl','website','menuUrl','reviewsUrl','instagram','facebook','tiktok'].includes(key)){
  if(key==='instagram'&&/^@[a-z0-9._]+$/i.test(value))return
  if(!safeWebUrl(value))throw Error('O pacote contém um link não permitido.')
 }
}
function checkDesign(bio){
 validateBio(bio);checkLinks(bio)
 // This historical layout has CSS tied to the original client's UUID.
 // Reject rather than silently change its appearance when assigning a new ID.
 if(bio.id==='5f056c3b-192d-49ff-acb4-48743839161f')throw Error('Este design depende do ID do cliente e ainda não é portátil. A importação foi cancelada para preservar sua aparência.')
}

export function processPremiumDesign(value){
 try{
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['operation','package','bio'].includes(k)))throw Error('Pedido de pacote inválido.')
  if(value.operation==='export'){
   if(value.package!==undefined||!value.bio)throw Error('Envie um BioSite para exportar.')
   checkDesign(value.bio)
   const pack=exportPremiumDesign(value.bio);checkDesign(pack.design)
   return {package:pack}
  }
  if(value.operation!=='import'||value.bio!==undefined)throw Error('Operação de pacote inválida.')
  assertPremiumPackage(value.package);checkDesign(value.package.design)
  const bio=importPremiumDesign(value.package,randomUUID());validateBio(bio)
  return {bio,compatibility:{schemaVersion:1,rendererVersion:1,mediaCount:value.package.assets.media.length,storage:'references',persisted:false}}
 }catch(error){
  if(error instanceof ApiError)throw error
  throw new ApiError(400,error instanceof Error?error.message:'Pacote inválido.')
 }
}
