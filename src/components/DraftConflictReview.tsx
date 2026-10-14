import {useState} from 'react'
import {reconcileDraft,type DraftConflictError} from '../lib/draftRecovery'
export function DraftConflictReview({conflict,onResolve}:{conflict:DraftConflictError;onResolve:(content:ReturnType<typeof reconcileDraft>['content'])=>void}){
 const [choices,setChoices]=useState<Record<string,'local'|'remote'>>({})
 const result=reconcileDraft(conflict.base.content,conflict.local,conflict.latest.content,choices)
 const show=(v:unknown)=>v===undefined?'Item removido':typeof v==='string'?v:JSON.stringify(v,null,2)
 return <section aria-label="Recuperar alterações em conflito"><h2>Escolha o conteúdo dos campos em conflito</h2><p>Alterações em campos diferentes serão combinadas. As duas versões permanecem em cópias locais. Nada será gravado até você revisar e clicar em Salvar.</p>{conflict.conflicts.map(c=><fieldset key={c.path}><legend>{c.path}</legend><label><input type="radio" name={c.path} checked={choices[c.path]==='local'} onChange={()=>setChoices({...choices,[c.path]:'local'})}/>Minha edição<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{show(c.local)}</pre></label><label><input type="radio" name={c.path} checked={choices[c.path]==='remote'} onChange={()=>setChoices({...choices,[c.path]:'remote'})}/>Versão do banco<pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{show(c.remote)}</pre></label></fieldset>)}<button disabled={result.conflicts.length>0} onClick={()=>onResolve(result.content)}>Preparar versão recuperada para revisão</button></section>
}
