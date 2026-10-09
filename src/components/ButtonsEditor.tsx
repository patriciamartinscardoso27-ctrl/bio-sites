import {ActionIconPicker} from './ActionIconPicker'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, Trash2, X } from 'lucide-react'
import type { Action, Bio } from '../types/biosite'
import { actionDestination, actionKind, actionTypes, businessValue, createAction, isFlexible, isWhatsApp, moveAction } from '../lib/actionLinks'
import { changeActionType } from '../lib/visualDesign'
import { InternalDestinationPicker } from './InternalDestinationPicker'
import { ActionIcon } from './ActionIcon'

export function ButtonsEditor({ bio, onChange }: { bio: Bio; onChange: (actions: Action[]) => void }) {
  const [choosing, setChoosing] = useState(false)
  const [open, setOpen] = useState<string | null>(null)
  const patch = (id: string, changes: Partial<Action>) => onChange(bio.actions.map(a => a.id === id ? { ...a, ...changes } : a))
  return <div className="buttons-editor">
    <div className="collection-heading"><span>{bio.actions.filter(a => a.enabled !== false).length} de {bio.actions.length} botões ativos</span><button className="small-button" onClick={() => setChoosing(!choosing)}>{choosing ? <X size={14}/> : <Plus size={14}/>} {choosing ? 'Cancelar' : 'Adicionar botão'}</button></div>
    {choosing && <div className="button-type-picker"><h3>Tipo do botão</h3><p>Escolha o destino. O ícone já vem pronto.</p><div>{actionTypes.map(type => <button key={type.kind} onClick={() => { const action = createAction(type.kind, bio); onChange([...bio.actions, action]); setOpen(action.id); setChoosing(false) }}><ActionIcon action={{ id: '', kind: type.kind, label: '', message: '' }} size={17}/><span>{type.name}</span><Plus size={12}/></button>)}</div></div>}
    {bio.actions.map((action, index) => {
      const kind = actionKind(action)
      const definition = actionTypes.find(t => t.kind === kind)!
      const destination = actionDestination(action, bio)
      const reuseValue = businessValue(action, bio)
      const reuse = action.source !== 'custom'
      const whatsapp = isWhatsApp(action)
      const flexible = isFlexible(kind)
      return <div className={`button-editor-card ${action.enabled === false ? 'button-inactive' : ''}`} key={action.id} data-button-id={action.id}>
        <div className="button-editor-row"><button className="button-editor-title" aria-expanded={open === action.id} aria-label={`Editar botão ${action.label}`} onClick={() => setOpen(open === action.id ? null : action.id)}><span className="button-type-icon"><ActionIcon action={action} size={18}/></span><span><strong>{action.label || definition.label}</strong><small>{definition.name}{destination.error ? ' · falta configurar' : ''}</small></span><ChevronDown size={14}/></button>
          <div className="button-row-controls"><button aria-label={`Subir botão ${action.label}`} disabled={index === 0} onClick={() => onChange(moveAction(bio.actions, index, -1))}><ChevronUp size={16}/></button><button aria-label={`Descer botão ${action.label}`} disabled={index === bio.actions.length - 1} onClick={() => onChange(moveAction(bio.actions, index, 1))}><ChevronDown size={16}/></button><button className={`toggle ${action.enabled !== false ? 'on' : ''}`} role="switch" aria-checked={action.enabled !== false} aria-label={`Ativar botão ${action.label}`} onClick={() => patch(action.id, { enabled: action.enabled === false })}><span/></button></div>
        </div>
        {open === action.id && <div className="button-editor-fields">
          <label>Tipo<select value={kind} onChange={e=>onChange(bio.actions.map(a=>a.id===action.id?changeActionType(a,e.target.value as typeof kind,bio):a))}>{actionTypes.map(t=><option key={t.kind} value={t.kind}>{t.name}</option>)}</select></label><label>Subtítulo<input value={action.subtitle||''} onChange={e=>patch(action.id,{subtitle:e.target.value})}/></label><label>Texto exibido<input value={action.label} placeholder={definition.label} onChange={e => patch(action.id, { label: e.target.value })}/></label>
          <InternalDestinationPicker bio={bio} action={action} onChange={changes=>patch(action.id,changes)}/>{action.destination!=='section'&&<>{flexible && <div className="button-destination-mode" role="group" aria-label="Destino do botão"><button aria-pressed={action.mode !== 'url'} onClick={() => patch(action.id, { mode: 'whatsapp', source: bio.phone ? 'business' : 'custom' })}>WhatsApp</button><button aria-pressed={action.mode === 'url'} onClick={() => patch(action.id, { mode: 'url', source: 'custom' })}>URL externa</button></div>}
          {reuseValue && <label className="reuse-contact"><input type="checkbox" checked={reuse} onChange={e => patch(action.id, { source: e.target.checked ? 'business' : 'custom' })}/><span>Usar {whatsapp ? 'WhatsApp' : kind === 'location' ? 'localização' : definition.name.toLowerCase()} do estabelecimento<small>{reuseValue}</small></span></label>}
          {reuse && <div className="reused-value">{reuseValue ? 'Dados vinculados às informações do estabelecimento.' : 'Preencha nas informações do estabelecimento ou use um destino próprio.'}{!reuseValue && <button onClick={() => patch(action.id, { source: 'custom' })}>Preencher neste botão</button>}</div>}
          {!reuse && (whatsapp || kind === 'phone') && <label>{whatsapp ? 'Número do WhatsApp (país + DDD)' : 'Número de telefone'}<input inputMode="tel" value={action.number || ''} placeholder={whatsapp ? '5511999990000' : '+55 11 3333-0000'} onChange={e => patch(action.id, { number: e.target.value })}/></label>}
          {!reuse && kind === 'email' && <label>Endereço de e-mail<input type="email" value={action.email || ''} placeholder="contato@exemplo.com" onChange={e => patch(action.id, { email: e.target.value })}/></label>}
          {!reuse && !whatsapp && !['phone', 'email'].includes(kind) && <label>{kind === 'instagram' ? 'URL do perfil no Instagram' : kind === 'reviews' ? 'URL direta para avaliação no Google' : kind === 'location' ? 'URL do Google Maps' : kind === 'menu' ? 'URL do cardápio' : 'URL de destino'}<input aria-label={kind === 'instagram' ? 'URL do perfil no Instagram' : kind === 'reviews' ? 'URL direta para avaliação no Google' : kind === 'location' ? 'URL do Google Maps' : kind === 'menu' ? 'URL do cardápio' : 'URL de destino'} type="url" value={action.url || ''} placeholder="https://..." onChange={e => patch(action.id, { url: e.target.value })}/>{kind === 'reviews' && <small>Use o link de avaliação fornecido pelo Perfil da Empresa no Google.</small>}</label>}
          {whatsapp && <label>Mensagem pré-preenchida (opcional)<textarea aria-label="Mensagem pré-preenchida (opcional)" rows={2} value={action.message} placeholder="Olá! Gostaria de saber mais." onChange={e => patch(action.id, { message: e.target.value })}/></label>}
          </>}<ActionIconPicker bio={bio} action={action} onChange={changes=>patch(action.id,changes)}/>
          <div className={`button-link-status ${destination.error ? 'needs-value' : ''}`} role="status">{destination.error || 'Destino pronto. A prévia já foi atualizada.'}</div>
          <button className="delete-button" onClick={() => { onChange(bio.actions.filter(a => a.id !== action.id)); setOpen(null) }}><Trash2 size={13}/> Remover botão</button>
        </div>}
      </div>
    })}
    {!bio.actions.length && !choosing && <p className="help">Adicione seu primeiro botão. Escolha o tipo e preencha só o necessário.</p>}
  </div>
}

