import type {Bio,Section,SectionKind,SectionLayout} from '../types/biosite'
import {templates,labels} from '../data/templates'
import {sectionContent} from './sections'
import {sectionLayouts,layoutNames} from './designSystem'
export interface SectionPreset {id:string;label:string;layout?:SectionLayout;block?:Section['block'];visual?:Section['visual'];ctaLabel?:string;itemCount?:number}
export function sectionPresets(kind:SectionKind):SectionPreset[]{
 const layouts=sectionLayouts[kind];if(layouts)return [...layouts.map(layout=>({id:layout,label:layoutNames[layout],layout})),...(['products','services'].includes(kind)?[{id:'three-six',label:'Vitrine 3 × 2 · seis imagens',layout:'three' as SectionLayout,itemCount:6,visual:{columns:3 as const}}]:[])]
 if(kind==='about')return [{id:'original',label:'Texto + imagem'},{id:'image-text',label:'Imagem + texto',block:'picture-text'},{id:'center',label:'Texto centralizado',block:'text',visual:{align:'center'}},{id:'compact',label:'Compacto',visual:{spacing:'compact'}}]
 if(kind==='whatsapp')return ['WhatsApp','Agendamento','Orçamento','Pedido','Fale conosco'].map((label,i)=>({id:'cta-'+i,label,ctaLabel:label==='WhatsApp'?'Falar no WhatsApp':label==='Agendamento'?'Agendar agora':label==='Orçamento'?'Pedir orçamento':label==='Pedido'?'Fazer pedido':label}))
 if(kind==='promotion')return [{id:'original',label:'Destaque com imagem'},{id:'compact',label:'Card compacto',visual:{spacing:'compact',radius:'rounded',shadow:'soft'}}]
 return [{id:'original',label:kind==='hours'?'Lista semanal':kind==='location'?'Endereço + botão':kind==='benefits'?'Cards com ícones':'Cards'},{id:'compact',label:'Compacto',visual:{spacing:'compact',radius:'rounded',shadow:'soft'}}]
}
export function insertSectionAt(bio:Bio,index:number,kind:SectionKind,presetId:string){
 if(!Number.isInteger(index)||index<0||index>bio.sections.length)throw Error('Posição de inserção inválida.')
 const preset=sectionPresets(kind).find(p=>p.id===presetId);if(!preset)throw Error('Preset incompatível.')
 const candidates=templates.filter(t=>t.bio.category===bio.category),template=candidates.find(t=>t.bio.sections.some(s=>s.kind===kind))||candidates[0]||templates[0],source=template.bio.sections.find(s=>s.kind===kind)
 const section:Section={...(source?structuredClone(source):{kind,title:labels[kind],text:'',enabled:true}),id:crypto.randomUUID(),kind,enabled:true,layout:preset.layout,block:preset.block,visual:{...source?.visual,...preset.visual},content:{},...(preset.ctaLabel?{ctaLabel:preset.ctaLabel,text:'Fale conosco para '+preset.label.toLowerCase()+'.'}:{})}
 const demo=source?sectionContent(template.bio,source):{}
 section.content=structuredClone(demo)
 if(kind==='products'||kind==='services')section.content={items:(demo.items?.length?demo.items:(kind==='products'?template.bio.products:template.bio.services)).slice(0,3).map(i=>({...structuredClone(i),id:crypto.randomUUID(),categoryId:undefined,action:undefined,description:'Conteúdo demonstrativo — personalize para seu negócio.'}))}
 if((kind==='products'||kind==='services')&&!section.content.items?.length)section.content.items=['Opção 1','Opção 2','Opção 3'].map(title=>({id:crypto.randomUUID(),title,description:'Conteúdo demonstrativo — personalize.',price:'Sob consulta',image:template.bio.cover}))
 if(kind==='actions')section.content.actions=(demo.actions?.length?demo.actions:template.bio.actions).map(a=>({...structuredClone(a),id:crypto.randomUUID(),source:'business',destination:'external',sectionId:undefined,url:undefined,number:undefined,email:undefined}))
 if(kind==='categories')section.content.highlights=(demo.highlights||template.bio.highlights).map(h=>({...h,id:crypto.randomUUID()}))
 if(kind==='gallery')section.content.photos=(demo.photos||template.bio.photos).slice(0,3)
 if(kind==='benefits')section.content.benefits=demo.benefits||template.bio.benefits
 if(kind==='hours')section.content.hours=bio.hours||'Segunda a sexta: Informe seus horários'
 if(kind==='location'){section.content.address=bio.address||'Informe seu endereço';section.content.mapsUrl=bio.mapsUrl||''}
 if(kind==='testimonials')section.text='Cliente de exemplo|Substitua por um depoimento verdadeiro.\nOutro cliente|Conteúdo demonstrativo editável.'
 if(preset.itemCount&&section.content.items?.length){const source=section.content.items;section.content.items=Array.from({length:preset.itemCount},(_,i)=>({...structuredClone(source[i%source.length]),id:crypto.randomUUID()}))}
 return {section,sections:[...bio.sections.slice(0,index),section,...bio.sections.slice(index)]}
}
