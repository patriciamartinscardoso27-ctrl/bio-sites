import { useEffect, useState } from 'react'
import { LockKeyhole, LogOut, Sparkles } from 'lucide-react'
import App from '../App'
import '../styles/adminAuth.css'
import { recoveryLocation } from '../lib/passwordRecovery'

async function authRequest(path:string,body?:unknown) {
  const response=await fetch('/api/auth/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(25000)})
  const data=await response.json()
  if(!response.ok)throw new Error(data.error||'Não foi possível confirmar sua sessão.')
  return data as {authenticated:boolean}
}
export function AdminAuth() {
  if(['/forgot-password','/reset-password'].includes(window.location.pathname))return <PasswordRecovery/>
  return <AdminLogin/>
}
function PasswordRecovery() {
  const resetting=window.location.pathname==='/reset-password'
  const [recovery]=useState(()=>recoveryLocation(window.location.href))
  const token=recovery.token
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [confirmation,setConfirmation]=useState('')
  const [busy,setBusy]=useState(false)
  const [done,setDone]=useState(false)
  const [error,setError]=useState(resetting&&!token?'Link inválido ou expirado. Solicite outro link.':'')
  useEffect(()=>{window.history.replaceState(null,'',resetting?recovery.cleanUrl:'/forgot-password')},[resetting,recovery])
  const submit=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return
    if(resetting&&password!==confirmation){setError('As senhas precisam ser iguais.');return}
    setBusy(true);setError('')
    try{
      await authRequest(resetting?'reset-password':'request-password-reset',resetting?{token,newPassword:password}:{email:email.trim()})
      setDone(true);setPassword('');setConfirmation('')
      if(resetting)window.history.replaceState(null,'','/reset-password')
    }catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível concluir. Tente novamente.')}
    finally{setBusy(false)}
  }
  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><Sparkles size={25}/><strong>vitrine<span>digital</span></strong></div><h1>{resetting?'Defina sua senha.':'Recupere seu acesso.'}</h1>{done?<p role="status">{resetting?'Senha definida. Entre com sua nova senha.':'Se o e-mail corresponder ao Admin, você receberá um link de recuperação. Confira também o spam.'}</p>:<><p>{resetting?'Escolha sua senha para acessar o Admin.':'Informe o e-mail da sua conta Admin para receber o link.'}</p><form onSubmit={event=>void submit(event)}>{resetting?<><label>Nova senha<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event=>setPassword(event.target.value)} disabled={busy||!token}/></label><label>Confirme a senha<input type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event=>setConfirmation(event.target.value)} disabled={busy||!token}/></label></>:<label>E-mail<input type="email" autoComplete="email" inputMode="email" maxLength={256} required value={email} onChange={event=>setEmail(event.target.value)} disabled={busy}/></label>}{error&&<p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" type="submit" disabled={busy||(resetting&&!token)}>{busy?'Aguarde…':resetting?'Definir senha':'Enviar link de recuperação'}</button></form></>}<p className="auth-footnote"><a href="/login">Voltar ao login</a>{resetting&&!done&&<> · <a href="/forgot-password">Solicitar outro link</a></>}</p></section></main>
}
function AdminLogin() {
  const [authenticated,setAuthenticated]=useState(false)
  const [checking,setChecking]=useState(true)
  const [busy,setBusy]=useState(false)
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const select=(valid:boolean)=>{
    setAuthenticated(valid)
    const params=new URLSearchParams(window.location.search)
    const demo=params.get('admin-look')==='classic'?'?admin-look=classic':params.get('admin-demo')==='modern'?'?admin-demo=modern':''
    window.history.replaceState(null,'',(valid?'/admin':'/login')+demo)
  }
  useEffect(()=>{
    let alive=true
    authRequest('session').then(data=>{if(alive)select(data.authenticated)}).catch(()=>{if(alive){select(false);setError('Não foi possível confirmar a sessão. Tente novamente.')}}).finally(()=>{if(alive)setChecking(false)})
    const expired=()=>{select(false);setError('Sua sessão expirou. Entre novamente para continuar.')}
    window.addEventListener('biosite-session-expired',expired)
    return()=>{alive=false;window.removeEventListener('biosite-session-expired',expired)}
  },[])
  const signIn=async(event:React.FormEvent)=>{
    event.preventDefault();if(busy)return
    setBusy(true);setError('')
    try{const session=await authRequest('login',{email:email.trim(),password});select(session.authenticated);setPassword('')}
    catch(reason){setError(reason instanceof Error?reason.message:'Não foi possível entrar.')}
    finally{setBusy(false)}
  }
  const signOut=async()=>{
    if(busy)return
    if(!window.dispatchEvent(new Event('biosite-before-logout',{cancelable:true}))){setError('Não foi possível preservar as alterações locais. Salve seu rascunho antes de sair.');return}
    setBusy(true);setError('')
    try{await authRequest('logout',{});select(false);setPassword('')}
    catch{setError('Não foi possível encerrar a sessão no servidor. Tente sair novamente.')}
    finally{setBusy(false)}
  }
  if(checking)return <main className="auth-shell"><div className="auth-card" role="status">Confirmando sua sessão…</div></main>
  if(authenticated)return <><div className="auth-session-bar"><span><LockKeyhole size={14}/> Admin autenticado</span><button disabled={busy} onClick={()=>void signOut()}><LogOut size={16}/>{busy?'Saindo…':'Sair'}</button></div>{error&&<p className="auth-session-error" role="alert">{error}</p>}<App/></>
  return <main className="auth-shell"><section className="auth-card"><div className="auth-brand"><Sparkles size={25}/><strong>vitrine<span>digital</span></strong></div><span className="auth-eyebrow">SEU ESPAÇO DE TRABALHO</span><h1>Bem-vindo de volta.</h1><p>Entre para cuidar dos seus BioSites.</p><form onSubmit={event=>void signIn(event)}><label>E-mail<input type="email" autoComplete="username" inputMode="email" required value={email} onChange={event=>setEmail(event.target.value)} disabled={busy}/></label><label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={event=>setPassword(event.target.value)} disabled={busy}/></label>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" disabled={busy} type="submit"><LockKeyhole size={17}/>{busy?'Entrando…':'Entrar no Admin'}</button></form><p className="auth-footnote"><a href="/forgot-password">Esqueci minha senha</a></p><p className="auth-footnote">Acesso exclusivo do administrador.</p></section></main>
}

