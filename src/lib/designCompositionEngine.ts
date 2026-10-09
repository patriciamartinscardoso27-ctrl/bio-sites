import {demoImageSelector} from './demoImages'
import type {Bio,Section,SectionKind,Action,Item,VisualSettings,Appearance,HeroLayout} from '../types/biosite'
import {categories} from '../data/templates'
import {createAction} from './actionLinks'
import {defaultAppearance} from './visualDesign'
import {allActions} from './sections'
import {designPalette,compositionProfiles,compositionStyles,compositionGoals,compatibleLayout,type CompositionPreferences,type CompositionStyle} from './designSystem'
export interface InitialVisual{color:string;appearance:Appearance;heroLayout?:HeroLayout;heroVisual?:VisualSettings;designVisual?:VisualSettings;textVisual?:Bio['textVisual'];sections:{id:string;layout?:Section['layout'];visual?:VisualSettings;titleVisual?:VisualSettings}[];actions:{id:string;visual?:VisualSettings;icon?:Action['icon']}[];items:{id:string;visual?:VisualSettings}[]}
export interface CompositionMetadata{engineVersion:1;compositionSeed:string;preferences:CompositionPreferences;initialVisual:InitialVisual}
// Reuse the project's existing demonstration media, without importing template compositions.
const content:Record<string,{photos:string[];items:string[];services:boolean}>={
 fashion:{photos:['photo-1539109136881-3be0616acf4b','photo-1515886657613-9f3515b0c78f','photo-1539109136881-3be0616acf4b'],items:['Novidades da coleção','Seleção da semana','Seu próximo look'],services:false},
 barber:{photos:['photo-1503951914875-452162b0f3f1','photo-1621605815971-fbc98d665033','photo-1599351431202-1e0f0137899a'],items:['Corte','Barba','Corte + barba'],services:true},
 beauty:{photos:['photo-1562322140-8baeececf3df','photo-1516975080664-ed2fc6a32937','photo-1544161515-4ab6ce6db874'],items:['Cabelo','Cuidados de beleza','Bem-estar'],services:true},
 food:{photos:['photo-1414235077428-338989a2e8c0','photo-1568901346375-23c9450c58cd','photo-1555939594-58d7cb561ad1'],items:['Destaque do cardápio','Especial da casa','Seu pedido favorito'],services:false},
 sweets:{photos:['photo-1578985545062-69928b1d9587','photo-1488477181946-6428a0291777','photo-1509440159596-0249088772ff'],items:['Bolo especial','Doces da casa','Encomendas'],services:false},
 auto:{photos:['photo-1486262715619-67b85e0b08d3','photo-1580273916550-e323be2ae537','photo-1492144534655-ae79c964c9d7'],items:['Revisão','Manutenção','Diagnóstico'],services:true},
 business:{photos:['photo-1497366754035-f200968a6e72','photo-1524758631624-e2822e304c36','photo-1497366811353-6870744d04b2'],items:['Atendimento personalizado','Soluções para você','Consultoria'],services:true}
}
export function normalizePreferences(value:CompositionPreferences):CompositionPreferences{
 if(!value||typeof value.name!=='string'||!value.name.trim()||value.name.trim().length>300||!categories.some(c=>c.id===value.categoryId)||!compositionGoals.some(g=>g.id===value.goal)||!compositionStyles.includes(value.style)||!['light','dark','any'].includes(value.theme)||!['compact','balanced','complete'].includes(value.density))throw new Error('Confira as preferências de criação.')
 for(const key of ['primary','accent'] as const)if(value[key]&&!/^#[0-9a-f]{6}$/i.test(value[key]!))throw new Error('Escolha uma cor válida.')
 for(const key of ['phone','instagram'] as const)if(value[key]!==undefined&&(typeof value[key]!=='string'||value[key]!.length>500||value[key]!.includes('\0')))throw new Error('Confira os contatos.')
 return {name:value.name.trim(),categoryId:value.categoryId,goal:value.goal,style:value.style,theme:value.theme,density:value.density,...(value.primary?{primary:value.primary.toLowerCase()}:{}),...(value.accent?{accent:value.accent.toLowerCase()}:{}),phone:value.phone?.trim()||'',instagram:value.instagram?.trim()||''}
}
function hash(seed:string){let value=2166136261;for(const character of seed)value=Math.imul(value^character.charCodeAt(0),16777619);return value>>>0}
function picker(seed:string){let state=hash(seed);return <T,>(values:readonly T[])=>{state^=state<<13;state^=state>>>17;state^=state<<5;return values[(state>>>0)%values.length]}}
export function captureInitialVisual(bio:Bio):InitialVisual{
 const actions=allActions(bio),items=[...bio.products,...bio.services,...bio.sections.flatMap(s=>s.content?.items||[])]
 return JSON.parse(JSON.stringify({color:bio.color,appearance:defaultAppearance(bio),heroLayout:bio.heroLayout,heroVisual:bio.heroVisual,designVisual:bio.designVisual,textVisual:bio.textVisual,sections:bio.sections.map(s=>({id:s.id,layout:s.layout,visual:s.visual,titleVisual:s.titleVisual})),actions:actions.map(a=>({id:a.id,visual:a.visual,icon:a.icon})),items:items.map(i=>({id:i.id,visual:i.visual}))}))
}
export function restoreGeneratedDesign(bio:Bio):Partial<Bio>{
 const initial=bio.composition?.initialVisual;if(!initial)return {}
 const action=(a:Action)=>{const original=initial.actions.find(x=>x.id===a.id);return original?{...a,visual:structuredClone(original.visual),icon:original.icon}:a},item=(i:Item)=>{const original=initial.items.find(x=>x.id===i.id);return {...i,...(original?{visual:structuredClone(original.visual)}:{}),...(i.action?{action:action(i.action)}:{})}}
 const sections=bio.sections.map(s=>{
  const original=initial.sections.find(x=>x.id===s.id)
  return {...s,...(original?{layout:original.layout,visual:structuredClone(original.visual),titleVisual:structuredClone(original.titleVisual)}:{}),...(s.content?{content:{...s.content,...(s.content.actions?{actions:s.content.actions.map(action)}:{}),...(s.content.items?{items:s.content.items.map(item)}:{})}}:{})}
 })
 return {color:initial.color,appearance:structuredClone(initial.appearance),heroLayout:initial.heroLayout,heroVisual:structuredClone(initial.heroVisual),designVisual:structuredClone(initial.designVisual),textVisual:structuredClone(initial.textVisual),sections,actions:bio.actions.map(action),products:bio.products.map(item),services:bio.services.map(item)}
}
export function structuralSignature(bio:Bio){return JSON.stringify({hero:bio.heroLayout,sections:bio.sections.filter(s=>s.enabled).map(s=>[s.kind,s.layout]),font:bio.appearance?.font,spacing:bio.heroVisual?.spacing,buttons:bio.appearance?.buttons})}
export function composeDesign(input:CompositionPreferences,compositionSeed:string,bioId:string=crypto.randomUUID()):Bio{
 const preferences=normalizePreferences(input)
 if(typeof compositionSeed!=='string'||!compositionSeed||compositionSeed.length>100||!/^[a-z0-9:_-]+$/i.test(compositionSeed))throw new Error('Seed de composição inválida.')
 const choose=picker(compositionSeed),style:Exclude<CompositionStyle,'surprise'>=preferences.style==='surprise'?choose(compositionStyles.filter(s=>s!=='surprise')):preferences.style,profile=compositionProfiles[style],data=content[preferences.categoryId]
 // Consecutive generated versions rotate the hero; seeded choices stay within style rules.
 const iteration=Number(compositionSeed.split(':').at(-1)),heroIndex=Number.isSafeInteger(iteration)?iteration:hash(compositionSeed)
 const heroLayout=profile.heroes[(heroIndex>>>0)%profile.heroes.length],dark=preferences.theme==='dark'||preferences.theme==='any'&&(style==='premium'||style==='vibrant'),color=preferences.primary||profile.primary
 const focus:SectionKind=preferences.goal==='products'?'products':preferences.goal==='services'?'services':data.services?'services':'products'
 const chooseImage=demoImageSelector(preferences.categoryId,style,dark?'dark':'light',compositionSeed),cover=chooseImage('hero',heroLayout==='full'?'portrait':'landscape')
 const density=preferences.density,count=density==='compact'?2:density==='complete'?6:3
 const makeItems=(services:boolean):Item[]=>Array.from({length:count},(_,index)=>({id:'item-'+(services?'service':'product')+'-'+index,title:(services===data.services?data.items:['Opção de exemplo','Atendimento de exemplo','Destaque de exemplo'])[index%3],description:'Conteúdo demonstrativo — personalize para seu negócio.',price:'Sob consulta',image:chooseImage(services?'servico':'produto'),visual:{radius:profile.radius,shadow:style==='minimal'?'none':'soft'}}))
 const appearance=designPalette(style,dark?'dark':'light',preferences.primary,preferences.accent).appearance
 const bio:Bio={id:bioId,manual:true,style:'clean-minimal',name:preferences.name,category:categories.find(c=>c.id===preferences.categoryId)!.label,headline:'Conheça nosso trabalho',tagline:style==='premium'?'Cada detalhe importa.':'Seu próximo encontro com o que você procura.',description:'Produtos, serviços e um atendimento perto de você.',color,appearance,heroLayout,heroVisual:{spacing:profile.spacing,align:heroLayout==='center'?'center':'left',imageFit:'cover',imagePosition:'center'},cover,logo:'',phone:preferences.phone||'',instagram:preferences.instagram?(/^https?:\/\//i.test(preferences.instagram)?preferences.instagram:'https://www.instagram.com/'+preferences.instagram.replace(/^@/,'').replace(/\/$/,'')+'/'):'',address:'',hours:'Informe seus horários de atendimento.',highlights:[],benefits:['Atendimento|Edite seu diferencial','Qualidade|Descreva o cuidado do seu negócio','Conveniência|Conte como você atende'],actions:[],products:focus==='products'?makeItems(false):[],services:focus==='services'?makeItems(true):[],photos:Array.from({length:3},()=>chooseImage('galeria')),sections:[]}
 const section=(kind:SectionKind,title:string,text='',enabled=true):Section=>({id:'section-'+kind,kind,title,text,enabled,visual:{spacing:density==='compact'?'compact':profile.spacing,radius:profile.radius,shadow:style==='premium'?'soft':'none'}})
 const actions=section('actions','A um toque de você');actions.layout=choose(profile.actions)
 const catalog=section(focus,focus==='services'?'Nossos serviços':preferences.categoryId==='food'?'Destaques do cardápio':'Nossa vitrine','Opções demonstrativas. Substitua pelos seus produtos ou serviços.');catalog.layout=choose(profile.catalog)
 const promotion=section('promotion','Conheça nosso destaque','Edite a oferta e as condições para o seu cliente.',density!=='compact');promotion.image=chooseImage('promocao');promotion.badge='EM DESTAQUE';promotion.ctaLabel=preferences.goal==='bookings'?'Agendar agora':preferences.goal==='quotes'?'Pedir orçamento':'Fale conosco'
 const about=section('about','Sobre nós','Conte aqui a história e o cuidado de '+preferences.name+'.',density!=='compact');about.image=chooseImage('ambiente','landscape')
 const gallery=section('gallery','Galeria','Imagens demonstrativas. Troque pelas suas fotos.',density!=='compact');gallery.layout=choose(profile.gallery)
 const benefits=section('benefits','O que faz a diferença','',density!=='compact'),reviews=section('testimonials','Quem conhece, recomenda','Exemplo|Substitua este texto por um depoimento verdadeiro.',density==='complete');reviews.layout=style==='minimal'?'spotlight':choose(['cards','carousel'] as const)
 const hours=section('hours','Horários','',density==='complete'||['food','auto','sweets'].includes(preferences.categoryId)),location=section('location','Venha nos conhecer','',density==='complete'||preferences.goal==='location'||['food','auto'].includes(preferences.categoryId)),cta=section('whatsapp',preferences.goal==='bookings'?'Seu próximo horário começa aqui.':'Vamos conversar?','Estamos a um toque de distância.');cta.ctaLabel=promotion.ctaLabel
 const before=style==='vibrant'||preferences.goal==='orders',middle=choose([[benefits,about,gallery],[gallery,about,benefits],[about,benefits,gallery]])
 bio.sections=[actions,...(before&&promotion.enabled?[promotion,catalog]:[catalog,promotion]),...middle,reviews,hours,location,cta]
 const primaryKind=preferences.goal==='bookings'?'booking':preferences.goal==='orders'?'order':preferences.goal==='quotes'?'quote':'whatsapp'
 const primary={...createAction(primaryKind,bio),id:'action-primary'},internal:Action={id:'action-catalog',kind:'custom',icon:focus==='services'?'scissors':preferences.categoryId==='food'?'food':'bag',label:focus==='services'?'Serviços':preferences.categoryId==='food'?'Cardápio':'Catálogo',subtitle:'Conheça as opções',message:'',destination:'section',sectionId:catalog.id,enabled:true}
 const instagram={...createAction('instagram',bio),id:'action-instagram'},contact={...createAction('location',bio),id:'action-location'}
 bio.actions=preferences.goal==='products'||preferences.goal==='services'?[internal,primary,instagram]:preferences.goal==='presence'?[instagram,primary,internal]:preferences.goal==='location'?[contact,primary,internal]:[primary,internal,instagram]
 if(density!=='compact'&&location.enabled&&!bio.actions.some(a=>a.id===contact.id))bio.actions.push(contact)
 for(const s of bio.sections)if(!compatibleLayout(s.kind,s.layout))throw new Error('Composição incompatível.')
 bio.composition={engineVersion:1,compositionSeed,preferences,initialVisual:captureInitialVisual(bio)}
 return bio
}
