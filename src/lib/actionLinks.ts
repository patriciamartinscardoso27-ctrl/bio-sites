import type { Action, ActionKind, Bio } from '../types/biosite'

export {iconCatalog as genericIcons} from './iconCatalog.ts'

export const actionTypes: { kind: ActionKind; name: string; label: string }[] = [
  { kind: 'whatsapp', name: 'WhatsApp', label: 'Falar no WhatsApp' },
  { kind: 'instagram', name: 'Instagram', label: 'Nosso Instagram' },
  { kind: 'facebook', name: 'Facebook', label: 'Nosso Facebook' },
  { kind: 'tiktok', name: 'TikTok', label: 'Nosso TikTok' },
  { kind: 'reviews', name: 'Google Avaliações', label: 'Avalie-nos no Google' },
  { kind: 'location', name: 'Google Maps / Como chegar', label: 'Como chegar' },
  { kind: 'phone', name: 'Telefone', label: 'Ligar para a loja' },
  { kind: 'email', name: 'E-mail', label: 'Enviar e-mail' },
  { kind: 'website', name: 'Site', label: 'Visitar nosso site' },
  { kind: 'menu', name: 'Cardápio', label: 'Ver cardápio' },
  { kind: 'booking', name: 'Agendamento', label: 'Agendar horário' },
  { kind: 'quote', name: 'Pedir orçamento', label: 'Pedir orçamento' },
  { kind: 'order', name: 'Fazer pedido / Comprar', label: 'Fazer pedido' },
  { kind: 'custom', name: 'Personalizado', label: 'Saiba mais' },
]
export const actionKind = (action: Action): ActionKind => action.kind || 'whatsapp'
export const isFlexible = (kind: ActionKind) => ['booking', 'quote', 'order'].includes(kind)
export const isWhatsApp = (action: Action) => actionKind(action) === 'whatsapp' || (isFlexible(actionKind(action)) && action.mode !== 'url')
export function businessValue(action: Action, bio: Bio): string {
  if (isWhatsApp(action)) return bio.phone
  const values: Partial<Record<ActionKind, string>> = {
    instagram: bio.instagram, facebook: bio.facebook, tiktok: bio.tiktok,
    reviews: bio.reviewsUrl, location: bio.mapsUrl || bio.address,
    phone: bio.telephone || bio.phone, email: bio.email, website: bio.website, menu: bio.menuUrl,
  }
  return values[actionKind(action)] || ''
}
export function createAction(kind: ActionKind, bio: Bio, id = crypto.randomUUID()): Action {
  const defaultMessages: Partial<Record<ActionKind, string>> = {
    booking: 'Olá! Gostaria de agendar um horário.', quote: 'Olá! Gostaria de solicitar um orçamento.',
    order: 'Olá! Gostaria de fazer um pedido.',
  }
  const action: Action = { id, kind, label: actionTypes.find(t => t.kind === kind)!.label,
    message: defaultMessages[kind] || '', enabled: true, source: 'custom',
    ...(isFlexible(kind) ? { mode: 'whatsapp' } : {}), ...(kind === 'custom' ? { icon: 'link' } : {}), ...(kind==='reviews'?{icon:'google-reviews',iconColorMode:'original'}:{}),
  }
  if (businessValue(action, bio)) action.source = 'business'
  return action
}
export function safeWebUrl(value: string): string | undefined {
  const input = value.trim()
  if (!input || /\s/.test(input)) return undefined
  // Accept bare domains, but never reinterpret unsafe schemes as web addresses.
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(input) ? input : `https://${input}`
  try {
    const url = new URL(candidate)
    if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) return undefined
    return url.href
  } catch { return undefined }
}
export interface ActionDestination { href?: string; error?: string; sectionId?:string }
export function actionDestination(action: Action, bio: Bio,anchorFor=(id:string)=>`biosite-${bio.id}-section-${encodeURIComponent(id)}`): ActionDestination {
  if(action.destination==='section'){
    const section=bio.sections.find(s=>s.id===action.sectionId)
    if(!section)return {error:'Escolha outro destino.'}
    if(!section.enabled)return {error:'Esta seção está oculta.'}
    return {href:'#'+anchorFor(section.id),sectionId:section.id}
  }
  const kind = actionKind(action)
  const reuse = action.source !== 'custom'
  if (isWhatsApp(action)) {
    const input = reuse ? bio.phone : action.number || ''
    const number = input.replace(/[^\d]/g, '')
    if (!/^[+\d\s().-]+$/.test(input.trim()) || number.length < 10 || number.length > 15) return { error: 'Informe um número com código do país e DDD (ex.: 5511999990000).' }
    return { href: `https://wa.me/${number}${action.message.trim() ? `?text=${encodeURIComponent(action.message)}` : ''}` }
  }
  if (kind === 'phone') {
    const input = reuse ? bio.telephone || bio.phone : action.number || ''
    const digits = input.replace(/\D/g, '')
    if (!/^[+\d\s().-]+$/.test(input.trim()) || digits.length < 7 || digits.length > 15) return { error: 'Informe um número de telefone válido.' }
    return { href: `tel:${input.trim().startsWith('+') ? '+' : ''}${digits}` }
  }
  if (kind === 'email') {
    const email = (reuse ? bio.email || '' : action.email || '').trim()
    if (!/^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) return { error: 'Informe um endereço de e-mail válido.' }
    return { href: `mailto:${email}` }
  }
  if (kind === 'location' && reuse && !bio.mapsUrl) {
    if (!bio.address.trim()) return { error: 'Configure o endereço do estabelecimento ou informe um link do Maps.' }
    return { href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bio.address)}` }
  }
  const input = reuse ? businessValue(action, bio) : action.url || ''
  const href = safeWebUrl(input)
  return href ? { href } : { error: 'Informe uma URL válida (https://...).'}
}
export function moveAction(actions: Action[], index: number, delta: number): Action[] {
  const next = [...actions]
  const target = index + delta
  if (index < 0 || index >= next.length || target < 0 || target >= next.length) return next
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}
