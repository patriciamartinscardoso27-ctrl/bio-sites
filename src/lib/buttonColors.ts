import type {Action,Bio} from '../types/biosite'
import {normalizeGradient} from './visualSpec'
import {modelDesigns} from '../data/modelDesigns'
import {iconDefaultColor} from './iconCatalog'
import {brandPresentation,buttonAppearanceMode,clearButtonColors,themeButtonBackground} from './brandButtonAppearance'
export function luminance(hex:string){const clean=/^#[0-9a-f]{6}$/i.test(hex)?hex:'#ffffff';const channels=[1,3,5].map(i=>parseInt(clean.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722}
export function contrast(a:string,b:string){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
export function readableInk(background:string){return contrast(background,'#ffffff')>contrast(background,'#000000')?'#ffffff':'#000000'}
export function buttonColors(action:Action,bio:Bio){
 const a=bio.appearance,v=action.visual,mode=a?.buttonMode||'original'
 const page=a?.background||(a?.theme==='dark'||(!a&&['black-gold','luxury-black','gourmet-dark','chocolate-premium','auto-premium','performance-red','business-premium','urban-street'].includes(bio.style))?'#101519':modelDesigns[bio.style]?.paper||'#ffffff')
 const appearanceMode=buttonAppearanceMode(action),brand=brandPresentation(action)
 if(appearanceMode==='brand'&&brand)return {page,background:brand.background,fill:brand.fill||brand.background,icon:brand.icon||brand.ink,text:a?.buttonText||(a?.text&&contrast(page,a.text)>=4.5?a.text:readableInk(page)),border:brand.border,hover:brand.hover,painted:true,complete:true,appearanceMode,shadow:brand.shadow}
 if(appearanceMode){const background=appearanceMode==='theme'?themeButtonBackground(bio):v?.background||themeButtonBackground(bio),style=appearanceMode==='custom'?v?.style:undefined,gradient=appearanceMode==='custom'&&(!style||style==='solid')?normalizeGradient(v?.backgroundGradient):undefined,transparent=style==='outline'||style==='soft',fill=gradient||(style==='outline'?'transparent':style==='soft'?background+'22':background),icon=appearanceMode==='custom'?v?.iconColor||(transparent?background:readableInk(background)):a?.buttonIcon||readableInk(background),text=appearanceMode==='custom'?v?.textColor||v?.text||readableInk(page):a?.buttonText||a?.text||readableInk(page);return {page,background,fill,icon,text,border:appearanceMode==='custom'?v?.border||background:background,hover:appearanceMode==='custom'?v?.hoverColor||a?.buttonHover:a?.buttonHover||bio.color,painted:true,complete:true,appearanceMode,shadow:undefined}}
 const original:Record<string,string>={whatsapp:'#08ad4c',instagram:'#e22d78',location:'#208bdb',booking:'#d73944'}
 const base=mode==='original'?original[action.kind||'whatsapp']||bio.color:mode==='mono'?'#303b36':mode==='light'?'#f0f4ed':mode==='dark'?'#182523':a?.buttonDefault||bio.color
 const background=v?.background||a?.buttonBackground||base
 const painted=mode!=='original'||Boolean(v?.backgroundGradient||v?.background||v?.iconColor||v?.border||v?.style||v?.radius||v?.shadow||a?.buttonBackground||a?.buttonIcon)
 const icon=action.iconColorMode==='original'?iconDefaultColor(action.icon||action.kind||'whatsapp'):v?.iconColor||a?.buttonIcon||readableInk(background)
 const text=v?.textColor||v?.text||a?.buttonText||a?.text||readableInk(page)
 const fill=normalizeGradient(v?.backgroundGradient)|| (v?.style==='outline'?'transparent':v?.style==='soft'?background+'22':mode==='original'&&action.kind==='instagram'&&!v?.background&&!a?.buttonBackground?'linear-gradient(135deg,#8426b4,#e22d78,#f99b39)':background)
 return {page,background,fill,icon:action.iconColorMode==='original'?icon:v?.style==='outline'||v?.style==='soft'?v?.iconColor||a?.buttonIcon||background:icon,text,border:v?.border||background,hover:v?.hoverColor||a?.buttonHover,painted,complete:false,appearanceMode:undefined,shadow:undefined}
}
export function editableActionVisual(action:Action,bio:Bio){const paint=buttonColors(action,bio);if(!paint.complete)return action.visual||{};return {...action.visual,background:paint.background,backgroundGradient:paint.fill.startsWith('linear-gradient')?paint.fill:undefined,iconColor:paint.icon,textColor:paint.text,border:paint.border,hoverColor:paint.hover,style:buttonAppearanceMode(action)==='brand'?'solid' as const:action.visual?.style}}
export function actionAppearancePatch(action:Action,bio:Bio,visual:NonNullable<Action['visual']>):Partial<Action>{const previous=editableActionVisual(action,bio),next={...visual};if(visual.background!==previous.background||visual.style==='outline'||visual.style==='soft')delete next.backgroundGradient;return {appearanceMode:'custom',iconColorMode:'custom',visual:next}}
export function setButtonAppearanceMode(action:Action,bio:Bio,appearanceMode:NonNullable<Action['appearanceMode']>):Partial<Action>{return {appearanceMode,iconColorMode:appearanceMode==='brand'?'original':appearanceMode==='theme'?'theme':'custom',visual:appearanceMode==='custom'?editableActionVisual(action,bio):clearButtonColors(action.visual)}}
