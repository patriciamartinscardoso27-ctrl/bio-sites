import type {Bio} from '../types/biosite'
import {readyModelIds} from '../data/readyModelIds'

export const premiumPackageMaxBytes=4_000_000
export const premiumSectionKinds=['actions','categories','promotion','services','products','gallery','about','benefits','hours','location','whatsapp','testimonials'] as const
export interface PremiumDesignPackage {
 format:'bio-sites-premium';schemaVersion:1
 renderer:{id:'biosite';version:1;profile:'preset'|'flexible'|'standard';presetId?:string}
 components:{id:string;version:1}[]
 assets:{version:1;storage:'references';media:{path:string;source:string}[]}
 editing:{version:1;adapter:'existing-editor'}
 design:Bio
}
const fail=(message:string):never=>{throw new Error(message)}
function keys(value:unknown,allowed:readonly string[],label:string){
 if(!value||typeof value!=='object'||Array.isArray(value))fail(label+': objeto inválido.')
 if(Object.keys(value as object).some(k=>!allowed.includes(k)))fail(label+': propriedade não suportada.')
}
function boundedTree(value:unknown,depth=0,counter={nodes:0}){
 if(depth>32||++counter.nodes>100000)fail('Pacote excessivamente complexo.')
 if(Array.isArray(value)){if(value.length>1000)fail('Coleção excessivamente grande.');value.forEach(v=>boundedTree(v,depth+1,counter))}
 else if(value&&typeof value==='object')for(const [key,v] of Object.entries(value)){
  if(['__proto__','prototype','constructor'].includes(key))fail('Propriedade insegura no pacote.')
  boundedTree(v,depth+1,counter)
 }
 else if(typeof value==='number'&&!Number.isFinite(value))fail('Número inválido no pacote.')
 else if(typeof value==='string'&&(value.length>premiumPackageMaxBytes||value.includes('\0')))fail('Texto ou arquivo inválido no pacote.')
}
function profile(bio:Bio):PremiumDesignPackage['renderer']{
 return {id:'biosite',version:1,profile:bio.layoutPreset?'preset':bio.renderMode==='flexible'?'flexible':'standard',...(bio.layoutPreset?{presetId:bio.layoutPreset}:{})}
}
function components(bio:Bio):PremiumDesignPackage['components']{
 return [...new Set([...(bio.heroEnabled!==false?['hero']:[]),...bio.sections.map(s=>'section.'+s.kind)])].map(id=>({id,version:1}))
}
export function premiumMedia(bio:Bio){
 const media:{path:string;source:string}[]=[]
 const walk=(value:unknown,path:string,key='')=>{
  if(typeof value==='string'&&value&&(['cover','logo','image','backgroundImage','poster'].includes(key)||/\.photos\[\d+\]$/.test(path)||path.startsWith('photos[')||path.endsWith('.video.src')))media.push({path,source:value})
  else if(Array.isArray(value))value.forEach((v,i)=>walk(v,path+'['+i+']',key))
  else if(value&&typeof value==='object')for(const [k,v] of Object.entries(value))walk(v,path?path+'.'+k:k,k)
 }
 walk(bio,'');return media
}
const bioKeys=['id','manual','appearance','heroEnabled','style','name','category','headline','tagline','highlights','benefits','description','color','cover','logo','phone','address','hours','instagram','telephone','email','facebook','tiktok','reviewsUrl','mapsUrl','website','menuUrl','sections','actions','services','products','photos','heroLayout','heroVisual','textVisual','composition','renderMode','designVisual','identity','layoutPreset']
const sectionKeys=['id','kind','title','text','enabled','image','badge','ctaLabel','subtitle','auxiliary','textOptions','entryTextOptions','action','entryIcons','layout','visual','content','block','titleVisual','video']
const itemKeys=['id','title','description','price','image','categoryId','action','textOptions','visual']
const actionKeys=['id','label','message','kind','enabled','source','mode','url','number','email','icon','iconColorMode','subtitle','description','textOptions','destination','sectionId','visual','appearanceMode','titleVisual']
function contentKeys(bio:Bio){
 keys(bio,bioKeys,'Design')
 if(bio.appearance)keys(bio.appearance,['theme','secondary','font','buttons','cards','background','text','panel','muted','highlight','border','buttonMode','buttonDefault','buttonBackground','buttonIcon','buttonText','buttonHover'],'Aparência')
 if(!Array.isArray(bio.sections)||!Array.isArray(bio.actions)||!Array.isArray(bio.products)||!Array.isArray(bio.services)||!Array.isArray(bio.highlights))fail('Coleções obrigatórias ausentes.')
 const action=(a:unknown)=>keys(a,actionKeys,'Botão')
 const item=(i:Bio['products'][number])=>{keys(i,itemKeys,'Item');if(i.action)action(i.action)}
 const highlight=(h:Bio['highlights'][number])=>{keys(h,['id','label','image','caption','textOptions','action'],'Coleção');if(h.action)action(h.action)}
 bio.actions.forEach(action);bio.products.forEach(item);bio.services.forEach(item);bio.highlights.forEach(highlight)
 for(const section of bio.sections){
  keys(section,sectionKeys,'Seção')
  if(!premiumSectionKinds.includes(section.kind))fail('Componente de seção não suportado.')
  if(section.action)action(section.action)
  if(section.entryIcons)Object.values(section.entryIcons).forEach(action)
  if(section.content){keys(section.content,['items','actions','photos','benefits','highlights','hours','address','mapsUrl'],'Conteúdo');section.content.items?.forEach(item);section.content.actions?.forEach(action);section.content.highlights?.forEach(highlight)}
 }
 if(bio.layoutPreset&&!readyModelIds.includes(bio.layoutPreset))fail('Preset não disponível nesta instalação.')
}
export function assertPremiumPackage(value:unknown):asserts value is PremiumDesignPackage {
 if(new TextEncoder().encode(JSON.stringify(value)).byteLength>premiumPackageMaxBytes)fail('O pacote JSON deve ter até 4 MB. ZIP será suportado em uma etapa futura.')
 boundedTree(value);keys(value,['format','schemaVersion','renderer','components','assets','editing','design'],'Pacote')
 const p=value as PremiumDesignPackage
 if(p.format!=='bio-sites-premium'||p.schemaVersion!==1)fail('Formato ou versão de pacote não suportado.')
 keys(p.renderer,['id','version','profile','presetId'],'Renderizador')
 keys(p.editing,['version','adapter'],'Edição')
 keys(p.assets,['version','storage','media'],'Arquivos')
 if(p.renderer.id!=='biosite'||p.renderer.version!==1||p.editing.version!==1||p.editing.adapter!=='existing-editor'||p.assets.version!==1||p.assets.storage!=='references')fail('Versão de componente, renderizador ou armazenamento incompatível.')
 contentKeys(p.design)
 if(JSON.stringify(p.renderer)!==JSON.stringify(profile(p.design))) {
  const expected=profile(p.design)
  if(p.renderer.profile!==expected.profile||p.renderer.presetId!==expected.presetId)fail('O renderizador declarado não corresponde ao design.')
 }
 if(!Array.isArray(p.components)||p.components.length>premiumSectionKinds.length+1)fail('Catálogo de componentes inválido.')
 for(const c of p.components){keys(c,['id','version'],'Componente');if(c.version!==1)fail('Versão de componente não suportada.')}
 const expected=components(p.design).map(c=>c.id).sort(),actual=p.components.map(c=>c.id).sort()
 if(JSON.stringify(expected)!==JSON.stringify(actual))fail('Componentes declarados não correspondem à composição.')
 if(!Array.isArray(p.assets.media))fail('Inventário de arquivos inválido.')
 p.assets.media.forEach(m=>keys(m,['path','source'],'Arquivo'))
 const sort=(items:{path:string;source:string}[])=>[...items].sort((a,b)=>a.path.localeCompare(b.path)).map(m=>[m.path,m.source])
 if(JSON.stringify(sort(p.assets.media))!==JSON.stringify(sort(premiumMedia(p.design))))fail('O inventário de imagens não corresponde ao design.')
}
export function exportPremiumDesign(bio:Bio):PremiumDesignPackage {
 const design=structuredClone(bio);delete design.client
 const result:PremiumDesignPackage={format:'bio-sites-premium',schemaVersion:1,renderer:profile(design),components:components(design),assets:{version:1,storage:'references',media:premiumMedia(design)},editing:{version:1,adapter:'existing-editor'},design}
 assertPremiumPackage(result);return result
}
export function importPremiumDesign(value:unknown,id:string):Bio {
 assertPremiumPackage(value)
 // Preserve IDs within the page: they bind actions, editor fields and styles.
 // A fresh root ID prevents importing over the exported customer's record.
 return {...structuredClone(value.design),id}
}
