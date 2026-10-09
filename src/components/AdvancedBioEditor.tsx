import {PaletteContext} from './PaletteTools'
import {useState} from 'react'
import type {Bio} from '../types/biosite'
import {ButtonsEditor} from './ButtonsEditor'
import {DesignPanel,SectionsPanel} from './VisualDesignPanels'
import {ImageField} from './ImageField'
import {ContextualSectionEditor} from './ContextualSectionEditor'
import {fieldNames} from '../lib/editorTargets'
import {ContextualItemEditor} from './ContextualItemEditor'
import {sectionContent,setSectionContent} from '../lib/sections'
type Props={bio:Bio;onChange:(p:Partial<Bio>)=>void}
export function AdvancedBioEditor(props:Props){return <PaletteContext.Provider value={{bio:props.bio,onChange:props.onChange}}><AdvancedBioEditorContent {...props}/></PaletteContext.Provider>}
function AdvancedBioEditorContent({bio,onChange}:Props){
 const [tab,setTab]=useState('Dados'),[selected,setSelected]=useState<string|null>(null),[itemId,setItemId]=useState<string|null>(null),section=bio.sections.find(s=>s.id===selected),items=section?sectionContent(bio,section).items||[]:[],item=items.find(i=>i.id===itemId)
 return <section className="studio-panel studio-advanced"><div className="studio-filters">{['Dados','Botões','Aparência','Conteúdo'].map(t=><button key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>{tab==='Dados'?<>{(['name','description','phone','instagram','address','hours','headline','tagline','telephone','email','facebook','tiktok','reviewsUrl','mapsUrl','website','menuUrl'] as const).map(key=><label key={key}>{fieldNames[key]}<input value={bio[key]||''} onChange={e=>onChange({[key]:e.target.value})}/></label>)}<ImageField label="Logo" value={bio.logo} onChange={logo=>onChange({logo})}/><ImageField label="Capa" value={bio.cover} onChange={cover=>onChange({cover})}/></>:tab==='Botões'?<ButtonsEditor bio={bio} onChange={actions=>onChange({actions})}/>:tab==='Aparência'?<DesignPanel bio={bio} onChange={onChange}/>:<><SectionsPanel bio={bio} onChange={onChange} onEdit={setSelected}/>{section&&<ContextualSectionEditor key={section.id} bio={bio} section={section} onChange={onChange} onRemoved={()=>setSelected(null)} onDuplicated={setSelected} onItem={(_key,id)=>setItemId(id)}/>}{section&&item&&<ContextualItemEditor key={item.id} bio={bio} item={item} section={section} onChange={patch=>onChange(setSectionContent(bio,section,{items:items.map(i=>i.id===item.id?{...i,...patch}:i)}))} onBioChange={onChange} onDuplicate={()=>{const copy={...structuredClone(item),id:crypto.randomUUID(),action:item.action?{...item.action,id:crypto.randomUUID()}:undefined};onChange(setSectionContent(bio,section,{items:[...items,copy]}));setItemId(copy.id)}} onRemove={()=>{onChange(setSectionContent(bio,section,{items:items.filter(i=>i.id!==item.id)}));setItemId(null)}} onSection={()=>setItemId(null)}/>}</>}</section>
}
