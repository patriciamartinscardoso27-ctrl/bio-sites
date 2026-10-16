import {useEffect,useRef,useState} from 'react'
import type {Bio} from '../types/biosite'
import {BioSite} from './BioSite'
import {biositesApi,type BioSiteSummary} from '../lib/biositesApi'
import {assertPremiumPackage,premiumPackageMaxBytes,type PremiumDesignPackage} from '../lib/premiumDesignPackage'
import '../styles/premiumDesignImport.css'

async function request(value:unknown){
 const response=await fetch('/api/design-package',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),signal:AbortSignal.timeout(30000)})
 if(response.status===401)window.dispatchEvent(new Event('biosite-session-expired'))
 let result:{bio?:Bio;package?:PremiumDesignPackage;error?:string}
 try{result=await response.json()}catch{throw Error(`HTTP ${response.status}: o servidor não retornou JSON válido.`)}
 if(!response.ok)throw Error(`HTTP ${response.status}: ${result.error||'Não foi possível validar o pacote.'}`)
 return result
}
export function PremiumDesignImport({onBack,onCreate,busy}:{onBack:()=>void;onCreate:(bio:Bio)=>Promise<boolean>;busy:boolean}){
 const [sites,setSites]=useState<BioSiteSummary[]>([]),[selected,setSelected]=useState(''),[candidate,setCandidate]=useState<Bio|null>(null),[source,setSource]=useState<Bio|null>(null),[error,setError]=useState(''),[working,setWorking]=useState(false),[info,setInfo]=useState('')
 const version=useRef(0),alive=useRef(true)
 useEffect(()=>{alive.current=true;void biositesApi.list().then(rows=>{if(alive.current)setSites(rows)}).catch(()=>{if(alive.current)setInfo('A lista de clientes não pôde ser carregada. Você ainda pode importar um pacote JSON.')});return()=>{alive.current=false;version.current++}},[])
 const run=async(task:(current:()=>boolean)=>Promise<void>)=>{
  if(working||busy)return
  const v=++version.current;setWorking(true);setError('');setCandidate(null);setSource(null)
  try{await task(()=>alive.current&&version.current===v)}catch(e){if(alive.current&&version.current===v)setError(e instanceof Error?e.message:'Não foi possível abrir o pacote.')}finally{if(alive.current&&version.current===v)setWorking(false)}
 }
 const loadExisting=()=>run(async current=>{
  const saved=await biositesApi.get(selected),result=await request({operation:'export',bio:saved.content})
  if(!result.package)throw Error('O servidor não retornou o pacote.')
  assertPremiumPackage(result.package)
  const imported=await request({operation:'import',package:result.package})
  if(!imported.bio)throw Error('O servidor não retornou a prévia.')
  if(current()){setSource(saved.content);setCandidate(imported.bio);setInfo('Exportação e reimportação concluídas em memória. O cliente original foi preservado.')}
 })
 const upload=(file:File)=>run(async current=>{
  if(/\.zip$/i.test(file.name))throw Error('Nesta etapa, envie .biosite.json. Pacotes ZIP ainda não são suportados.')
  if(!file.size||file.size>premiumPackageMaxBytes)throw Error('Envie um pacote JSON de até 4 MB.')
  let pack:unknown;try{pack=JSON.parse(await file.text())}catch{throw Error('O arquivo não contém JSON válido.')}
  assertPremiumPackage(pack)
  const result=await request({operation:'import',package:pack})
  if(!result.bio)throw Error('O servidor não retornou a prévia.')
  if(current()){setCandidate(result.bio);setInfo('Pacote validado. Confira a prévia antes de aprovar a criação do rascunho.')}
 })
 const download=async()=>{
  if(!candidate||working||busy)return
  setWorking(true);setError('')
  try{
   const result=await request({operation:'export',bio:source||candidate})
   if(!result.package)throw Error('Pacote ausente.')
   const blob=new Blob([JSON.stringify(result.package)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a')
   a.href=url;a.download=(candidate.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').toLowerCase()||'design')+'.biosite.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível exportar.')}finally{if(alive.current)setWorking(false)}
 }
 return <section className="premium-import studio-panel">
  <button className="studio-back" disabled={working||busy} onClick={onBack}>← Voltar</button>
  <small className="studio-kicker">PACOTE ESTRUTURADO · SEM GERAÇÃO POR IA</small>
  <h2>Importar Design Premium</h2>
  <p>Importe uma composição JSON validada ou exporte e reimporte um BioSite existente. A prévia usa o mesmo renderizador da página real.</p>
  <div className="premium-import-controls">
   <label>Exportar um BioSite existente<select aria-label="BioSite para exportar" disabled={working||busy} value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Selecione, por exemplo, Xavier Modas</option>{sites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
   <button className="studio-secondary" disabled={!selected||working||busy} onClick={()=>void loadExisting()}>Exportar e conferir reimportação</button>
   <label>Importar pacote .biosite.json<input aria-label="Importar pacote de design" type="file" accept=".json,application/json" disabled={working||busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void upload(file)}}/></label>
  </div>
  <p>Etapa 1: o JSON preserva as imagens por referência ou dados incorporados. Arquivos locais precisam existir nesta instalação. ZIP com imagens próprias será uma etapa posterior.</p>
  {working&&<p role="status">Validando composição…</p>}{error&&<p role="alert" className="studio-error">{error}</p>}{info&&<p role="status">{info}</p>}
  {candidate&&<>
   <div className="premium-import-actions"><button className="studio-secondary" disabled={working||busy} onClick={()=>void download()}>Baixar pacote JSON</button><button className="studio-primary" disabled={working||busy} onClick={()=>{setError('');void onCreate(candidate).catch(e=>setError(e instanceof Error?e.message:'Não foi possível criar o rascunho.'))}}>{busy?'Criando rascunho…':'Aprovar e criar novo rascunho'}</button></div>
   <p>A aprovação cria outro BioSite. Fotos, textos, produtos e links poderão ser editados no painel existente. Nenhuma publicação é feita por esta tela.</p>
   <div className="premium-import-comparison">{source&&<div><h3>Original</h3><div className="premium-import-page"><BioSite bio={source} embedded/></div></div>}<div><h3>{source?'Reimportado':'Prévia real'}</h3><div className="premium-import-page" data-premium-import-preview><BioSite bio={candidate} embedded/></div></div></div>
  </>}
 </section>
}
