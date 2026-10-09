import {EditableText} from './EditableText'
import {actionSubtitle} from '../lib/actionText'
import { ArrowUpRight } from 'lucide-react'
import type { Bio,VisualSettings } from '../types/biosite'
import { actionDestination } from '../lib/actionLinks'
import { ActionIcon } from './ActionIcon'
import type {CSSProperties} from 'react'
import {buttonColors} from '../lib/buttonColors'
import '../styles/brandButtons.css'

export function QuickActions({ bio, className = 'shop-quick-actions',anchorFor,visual,columns }: { bio: Bio; className?: string;anchorFor?:(id:string)=>string;visual?:VisualSettings;columns?:number }) {
  const active=bio.actions.filter(a=>a.enabled!==false),iconArea=Math.max(24,visual?.iconSize||64,...active.map(a=>a.visual?.iconSize||0))
  return <div className={className} data-action-composition={visual?.actionFormat|| 'tiles'} style={{'--action-icon-area':visual?.heightPercent?`calc(${iconArea} * .25cqw)`:iconArea+'px','--action-columns':columns??(visual?.actionFormat==='rows'?1:visual?.columns||4),'--action-gap':(visual?.gap??10)+'px','--action-height':Math.max(90,visual?.buttonHeight||120)+'px'} as CSSProperties}>{bio.actions.filter(a => a.enabled !== false).map(action => {
    const { href, error,sectionId } = actionDestination(action, bio,anchorFor)
    const v=visual?{...visual,...action.visual}:action.visual,paint=buttonColors(visual?{...action,visual:v}:action,bio)
    const style={width:visual?iconArea:v?.iconSize,height:visual?iconArea:v?.iconSize,borderWidth:v?.borderWidth,borderStyle:v?.borderStyle||(v?.borderWidth?'solid':undefined),'--button-fill':paint.fill,'--button-icon':paint.icon,'--button-border':paint.border,'--button-hover':paint.hover,'--button-radius':v?.radiusPx!==undefined?v.radiusPx+'px':v?.radius?{square:'2px',rounded:'16px',pill:'50%'}[v.radius]:undefined,'--button-shadow':paint.shadow|| (v?.shadow?{none:'none',soft:'0 4px 14px #0003',strong:'0 8px 24px #0005'}[v.shadow]:undefined)} as CSSProperties
    const icon = <span className="action-icon-tile" data-editor-field="icon" data-button-painted={paint.painted||undefined} data-button-radius={v?.radius} data-button-shadow={v?.shadow} style={style}><ActionIcon action={action} color={paint.complete?paint.icon:undefined} size={v?.glyphSize?Math.max(16,v.glyphSize):v?.iconSize?Math.round(Math.min(48,v.iconSize*.5)):32}/></span>
    const content = <><span className="action-icon-slot">{icon}</span><span className="action-tile-label" style={{color:paint.text}}><EditableText owner={action} field="label" value={action.label} as="strong" style={visual?{fontSize:Math.max(11,v?.labelSize||12)}:undefined}/><EditableText owner={action} field="subtitle" value={actionSubtitle(action)} as="small" style={visual?{fontSize:Math.max(10,v?.subtitleSize||10)}:undefined}/><EditableText owner={action} field="description" value={action.description} as="small"/></span><ArrowUpRight size={13}/></>
    return href ? <a key={action.id} className={paint.complete?'action-button-presented':undefined} data-button-complete={paint.complete||undefined} data-appearance-mode={paint.appearanceMode}  data-action-id={action.id} aria-label={action.label||action.kind||'Ação'} href={href} onClick={sectionId?e=>{const container=e.currentTarget.closest('.premium-site,.biosite');const target=container?.querySelector(`[data-section-id="${CSS.escape(sectionId)}"]`);if(target){e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}}:undefined} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer" data-icon-position={v?.iconPosition} data-action-kind={action.kind || 'whatsapp'}>{content}</a> : <span key={action.id}  data-button-complete={paint.complete||undefined} data-appearance-mode={paint.appearanceMode} data-icon-position={v?.iconPosition} data-action-id={action.id} className={'unconfigured-action'+(paint.complete?' action-button-presented':'')} data-action-kind={action.kind||'whatsapp'} aria-disabled="true" title={error}>{content}</span>
  })}</div>
}

