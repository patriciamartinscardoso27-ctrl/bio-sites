import {readyModelIds} from '../src/data/readyModelIds.ts'
import {visualNumberBounds,visualEnumValues,normalizeGradient} from '../src/lib/visualSpec.ts'
import { catalog } from './catalog.mjs'
import {heroVariants,sectionLayouts} from '../src/lib/designSystem.ts'
const {normalizePreferences}=await import('../src/lib/designCompositionEngine.ts')

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const fail = () => { throw new ApiError(400, 'Conteúdo inválido. Confira os campos do BioSite.') }
const text = (value, max = 100000) => typeof value === 'string' && value.length <= max && !value.includes('\u0000')
function fields(value, required, optional = []) {
  if (!object(value)) fail()
  for (const key of required) if (!text(value[key])) fail()
  for (const key of optional) if (value[key] !== undefined && !text(value[key])) fail()
}
function choices(value, key, allowed, optional = true) {
  if (optional && value[key] === undefined) return
  if (!allowed.includes(value[key])) fail()
}
function optionalBoolean(value, key) { if (value[key] !== undefined && typeof value[key] !== 'boolean') fail() }
function rows(value, name, check) {
  if (!Array.isArray(value[name]) || value[name].length > 500) fail()
  const ids = new Set()
  for (const row of value[name]) {
    check(row)
    if (!text(row.id, 200) || !row.id || ids.has(row.id)) fail()
    ids.add(row.id)
  }
}
function image(value) {
  if (!text(value, 16 * 1024 * 1024)) fail()
  // Existing URL/data images are preserved; this is not a storage/upload API.
  if (value === '') return
  // Bundled official assets must stay portable when a preset is saved or cloned.
  if (/^\/images\/(official-batch-2|lote-two|lote-three|lote-four|lote-five|lote-six|lote-seven)\/[a-z0-9][a-z0-9-]*\.(png|jpeg|webp|svg)$/i.test(value)) return
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(value)) return
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) fail()
  } catch { fail() }
}
function visual(value){
 if(value===undefined)return
 if(!object(value))fail()
 const keys=['surfaceText','colorBindings','background','text','titleColor','iconColor','textColor','hoverColor','highlight','panel','border','radius','shadow','spacing','titleSize','align','font','weight','imageFit','imagePosition','backgroundImage','backgroundGradient','overlayGradient','style','paddingX','paddingY','gap','minHeight','mediaHeight','iconSize','borderWidth','borderStyle','columns',...Object.keys(visualNumberBounds),...Object.keys(visualEnumValues)]
 if(Object.keys(value).some(k=>!keys.includes(k)))fail()
 if(value.colorBindings!==undefined){if(!object(value.colorBindings)||Object.keys(value.colorBindings).some(k=>!['background','panel','text','titleColor','highlight','border','iconColor','textColor','hoverColor'].includes(k))||Object.values(value.colorBindings).some(v=>!['background','panel','primary','secondary','highlight','text','muted'].includes(v)))fail()}
 for(const key of ['surfaceText','background','text','titleColor','iconColor','textColor','hoverColor','highlight','panel','border'])if(value[key]!==undefined&&!/^#[0-9a-f]{6}$/i.test(value[key]))fail()
 for(const [key,allowed] of Object.entries({radius:['square','rounded','pill'],shadow:['none','soft','strong'],spacing:['compact','normal','wide'],titleSize:['small','medium','large'],align:['left','center','right'],font:['sans','serif','condensed'],weight:['regular','bold'],imageFit:['cover','contain'],imagePosition:['center','top','bottom'],style:['solid','outline','soft']}))choices(value,key,allowed)
 for(const [key,max] of Object.entries(visualNumberBounds))if(value[key]!==undefined&&(!Number.isInteger(value[key])||value[key]<0||value[key]>max))fail()
 for(const [key,allowed] of Object.entries(visualEnumValues))choices(value,key,allowed)
 choices(value,'columns',[1,2,3,4])
 choices(value,'borderStyle',['solid','dashed','dotted'])
 if(value.overlayGradient!==undefined&&!normalizeGradient(value.overlayGradient))fail();
 if(value.backgroundGradient!==undefined&&!normalizeGradient(value.backgroundGradient))fail()
 if(value.backgroundImage!==undefined)image(value.backgroundImage)
}
function checkTextOptions(row){
 if(row.textOptions===undefined)return
 if(!object(row.textOptions)||Object.keys(row.textOptions).some(k=>!['label','subtitle','description','title','text','price','auxiliary','badge','ctaLabel','caption'].includes(k)))fail()
 for(const option of Object.values(row.textOptions)){if(!object(option)||Object.keys(option).some(k=>!['hidden','visual'].includes(k)))fail();optionalBoolean(option,'hidden');visual(option.visual)}
}
function checkAction(row){checkTextOptions(row);
 fields(row,['id','label','message'],['url','number','email','subtitle','description','sectionId'])
 choices(row,'destination',['external','section']);if(row.sectionId!==undefined&&!text(row.sectionId,200))fail()
 choices(row,'appearanceMode',['brand','theme','custom']);choices(row,'iconColorMode',['original','theme','custom']);choices(row,'kind',catalog.actionKinds);choices(row,'icon',catalog.icons);choices(row,'source',['business','custom']);choices(row,'mode',['whatsapp','url']);optionalBoolean(row,'enabled');visual(row.visual);visual(row.titleVisual)
}
function checkItem(row){checkTextOptions(row);fields(row,['id','title','description','price'],['categoryId']);image(row.image);visual(row.visual);if(row.action!==undefined)checkAction(row.action)}
function checkAppearance(value){
  if(value!==undefined){
    fields(value, ['secondary'])
    choices(value,'theme',['light','dark'],false)
    choices(value,'font',['sans','serif','condensed'],false)
    choices(value,'buttons',['rounded','square','pill'],false)
    choices(value,'cards',['rounded','square'],false)
    for(const key of ['secondary','background','text','panel','muted','highlight','border','buttonDefault','buttonBackground','buttonIcon','buttonText','buttonHover'])if(value[key]!==undefined&&!/^#[0-9a-f]{6}$/i.test(value[key]))fail()
    choices(value,'buttonMode',['original','theme','mono','light','dark','custom'])
  }
}
function checkComposition(value){
 if(value===undefined)return
 if(!object(value)||value.engineVersion!==1||Object.keys(value).some(k=>!['engineVersion','compositionSeed','preferences','initialVisual'].includes(k))||!text(value.compositionSeed,100)||!value.compositionSeed||!/^[a-z0-9:_-]+$/i.test(value.compositionSeed))fail()
 if(!object(value.preferences)||Object.keys(value.preferences).some(k=>!['name','categoryId','goal','style','theme','primary','accent','density','phone','instagram'].includes(k)))fail()
 try{normalizePreferences(value.preferences)}catch{fail()}
 const initial=value.initialVisual
 if(!object(initial)||Object.keys(initial).some(k=>!['color','appearance','heroLayout','heroVisual','designVisual','textVisual','sections','actions','items'].includes(k))||!/^#[0-9a-f]{6}$/i.test(initial.color))fail()
 checkAppearance(initial.appearance);choices(initial,'heroLayout',heroVariants.map(v=>v.id));visual(initial.heroVisual);visual(initial.designVisual)
 if(initial.textVisual!==undefined){if(!object(initial.textVisual)||Object.keys(initial.textVisual).some(k=>!['name','description','tagline','headline'].includes(k)))fail();Object.values(initial.textVisual).forEach(visual)}
 rows(initial,'sections',row=>{fields(row,['id']);choices(row,'layout',[...new Set(Object.values(sectionLayouts).flat())]);visual(row.visual)})
 rows(initial,'actions',row=>{fields(row,['id']);choices(row,'icon',catalog.icons);visual(row.visual)})
 rows(initial,'items',row=>{fields(row,['id']);visual(row.visual)})
}
export function validateBio(content, id) {
  fields(content, ['id','style','name','category','headline','tagline','description','color','phone','address','hours','instagram'],
    ['telephone','email','facebook','tiktok','reviewsUrl','mapsUrl','website','menuUrl'])
  if (!isUuid(content.id) || (id && content.id !== id) || !content.name.trim() || content.name.length > 300 || content.category.length > 100) fail()
  if(content.client!==undefined){
    fields(content.client,[],['responsible','city','notes'])
    if(Object.keys(content.client).some(k=>!['responsible','city','notes'].includes(k))||!Object.values(content.client).every(v=>text(v,5000)))fail()
  }
  if (!catalog.categories.includes(content.category.toLowerCase())) fail()
  const model = catalog.models.find(m => m.style === content.style)
  if (!model) fail()
  image(content.cover); image(content.logo)
  optionalBoolean(content, 'manual'); optionalBoolean(content, 'heroEnabled')
  choices(content,'heroLayout',heroVariants.map(v=>v.id))
  visual(content.heroVisual);visual(content.designVisual);choices(content,'renderMode',['flexible']);choices(content,'layoutPreset',readyModelIds)
  if(content.textVisual!==undefined){if(!object(content.textVisual)||Object.keys(content.textVisual).some(k=>!['name','description','tagline','headline'].includes(k)))fail();Object.values(content.textVisual).forEach(visual)}
  if(content.identity!==undefined){const i=content.identity;if(!object(i)||Object.keys(i).some(k=>!['brandColors','extractedColors','instagram','logoPalette','instagramPalette','referencePalette','sources'].includes(k)))fail();for(const key of ['brandColors','extractedColors','logoPalette','instagramPalette','referencePalette'])if(i[key]!==undefined&&(!Array.isArray(i[key])||i[key].length>16||i[key].some(c=>typeof c!=='string'||!/^#[0-9a-f]{6}$/i.test(c))))fail();if(i.instagram!==undefined&&!text(i.instagram,500))fail();if(i.sources!==undefined){if(!Array.isArray(i.sources)||i.sources.length>32)fail();for(const source of i.sources){if(!object(source)||Object.keys(source).some(k=>!['name','role','colors'].includes(k))||!text(source.name,300)||!['logo','instagram','reference'].includes(source.role)||!Array.isArray(source.colors)||source.colors.length>16||source.colors.some(c=>typeof c!=='string'||!/^#[0-9a-f]{6}$/i.test(c)))fail()}}}
  checkAppearance(content.appearance)
  checkComposition(content.composition)
  rows(content,'sections', row => {
    checkTextOptions(row);fields(row,['id','title','text'],['badge','ctaLabel','subtitle','auxiliary']);if(row.action!==undefined)checkAction(row.action);if(row.entryIcons!==undefined){if(!object(row.entryIcons)||Object.keys(row.entryIcons).length>500)fail();for(const [key,icon] of Object.entries(row.entryIcons)){if(!/^(reviews|benefits)-[a-f0-9]{1,8}-[a-f0-9]{1,8}$/.test(key))fail();checkAction(icon)}}if(row.entryTextOptions!==undefined){if(!object(row.entryTextOptions)||Object.keys(row.entryTextOptions).length>500)fail();for(const [key,textOptions] of Object.entries(row.entryTextOptions)){if(!/^(reviews|benefits)-[a-f0-9]{1,8}-[a-f0-9]{1,8}$/.test(key))fail();checkTextOptions({textOptions})}}
    choices(row,'kind',catalog.sectionKinds,false)
    choices(row,'block',['text','image-text','picture-text','image','cards','cta','list'])
    if(row.block!==undefined&&row.kind!=='about')fail()
    choices(row,'layout',sectionLayouts[row.block==='cards'?'products':row.kind]||[])
    visual(row.visual)
    if(row.content!==undefined){fields(row.content,[],['hours','address','mapsUrl']);if(Object.keys(row.content).some(k=>!['items','actions','photos','benefits','highlights','hours','address','mapsUrl'].includes(k)))fail();if(row.content.items!==undefined)rows(row.content,'items',checkItem);if(row.content.actions!==undefined)rows(row.content,'actions',checkAction);if(row.content.highlights!==undefined)rows(row.content,'highlights',h=>{fields(h,['id','label'],['caption']);checkTextOptions(h);image(h.image);if(h.action!==undefined)checkAction(h.action)});for(const key of ['photos','benefits'])if(row.content[key]!==undefined){if(!Array.isArray(row.content[key])||row.content[key].length>500)fail();row.content[key].forEach(key==='photos'?image:v=>{if(!text(v))fail()})}}
    if (typeof row.enabled !== 'boolean') fail()
    if (row.image !== undefined) image(row.image)
  })
  rows(content,'actions',checkAction)
  for (const kind of ['products','services']) rows(content,kind,checkItem)
  rows(content,'highlights',row => { fields(row,['id','label'],['caption']);checkTextOptions(row); image(row.image);if(row.action!==undefined)checkAction(row.action) })
  if (!Array.isArray(content.benefits) || content.benefits.length > 500 || !content.benefits.every(b => text(b))) fail()
  if (!Array.isArray(content.photos) || content.photos.length > 500) fail()
  content.photos.forEach(image)
  return content.layoutPreset || model.id
}
export function validateVersion(version) {
  if (typeof version !== 'string' || !/^[1-9][0-9]{0,17}$/.test(version)) throw new ApiError(400, 'Versão inválida.')
  return version
}
export function slugFor(content) {
  const base = content.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,55).replace(/-$/,'') || 'biosite'
  return `${base}-${content.id.toLowerCase()}`
}

