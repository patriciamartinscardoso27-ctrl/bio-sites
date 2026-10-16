import type {SectionKind,SectionLayout,HeroLayout,Appearance} from '../types/biosite'
// The editor, composition engine and server consume the same supported variants.
export const heroVariants=[{id:'full',label:'Imagem cheia'},{id:'compact',label:'Compacto'},{id:'center',label:'Identidade central'},{id:'overlap',label:'Logo sobre a capa'},{id:'left',label:'Conteúdo à esquerda'}] as const satisfies readonly {id:HeroLayout;label:string}[]
export const layoutNames:Record<string,string>={square:'Ícones quadrados',rounded:'Ícones arredondados',two:'2 colunas',three:'3 colunas',four:'4 por linha',list:'Lista',pill:'Pílulas',inline:'Ícone + texto',compact:'Cards compactos',large:'Cards grandes',carousel:'Carrossel',grid:'Grade',mosaic:'Mosaico',cards:'Cards',spotlight:'Destaque individual'}
export const sectionLayouts:Partial<Record<SectionKind,SectionLayout[]>>={categories:['two','three','four','grid','carousel'],benefits:['cards','list'],actions:['square','rounded','two','three','four','list','pill','inline'],products:['compact','large','two','three','list','carousel'],services:['compact','large','two','three','list','carousel'],gallery:['grid','mosaic','carousel'],testimonials:['cards','carousel','spotlight']}
export const compositionStyles=['surprise','modern','premium','elegant','minimal','vibrant','classic'] as const
export type CompositionStyle=typeof compositionStyles[number]
export const styleNames:Record<CompositionStyle,string>={surprise:'Surpreenda-me',modern:'Moderno',premium:'Premium',elegant:'Elegante',minimal:'Minimalista',vibrant:'Vibrante',classic:'Clássico'}
export const compositionGoals=[{id:'messages',label:'Receber mensagens'},{id:'bookings',label:'Conseguir agendamentos'},{id:'orders',label:'Receber pedidos'},{id:'quotes',label:'Pedir orçamento'},{id:'products',label:'Mostrar produtos'},{id:'services',label:'Mostrar serviços'},{id:'location',label:'Levar clientes ao estabelecimento'},{id:'presence',label:'Fortalecer presença digital'}] as const
export type CompositionGoal=typeof compositionGoals[number]['id']
export interface CompositionPreferences{name:string;categoryId:string;goal:CompositionGoal;style:CompositionStyle;theme:'light'|'dark'|'any';primary?:string;accent?:string;density:'compact'|'balanced'|'complete';phone?:string;instagram?:string}
type Profile={heroes:HeroLayout[];actions:SectionLayout[];catalog:SectionLayout[];gallery:SectionLayout[];font:Appearance['font'];spacing:'compact'|'normal'|'wide';radius:'square'|'rounded'|'pill';primary:string;accent:string}
export const compositionProfiles:Record<Exclude<CompositionStyle,'surprise'>,Profile>={
 modern:{heroes:['compact','left','overlap'],actions:['three','rounded','two'],catalog:['two','large','list'],gallery:['grid','carousel'],font:'sans',spacing:'normal',radius:'rounded',primary:'#315e62',accent:'#d6bd84'},
 premium:{heroes:['overlap','full','center'],actions:['rounded','four','inline'],catalog:['large','two','carousel'],gallery:['mosaic','grid'],font:'sans',spacing:'wide',radius:'rounded',primary:'#806343',accent:'#d1b276'},
 elegant:{heroes:['center','overlap','left'],actions:['pill','two','inline'],catalog:['large','list','two'],gallery:['mosaic','carousel'],font:'serif',spacing:'wide',radius:'rounded',primary:'#73504c',accent:'#c9a66b'},
 minimal:{heroes:['compact','left','center'],actions:['inline','list','two'],catalog:['list','two','compact'],gallery:['grid','carousel'],font:'sans',spacing:'wide',radius:'square',primary:'#303d39',accent:'#68796d'},
 vibrant:{heroes:['full','overlap','compact'],actions:['square','three','rounded'],catalog:['three','large','carousel'],gallery:['mosaic','grid'],font:'sans',spacing:'compact',radius:'rounded',primary:'#ba2858',accent:'#ffbf47'},
 classic:{heroes:['center','left','full'],actions:['two','pill','four'],catalog:['two','list','large'],gallery:['grid','mosaic'],font:'serif',spacing:'normal',radius:'square',primary:'#314d68',accent:'#b78c53'}
}
export function compatibleLayout(kind:SectionKind,layout:unknown){return layout===undefined||sectionLayouts[kind]?.includes(layout as SectionLayout)===true}
export function designPalette(style:Exclude<CompositionStyle,'surprise'>,theme:'light'|'dark',primary?:string,accent?:string){
 const profile=compositionProfiles[style],dark=theme==='dark',color=primary||profile.primary,highlight=accent||profile.accent
 const appearance:Appearance={theme,font:profile.font,secondary:dark?'#29313a':'#eee5da',buttons:profile.radius,cards:profile.radius==='square'?'square':'rounded',background:dark?'#101719':style==='minimal'?'#ffffff':'#f7f5f0',text:dark?'#f7f6f0':'#172b25',panel:dark?'#1c2629':'#ffffff',muted:dark?'#bdc8c4':'#5b6a62',border:dark?'#43514e':'#dce3dc',highlight,buttonMode:style==='vibrant'?'original':'theme',buttonDefault:style==='premium'||style==='elegant'?highlight:color}
 return {color,appearance}
}
