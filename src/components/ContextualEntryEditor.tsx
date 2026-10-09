import {collectionAction} from '../lib/editableActions'
import {ContextualActionEditor} from './ContextualActionEditor'
import {ActionIconPicker} from './ActionIconPicker'
import {VisualAppearancePanel} from './VisualAppearancePanel'
import {useState} from 'react'
import type {Bio,Section,TextOptions,Action} from '../types/biosite'
import {sectionContent,setSectionContent} from '../lib/sections'
import {entryTextKey,entryTextOwner} from '../lib/entryText'
import {RemoveItemControl} from './RemoveItemControl'
import {ImageField} from './ImageField'
import {TextField,TextAppearance} from './TextControls'
export function ContextualEntryEditor({bio,section,collection,index,part,onChange,onRemoved,field}:{field?:string;part?:'image';bio:Bio;section:Section;collection:'photos'|'benefits'|'reviews'|'highlights';index:number;onChange:(p:Partial<Bio>)=>void;onRemoved:()=>void}){
 const faq=collection==='highlights'&&section.id.endsWith('-faq')
 const [tab,setTab]=useState(part==='image'&&collection==='highlights'?'Imagem':field==='icon'?'Aparência':field==='action'||field==='link'?'Ação':'Conteúdo'),content=sectionContent(bio,section),values=collection==='reviews'?section.text.split('\n'):content[collection]||[],value=values[index]
 if(value===undefined)return null
 const change=(next:typeof values)=>onChange(collection==='reviews'?{sections:bio.sections.map(s=>s.id===section.id?{...s,text:next.join('\n')}:s)}:setSectionContent(bio,section,{[collection]:next}))
 const patch=(next:typeof value)=>{
  const nextValues=values.map((v,i)=>i===index?next:v) as typeof values
  if(typeof value==='string'&&typeof next==='string'&&collection!=='photos'){
   const oldKey=entryTextKey(collection,value),newKey=entryTextKey(collection,next),options={...section.entryTextOptions},icons={...section.entryIcons}
   if(icons[oldKey]){icons[newKey]=icons[oldKey];if(oldKey!==newKey)delete icons[oldKey]}
   if(options[oldKey]){options[newKey]=options[oldKey];if(oldKey!==newKey)delete options[oldKey]}
   const changes=collection==='reviews'?{sections:bio.sections.map(s=>s.id===section.id?{...s,text:nextValues.join('\n')}:s)}:setSectionContent(bio,section,{[collection]:nextValues})
   onChange({...changes,sections:changes.sections!.map(s=>s.id===section.id?{...s,entryTextOptions:options,entryIcons:icons}:s)})
  }else change(nextValues)
 }
 const option=(key:'title'|'description'|'caption'|'label')=>typeof value==='object'?value.textOptions?.[key as 'label'|'caption']:entryTextOwner(section,collection,String(value)).textOptions?.[key as 'title'|'description']
 const setOption=(key:string,next:TextOptions)=>{
  if(typeof value==='object')patch({...value,textOptions:{...value.textOptions,[key]:next}})
  else {const id=entryTextKey(collection,String(value));onChange({sections:bio.sections.map(s=>s.id===section.id?{...s,entryTextOptions:{...s.entryTextOptions,[id]:{...s.entryTextOptions?.[id],[key]:next}}}:s)})}
 }
 const keys=collection==='highlights'?['label','caption'] as const:['title','description'] as const
 const [title,...rest]=String(value).split('|'),description=rest.join('|')
 const iconKey=entryTextKey(collection,String(value)),icon:Action=section.entryIcons?.[iconKey]||{id:iconKey,kind:'custom',label:title,message:'',icon:(['delivery','check','heart'] as const)[index%3]};const changeIcon=(changes:Partial<Action>)=>onChange({sections:bio.sections.map(s=>s.id===section.id?{...s,entryIcons:{...s.entryIcons,[iconKey]:{...icon,...changes}}}:s)});
 return <>{collection!=='photos'&&<div className="studio-context-tabs">{(faq?['Conteúdo','Aparência']:['Conteúdo','Imagem','Aparência',...(collection==='highlights'?['Ação']:[])]).map(t=><button key={t} aria-pressed={tab===t} onClick={()=>setTab(t)}>{t}</button>)}</div>}{tab==='Ação'&&typeof value==='object'&&<ContextualActionEditor embedded field="link" bio={bio} action={collectionAction(bio,value)} onChange={changes=>patch({...value,action:{...collectionAction(bio,value),...changes}})} onBioChange={onChange} onDuplicate={()=>{}} onRemove={()=>patch({...value,action:undefined})} onSection={()=>{}}/>}{tab==='Imagem'&&typeof value==='object'&&<ImageField aspect={section.visual?.mediaAspect?section.visual.mediaAspect/100:undefined} label="Imagem" value={value.image} onChange={image=>patch({...value,image})}/>} {tab==='Conteúdo'&&(collection==='photos'?<ImageField aspect={section.visual?.mediaAspect?section.visual.mediaAspect/100:undefined} label="Foto" value={String(value)} onChange={patch}/>:<>{keys.map(key=><TextField key={key} field={key} label={faq?key==='caption'?'Resposta':'Pergunta':key==='description'?collection==='reviews'?'Depoimento':'Descrição':key==='caption'?'Legenda':'Título'} value={typeof value==='object'?key==='caption'?value.caption??(/roupas/i.test(bio.category)?'Ver peças':'Ver opções'):value.label:key==='title'?title:description} option={option(key)} onValue={text=>typeof value==='object'?patch({...value,[key]:text}):patch(key==='title'?text.replaceAll('|',' ')+'|'+description:title+'|'+text.replaceAll('|',' '))} onOption={next=>setOption(key,next)}/>)}{!faq&&typeof value==='object'&&<ImageField label="Imagem" value={value.image} onChange={image=>patch({...value,image})}/>}</>)}{tab==='Aparência'&&!faq&&collection==='highlights'&&typeof value==='object'&&<ActionIconPicker bio={bio} action={collectionAction(bio,value)} onChange={changes=>patch({...value,action:{...collectionAction(bio,value),...changes}})}/>} {tab==='Aparência'&&collection==='benefits'&&<><ActionIconPicker bio={bio} action={icon} onChange={changeIcon}/><VisualAppearancePanel bio={bio} scope="action" action={icon} value={icon.visual} onChange={visual=>changeIcon({visual})} onRestore={()=>changeIcon({visual:undefined})}/></>}{tab==='Aparência'&&keys.map(key=><TextAppearance key={key} bio={bio} label={faq?key==='caption'?'Resposta':'Pergunta':key==='description'?'Descrição':key==='caption'?'Legenda':'Título'} option={option(key)} onChange={next=>setOption(key,next)}/>)}<RemoveItemControl label={collection==='photos'?'Foto '+(index+1):typeof value==='object'?value.label:String(value).split('|')[0]} onRemove={()=>{change(values.filter((_,i)=>i!==index) as typeof values);onRemoved()}}/></>
}
