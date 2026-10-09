import { useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronDown, ChevronUp, Eye, Sparkles } from 'lucide-react'
import { categories, createBio, createManualBio, personalizeModel, labels, type QuickInfo } from '../data/templates'
import type { Bio, Template } from '../types/biosite'
import { TemplatePicker } from './TemplatePicker'
import { ImageField } from './ImageField'
import { AppearanceFields } from './AppearanceFields'
import { BioSite } from './BioSite'

export function CreateBioFlow({ onCreate }: { onCreate:(bio:Bio)=>void }) {
  const [info,setInfo] = useState<QuickInfo>({name:'',categoryId:'fashion',phone:'',instagram:'',address:'',logo:'',cover:''})
  const [step,setStep] = useState<'info'|'models'|'visual'|'content'|'organization'|'preview'>('info')
  const [manual,setManual] = useState(false)
  const [draft,setDraft] = useState<Bio|null>(null)
  const [error,setError] = useState('')
  const patch = (value:Partial<Bio>) => setDraft(old=>old ? {...old,...value}:old)
  const next = () => {
    if(!info.name.trim()){setError('Informe o nome do estabelecimento.');return}
    setError('')
    if(manual){setDraft(createManualBio(info));setStep('visual')}else setStep('models')
    window.scrollTo({top:0,behavior:'smooth'})
  }
  const choose = (template:Template) => onCreate(createBio(personalizeModel(template,info)))
  const move = (i:number,delta:number) => {if(!draft)return;const sections=[...draft.sections];const target=i+delta;if(target<0||target>=sections.length)return;[sections[i],sections[target]]=[sections[target],sections[i]];patch({sections})}
  const field = (label:string,key:'name'|'phone'|'instagram'|'address'|'description',multiline=false) => <label>{label}{multiline ? <textarea value={info[key] || ''} onChange={e=>setInfo({...info,[key]:e.target.value})} rows={2}/> : <input value={info[key] || ''} inputMode={key==='phone'?'tel':undefined} onChange={e=>setInfo({...info,[key]:e.target.value})}/>}</label>
  const steps = manual ? ['Informações','Visual','Conteúdo','Organização','Prévia'] : ['Informações','Modelo','Prévia']
  const current = manual ? ['info','visual','content','organization','preview'].indexOf(step) : step==='models'?1:0
  return <div className="create-flow"><div className="creation-steps">{steps.map((label,i)=><span className={i===current?'current':i<current?'done':''} key={label}>{i+1}. {label}</span>)}</div>
    {step==='info' ? <div className="panel creation-info"><div className="panel-heading"><div><h2>{manual?'Criar do Zero':'Preenchimento rápido'}</h2><p>Preencha uma vez. Veja os modelos com os dados do cliente.</p></div><Sparkles size={20}/></div>{field('Nome do estabelecimento *','name')}<label>Categoria<select value={info.categoryId} onChange={e=>setInfo({...info,categoryId:e.target.value})}>{categories.map(c=><option value={c.id} key={c.id}>{c.label}</option>)}</select></label>{manual && field('Descrição curta','description',true)}{field('WhatsApp (país + DDD + número)','phone')}{field('Instagram (URL ou @perfil)','instagram')}{field('Cidade / localização','address')}<details className="advanced-details"><summary>Logo e capa (opcionais) <ChevronDown size={16}/></summary><ImageField label="Logo" value={info.logo} onChange={logo=>setInfo({...info,logo})}/><ImageField label="Foto de capa" value={info.cover} onChange={cover=>setInfo({...info,cover})}/></details>{error && <p role="alert" className="creation-error">{error}</p>}<button className="button primary next-step" onClick={next}>{manual?'Escolher visual':'Ver os 3 modelos'}<ArrowRight size={16}/></button><button className="manual-option" onClick={()=>setManual(!manual)}><Sparkles size={18}/><div><strong>{manual?'Prefiro usar um modelo pronto':'Criar do Zero'}</strong><p>{manual?'Voltar à biblioteca de modelos.':'Começar com uma base pronta e personalizar em cinco passos.'}</p></div></button></div>
    : step==='models' ? <><button className="button secondary creation-back" onClick={()=>setStep('info')}><ArrowLeft size={16}/> Ajustar informações</button><TemplatePicker categoryId={info.categoryId} onCategory={categoryId=>{if(categoryId)setInfo({...info,categoryId});else setStep('info')}} onSelect={choose} onManual={()=>{setManual(true);setDraft(createManualBio(info));setStep('visual')}} info={info}/></>
    : draft ? <><div className="panel manual-step"><div className="panel-heading"><div><h2>{step==='visual'?'Escolha um visual simples':step==='content'?'O que você quer mostrar?':step==='organization'?'Organize sua página':'Sua prévia está pronta'}</h2><p>{step==='content'?'A base já tem conteúdo demonstrativo. Você poderá editar tudo no painel.':step==='organization'?'Use as setas para colocar cada seção na ordem que preferir.':'A prévia acompanha suas escolhas.'}</p></div></div>{step==='visual' ? <AppearanceFields bio={draft} onChange={patch}/> : step==='content' ? <div className="manual-section-list">{draft.sections.map(s=><div className="section-row" key={s.id}><strong>{labels[s.kind]}</strong><button className={`toggle ${s.enabled?'on':''}`} role="switch" aria-label={`Exibir ${labels[s.kind]}`} aria-checked={s.enabled} onClick={()=>patch({sections:draft.sections.map(x=>x.id===s.id?{...x,enabled:!x.enabled}:x)})}><span/></button></div>)}</div> : step==='organization' ? <div className="manual-section-list">{draft.sections.map((s,i)=><div className="section-row" key={s.id}><strong>{labels[s.kind]}</strong><button disabled={i===0} aria-label={`Subir ${labels[s.kind]}`} onClick={()=>move(i,-1)}><ChevronUp size={18}/></button><button disabled={i===draft.sections.length-1} aria-label={`Descer ${labels[s.kind]}`} onClick={()=>move(i,1)}><ChevronDown size={18}/></button></div>)}</div> : <div className="manual-preview"><BioSite bio={draft} embedded/></div>}</div><div className="manual-step-actions"><button className="button secondary" onClick={()=>setStep(step==='visual'?'info':step==='content'?'visual':step==='organization'?'content':'organization')}><ArrowLeft size={16}/> Voltar</button><button className="button primary" onClick={()=>{if(step==='preview')onCreate(draft);else{setStep(step==='visual'?'content':step==='content'?'organization':'preview');window.scrollTo({top:0,behavior:'smooth'})}}}>{step==='preview'?'Criar BioSite':'Continuar'}{step==='organization'?<Eye size={16}/>:<ArrowRight size={16}/>}</button></div>{step==='visual' && <details className="manual-live"><summary>Ver prévia do visual <Eye size={15}/></summary><div className="manual-preview"><BioSite bio={draft} embedded/></div></details>}</> : null}
  </div>
}
