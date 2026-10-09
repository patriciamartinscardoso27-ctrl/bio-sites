import {sitePalette} from '../lib/identityPalette'
import {VisualColor} from './VisualAppearancePanel'
import {lazy,Suspense,useState} from 'react'
import type {Action,Bio} from '../types/biosite'
import {ActionIcon} from './ActionIcon'
import {buttonAppearanceMode,brandPresentation} from '../lib/brandButtonAppearance'
import {setButtonAppearanceMode,editableActionVisual,actionAppearancePatch} from '../lib/buttonColors'
const IconPicker=lazy(()=>import('./IconPicker'))
export function ActionIconPicker({action,bio,onChange}:{action:Action;bio:Bio;onChange:(patch:Partial<Action>)=>void}){
 const [open,setOpen]=useState(false),mode=buttonAppearanceMode(action)||'theme',visual=editableActionVisual(action,bio),google=action.icon==='google'||action.icon==='google-reviews'||action.kind==='reviews'&&!action.icon
 return <><button type="button" className="studio-secondary" onClick={()=>setOpen(true)}><ActionIcon action={action} size={24}/> Escolher ícone</button>
 <div className="studio-icon-colors">{([['brand','Original da marca'],['theme','Cor do tema'],['custom','Personalizada']] as const).map(([id,label])=><button key={id} disabled={id==='brand'&&!brandPresentation(action)} aria-pressed={mode===id} onClick={()=>onChange(setButtonAppearanceMode(action,bio,id))}>{label}</button>)}</div>
 {google&&<small>O símbolo do Google mantém suas cores originais. O botão pode usar marca, tema ou cores personalizadas.</small>}
 {mode==='custom'&&!google&&<VisualColor label="Cor do ícone" brand={bio.color} value={visual.colorBindings?.iconColor?sitePalette(bio)[visual.colorBindings.iconColor]:visual.iconColor||bio.color} onBind={token=>onChange({...actionAppearancePatch(action,bio,{...visual,iconColor:sitePalette(bio)[token]}),visual:{...visual,iconColor:sitePalette(bio)[token],colorBindings:{...visual.colorBindings,iconColor:token}}})} onChange={iconColor=>onChange(actionAppearancePatch(action,bio,{...visual,iconColor,colorBindings:{...visual.colorBindings,iconColor:undefined}}))}/>}
 {open&&<Suspense fallback={<p role="status">Abrindo biblioteca…</p>}><IconPicker action={action} bio={bio} onChange={onChange} onClose={()=>setOpen(false)}/></Suspense>}</>
}
