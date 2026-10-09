import {ReferenceCreation} from './ReferenceCreation'
import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Scissors, Shirt, Sparkles, Utensils, CakeSlice, Wrench, Store, Check, Search } from 'lucide-react'
import { categories, readyTemplates as templates, createBio, createManualBio, personalizeModel, type QuickInfo } from '../data/templates'
import type { Bio, Template } from '../types/biosite'
import { BioSite } from './BioSite'
import { ImageField } from './ImageField'
import { SmartCreation } from './SmartCreation'

const icons=[Shirt,Scissors,Sparkles,Utensils,CakeSlice,Wrench,Store]
// The library lists every record, but mounts complete pages only near the viewport.
// A selected model still opens the same full renderer and shared editor.
function ModelThumbnail({bio}:{bio:Bio}){
  const container=useRef<HTMLDivElement>(null)
  const [visible,setVisible]=useState(typeof IntersectionObserver==='undefined')
  useEffect(()=>{if(typeof IntersectionObserver==='undefined'||!container.current)return;const observer=new IntersectionObserver(entries=>setVisible(entries.some(e=>e.isIntersecting)),{rootMargin:'150px'});observer.observe(container.current);return()=>observer.disconnect()},[])
  useEffect(()=>{const frame=container.current?.parentElement;if(!frame||typeof ResizeObserver==='undefined')return;const resize=()=>{if(container.current)container.current.style.transform=`scale(${frame.clientWidth/390})`};resize();const observer=new ResizeObserver(resize);observer.observe(frame);return()=>observer.disconnect()},[])
  return <div className="studio-model-render" ref={container} inert>{visible?<BioSite bio={bio} embedded/>:<div aria-hidden="true" style={{minHeight:600,background:bio.appearance?.background||'#f5eee7'}}/>}</div>
}
export function ModelLibrary({onUse,categoryId,onCategory}:{onUse:(template:Template)=>void;categoryId?:string;onCategory?:(id:string)=>void}){
  const [filter,setFilter]=useState(categoryId||'all')
  const [preview,setPreview]=useState<Template|null>(null)
  const [query,setQuery]=useState('')
  const current=categoryId||filter
  const normalize=(text:string)=>text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR')
  const matches=templates.filter(t=>(current==='all'||t.categoryId===current)&&normalize(t.label).includes(normalize(query.trim())))
  if(preview)return <div className="studio-model-full"><div className="studio-model-bar"><button onClick={()=>setPreview(null)}><ArrowLeft size={17}/> Voltar</button><strong>{preview.label}</strong><button className="studio-primary" onClick={()=>onUse(preview)}>Usar este modelo <ArrowRight size={16}/></button></div><BioSite bio={preview.bio}/></div>
  return <><div className="studio-library-tools"><label className="studio-search"><Search size={18}/><input type="search" aria-label="Buscar modelo por nome" placeholder="Busque pelo nome do modelo" value={query} onChange={e=>setQuery(e.target.value)}/></label><p role="status">{matches.length} de {templates.length} modelos</p></div><div className="studio-filters" aria-label="Categorias de modelos">{!categoryId&&<button className={current==='all'?'selected':''} onClick={()=>setFilter('all')}>Todos os modelos</button>}{categories.map(c=><button className={current===c.id?'selected':''} key={c.id} onClick={()=>{setFilter(c.id);onCategory?.(c.id)}}>{c.label}</button>)}</div><div className="studio-model-grid">{matches.map(t=><article className="studio-model-card" key={t.id}><button className="studio-model-phone" aria-label={`Abrir modelo ${t.label}`} onClick={()=>setPreview(t)}><div className="studio-phone-cutout"/><ModelThumbnail bio={t.bio}/><span className="studio-preview-caption">Toque para ver em tela cheia ↗</span></button><div className="studio-model-copy"><small>{categories.find(c=>c.id===t.categoryId)?.label}</small><h3>{t.label}</h3><p>{t.subtitle}</p><div><button className="studio-secondary" onClick={()=>setPreview(t)}>Visualizar</button><button className="studio-primary" onClick={()=>onUse(t)}>Usar modelo</button></div></div></article>)}</div>{!matches.length&&<div className="studio-empty"><h3>Nenhum modelo encontrado.</h3><p>Tente outro nome ou selecione outra categoria.</p><button className="studio-secondary" onClick={()=>setQuery('')}>Limpar busca</button></div>}</>
}
export function AdminCreation({onCreate,busy,initialTemplate}:{onCreate:(bio:Bio)=>Promise<boolean>;busy:boolean;initialTemplate?:Template|null}){
  const [step,setStep]=useState(initialTemplate?2:0)
  const [category,setCategory]=useState(initialTemplate?.categoryId||'')
  const [template,setTemplate]=useState<Template|null>(initialTemplate||null)
  const [manual,setManual]=useState(false)
  const [info,setInfo]=useState<QuickInfo>({name:'',categoryId:initialTemplate?.categoryId||'fashion',phone:'',instagram:'',address:'',logo:'',cover:''})
  const [images,setImages]=useState(false)
  const [error,setError]=useState('')
  const [mode,setMode]=useState<'smart'|'model'|'manual'|'ai'>('model')
  const prepared=useRef<{signature:string;bio:Bio}|null>(null)
  const choose=(value:Template)=>{if(value.bio.layoutPreset){if(!busy)void onCreate(createBio(value));return}setTemplate(value);setManual(false);setCategory(value.categoryId);setInfo(old=>({...old,categoryId:value.categoryId}));setStep(2);window.scrollTo(0,0)}
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return
    if(!info.name.trim()||!info.phone.trim()){setError('Informe o nome e o WhatsApp do estabelecimento.');return}
    const details={...info,name:info.name.trim(),categoryId:category,phone:info.phone.trim()}
    const signature=JSON.stringify({details,manual,template:template?.id,mode})
    let bio=manual?createManualBio(details):createBio(personalizeModel(template!,details))
    bio.client={city:info.address.trim()}
    if(prepared.current?.signature===signature)bio=prepared.current.bio
    else prepared.current={signature,bio}
    setError('');await onCreate(bio)
  }
  if(mode==='ai')return <ReferenceCreation onBack={()=>setMode('model')} onCreate={onCreate} busy={busy}/>
  if(mode==='smart'&&category&&step>0)return <SmartCreation categoryId={category} onBack={()=>{setStep(0);setCategory('')}} onCreate={onCreate} busy={busy}/>
  return <section className="studio-creation"><div className="studio-steps">{['Negócio','Modelo','Dados rápidos'].map((label,i)=><span key={label} className={step===i?'active':step>i?'complete':''}><b>{step>i?<Check size={13}/>:i+1}</b>{label}</span>)}</div>{step>0&&<button className="studio-back" disabled={busy} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/> Voltar</button>}{step===0?<><div className="studio-creation-modes">{([{id:"smart",label:"Criação inteligente",hint:"Composição nova"},{id:"model",label:"Escolher modelo",hint:"Modelos prontos"},{id:"ai",label:"✨ Criar com IA",hint:"Texto + referências visuais"},{id:"manual",label:"Criar do zero",hint:"Base profissional"}] as const).map(m=><button key={m.id} className={mode===m.id?"selected":""} onClick={()=>{setMode(m.id);setManual(m.id==="manual")}}><strong>{m.label}</strong><small>{m.hint}</small></button>)}</div><h2>Que tipo de negócio é?</h2><p>Escolha a categoria. Vamos cuidar do primeiro visual.</p><div className="studio-categories">{categories.map((c,i)=>{const Icon=icons[i]||Store;return <button key={c.id} onClick={()=>{setCategory(c.id);setInfo({...info,categoryId:c.id});setStep(mode==='manual'?2:1)}}><span><Icon size={27}/></span><strong>{c.label}</strong><small>{c.subtitle}</small><ArrowRight size={18}/></button>})}</div></>:step===1?<><h2>Escolha um modelo</h2><p>Modelos prontos para {categories.find(c=>c.id===category)?.label.toLowerCase()}. Veja antes de escolher.</p><ModelLibrary categoryId={category} onCategory={setCategory} onUse={choose}/><button className="studio-manual" onClick={()=>{setManual(true);setTemplate(null);setStep(2)}}><Sparkles size={18}/><span><strong>Criar do zero</strong><small>Uma base simples para montar do seu jeito.</small></span><ArrowRight size={18}/></button></>:<div className="studio-quick-layout"><form className="studio-panel studio-quick-form" onSubmit={event=>void submit(event)}><span className="studio-kicker">QUASE PRONTO</span><h2>O essencial. Só isso.</h2><p>O restante você edita direto no BioSite.</p><label>Nome do estabelecimento<input autoFocus maxLength={300} required value={info.name} onChange={e=>setInfo({...info,name:e.target.value})}/></label><label>WhatsApp<input type="tel" inputMode="tel" autoComplete="tel" required placeholder="55 + DDD + número" value={info.phone} onChange={e=>setInfo({...info,phone:e.target.value})}/></label><label>Instagram <small>opcional</small><input placeholder="@perfil ou link" value={info.instagram} onChange={e=>setInfo({...info,instagram:e.target.value})}/></label><label>Cidade <small>opcional</small><input value={info.address} onChange={e=>setInfo({...info,address:e.target.value})}/></label><div className="studio-image-choice"><strong>Logo e capa</strong><div><button type="button" className={images?'selected':''} onClick={()=>setImages(true)}>Adicionar agora</button><button type="button" className={!images?'selected':''} onClick={()=>setImages(false)}>Fazer depois</button></div></div>{images&&<><ImageField label="Logo" value={info.logo} onChange={logo=>setInfo({...info,logo})}/><ImageField label="Capa" value={info.cover} onChange={cover=>setInfo({...info,cover})}/></>}{error&&<p className="studio-error" role="alert">{error}</p>}<button className="studio-primary studio-create-submit" disabled={busy} type="submit">{busy?'Criando no Neon…':'Criar BioSite'}<ArrowRight size={17}/></button></form><aside className="studio-chosen"><span className="studio-kicker">SEU PONTO DE PARTIDA</span><h3>{manual?'Criar do zero':template?.label}</h3><p>{categories.find(c=>c.id===category)?.label}</p><div className="studio-chosen-screen" inert><BioSite bio={manual?createManualBio(info):template!.bio} embedded/></div><small>Você poderá personalizar tudo no editor visual.</small></aside></div>}</section>
}

