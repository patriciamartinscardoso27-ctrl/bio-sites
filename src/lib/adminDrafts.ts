import {createAction} from './actionLinks'
import type {Bio,ActionKind} from '../types/biosite'
export const goals=[{id:'messages',label:'Receber mensagens',kind:'whatsapp'},{id:'bookings',label:'Conseguir agendamentos',kind:'booking'},{id:'orders',label:'Receber pedidos',kind:'order'},{id:'quotes',label:'Pedir orçamento',kind:'quote'},{id:'products',label:'Mostrar produtos',kind:'menu'},{id:'reviews',label:'Conseguir avaliações',kind:'reviews'},{id:'presence',label:'Divulgar o negócio',kind:'instagram'}] as const
export function prepareSmartDraft(original:Bio,goal:string):Bio{
  const bio=structuredClone(original),chosen=goals.find(g=>g.id===goal)
  if(!chosen)return bio
  if(goal==='products'){const section=bio.sections.find(s=>s.kind==='products');if(section)section.enabled=true;return bio}
  const existing=bio.actions.find(a=>(a.kind||'whatsapp')===chosen.kind)
  const action=existing?{...existing,enabled:true}:createAction(chosen.kind as ActionKind,bio)
  bio.actions=[action,...bio.actions.filter(a=>a.id!==action.id)]
  return bio
}
export function duplicateDraft(original:Bio):Bio{const copy=structuredClone(original);copy.id=crypto.randomUUID();copy.name+=' · cópia';return copy}
