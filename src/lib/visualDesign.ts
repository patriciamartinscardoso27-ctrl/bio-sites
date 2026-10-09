import type { Bio, ActionKind, Action,Appearance } from '../types/biosite'
import {designPalette} from './designSystem'
import {modelDesigns} from '../data/modelDesigns'
import { templates } from '../data/templates'
import { createAction,actionTypes } from './actionLinks'
export {layoutNames,sectionLayouts} from './designSystem'
export function appearancePreset(bio:Bio,preset:string):Partial<Bio>{
 preset=preset==='Claro'?'Mais claro':preset==='Escuro'?'Mais escuro':['Luxo','Black & Gold'].includes(preset)?'Elegante':preset
 const original=templates.find(t=>t.bio.style===bio.style)?.bio
 if(preset==='Original')return {color:original?.color||bio.color,appearance:original?.appearance?structuredClone(original.appearance):undefined}
 if(preset==='Personalizado')return {}
 const style=preset==='Premium'?'premium':preset==='Elegante'?'elegant':preset==='Minimalista'?'minimal':preset==='Vibrante'?'vibrant':'modern'
 return designPalette(style,['Mais escuro','Premium','Elegante'].includes(preset)?'dark':'light',style==='modern'?bio.color:undefined)
}
export function defaultAppearance(bio:Bio):Appearance{const d=modelDesigns[bio.style],dark=['black-gold','luxury-black','gourmet-dark','chocolate-premium','auto-premium','performance-red','business-premium','urban-street'].includes(bio.style);return {theme:dark?'dark':'light',secondary:dark?'#29313a':'#eee5da',font:d.heading.includes('Georgia')?'serif':d.heading.includes('Impact')?'condensed':'sans',buttons:['fashion-pink','vintage-barber','nude-elegance','fast-food-red','chocolate-premium','performance-red','modern-blue'].includes(bio.style)?'pill':['clean-nude','urban-street','luxury-black','rustic-kitchen','clean-patisserie','tech-blue','clean-minimal'].includes(bio.style)?'square':'rounded',cards:['clean-nude','urban-street','luxury-black','rustic-kitchen','clean-patisserie','tech-blue','clean-minimal'].includes(bio.style)?'square':'rounded',...bio.appearance}}
export function changeActionType(action:Action,kind:ActionKind,bio:Bio):Action{
 return {...createAction(kind,bio),id:action.id,enabled:action.enabled,destination:action.destination,sectionId:action.sectionId,subtitle:undefined,icon:undefined}
}
export function moveSection(bio:Bio,id:string,direction:number){const rows=[...bio.sections],index=rows.findIndex(s=>s.id===id),next=index+direction;if(index>=0&&next>=0&&next<rows.length)[rows[index],rows[next]]=[rows[next],rows[index]];return rows}
export function recommendedActionTypes(bio:Bio){
 const order:ActionKind[]=/restaurante|lanchonete/i.test(bio.category)?['menu','order','whatsapp','location']:/oficina|serviços/i.test(bio.category)?['quote','whatsapp','phone','location']:/barbearia|salão|estética/i.test(bio.category)?['booking','whatsapp','reviews','location']:['whatsapp','instagram','order','location']
 return [...actionTypes].sort((a,b)=>{const rank=(kind:ActionKind)=>{const index=order.indexOf(kind);return index<0?order.length:index};return rank(a.kind)-rank(b.kind)})
}
