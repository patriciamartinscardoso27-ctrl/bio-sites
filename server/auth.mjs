import { handleAuthProxyRequest, NEON_AUTH_SESSION_COOKIE_NAME } from '@neondatabase/auth/server'
import { ApiError, isUuid } from './validation.mjs'
import { connectRepository } from './repository.mjs'
import {serverConfig,requestOrigin} from './config.mjs'
import {isIP} from 'node:net'
import {getUsers,inviteToken} from './multiuser.mjs'
import {signupAuthorization} from './signup-guard.mjs'

function clientAddress(req){
  if(req.socket?.remoteAddress)return req.socket.remoteAddress
  // Vercel's function request does not expose a Node socket. Trust its platform header only there.
  if(process.env.VERCEL==='1'){
    const header=req.headers['x-vercel-forwarded-for']
    const address=typeof header==='string'?header.split(',')[0].trim():''
    if(isIP(address))return address
  }
  return 'unavailable-client'
}

let configured
export async function getAuth() {
  configured ??= (async()=>{
    const config=await serverConfig()
    if(config.NEON_PROJECT_ID!=='muddy-star-65783442'||config.NEON_BRANCH_ID!=='br-raspy-pine-b4i56qaa'
      ||config.NEON_AUTH_BASE_URL!=='https://ep-cool-flower-b4g5hcwp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth'
      ||!isUuid(config.BIOSITE_ADMIN_AUTH_ID)||config.NEON_AUTH_COOKIE_SECRET?.length<32||!config.NEON_AUTH_COOKIE_SECRET)throw new ApiError(503,'Configuração de autenticação indisponível.')
    const multiuser=config.BIOSITE_MULTIUSER==='enabled'
    return createAdminAuth({baseUrl:config.NEON_AUTH_BASE_URL,adminId:config.BIOSITE_ADMIN_AUTH_ID,cookieSecret:config.NEON_AUTH_COOKIE_SECRET,
      resolveAccount:multiuser?async id=>(await getUsers()).resolve(id):undefined,
      isAdminEmail:multiuser?async email=>(await getUsers()).canRecover(email):undefined,
      invitationUsers:multiuser?getUsers:undefined,signupGuardReady:config.BIOSITE_SIGNUP_GUARD==='enabled'})
  })().catch(()=>{configured=undefined;throw new ApiError(503,'Configuração de autenticação indisponível.')})
  return configured
}
export function createAdminAuth({baseUrl,adminId,cookieSecret,proxy=handleAuthProxyRequest,isAdminEmail=async email=>(await connectRepository()).isAdminEmail(adminId,email),resolveAccount,invitationUsers,signupGuardReady=true}) {
  const attempts=new Map()
  const limit=(req)=>{
    const key='recovery:'+clientAddress(req),now=Date.now(),previous=attempts.get(key)
    const entry=previous&&previous.until>now?previous:{count:0,until:now+60000}
    attempts.set(key,entry)
    if(++entry.count>5)throw new ApiError(429,'Aguarde um minuto antes de tentar novamente.')
  }
  const cookies=(res,response)=>{
    const values=response.headers.getSetCookie()
    if(values.length)res.setHeader('Set-Cookie',[...(res.getHeader('Set-Cookie')||[]),...values])
  }
  const call=async(req,path,body,cookieOverride,signupProof)=>{
    const origin=requestOrigin(req)
    const headers=new Headers({'Content-Type':'application/json',Origin:origin,'x-neon-auth-proxy':'node'})
    if(signupProof)headers.set('User-Agent',signupProof)
    if(cookieOverride??req.headers.cookie)headers.set('cookie',cookieOverride??req.headers.cookie)
    const request=new Request(origin+'/api/auth/'+path+(path==='get-session'?'?disableCookieCache=true':''),{
      method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),
    })
    try{return await proxy({request,path,baseUrl,cookieSecret,sameSite:'lax'})}
    catch{throw new ApiError(503,'O serviço de autenticação está indisponível. Tente novamente.')}
  }
  const identity=data=>typeof data?.user?.id==='string'&&data.session?.userId===data.user.id&&Number.isFinite(Date.parse(data.session.expiresAt))&&Date.parse(data.session.expiresAt)>Date.now()?data.user.id:null
  const account=async data=>{
    const id=identity(data);if(!id)return null
    if(resolveAccount){const result=await resolveAccount(id);if(!result||result.status!=='active'||!['principal','buyer'].includes(result.role)||(result.role==='principal'&&id!==adminId))return null;if(result.sessionValidAfter&&!(Date.parse(data.session.createdAt)>Date.parse(result.sessionValidAfter)))return null;return {...result,multiuser:true}}
    return id===adminId?{id,role:'principal',name:'Gabriel',status:'active',multiuser:false}:null
  }
  return {
    multiuser:Boolean(resolveAccount),
    async inspectInvite(req,_res,value){limit(req);if(!invitationUsers)throw new ApiError(404,'Rota não encontrada.');if(!value||Object.keys(value).some(k=>k!=='token'))throw new ApiError(400,'Convite inválido.');const user=await(await invitationUsers()).inspect(inviteToken(value.token));return {name:user.name,email:user.email}},
    async acceptInvite(req,_res,value){
      limit(req);if(!invitationUsers)throw new ApiError(404,'Rota não encontrada.')
      if(!signupGuardReady)throw new ApiError(503,'A ativação de contas aguarda a proteção de cadastro no Neon Auth.')
      if(!value||Object.keys(value).some(k=>!['token','password','email'].includes(k))||typeof value.email!=='string'||value.email.length>256||typeof value.password!=='string'||value.password.length<8||value.password.length>128)throw new ApiError(400,'Confirme o e-mail e use uma senha de 8 a 128 caracteres.')
      const users=await invitationUsers(),token=inviteToken(value.token),target=await users.inspect(token)
      if(value.email.trim().toLowerCase()!==target.email.toLowerCase())throw new ApiError(400,'O e-mail precisa corresponder ao convite.')
      // Passwords remain exclusively in Neon Auth. No direct writes to its internal schema.
      let response=await call(req,'sign-up/email',{email:target.email,name:target.name,password:value.password,callbackURL:requestOrigin(req)+'/login'},'',signupAuthorization(cookieSecret,token,target.email))
      if(!response.ok){response=await call(req,'sign-in/email',{email:target.email,password:value.password});if(!response.ok)throw new ApiError(400,'Não foi possível ativar. Se já possui conta, use a senha existente; confira também a verificação do e-mail.')}
      const result=await response.json();if(typeof result?.user?.id!=='string'||result.user.email?.toLowerCase()!==target.email.toLowerCase()||result.user.id===adminId)throw new ApiError(400,'Não foi possível confirmar a identidade do convite.')
      return users.accept(token,result.user.id,target.email)
    },
    async requestReset(req,_res,value) {
      limit(req)
      if(!process.env.PUBLIC_SITE_ORIGIN&&new URL(`http://${req.headers.host}`).hostname!=='localhost')throw new ApiError(400,'Abra http://localhost:'+new URL(`http://${req.headers.host}`).port+'/forgot-password para solicitar a recuperação.')
      if(typeof value.email!=='string'||value.email.length>256||!/^\S+@\S+\.\S+$/.test(value.email.trim())||Object.keys(value).some(k=>k!=='email'))throw new ApiError(400,'Informe um e-mail válido.')
      const email=value.email.trim()
      if(await isAdminEmail(email)){
        const response=await call(req,'request-password-reset',{email,redirectTo:requestOrigin(req)+'/reset-password'})
        if(!response.ok){
          const data=await response.clone().json().catch(()=>({}))
          const code=['INVALID_REDIRECT_URL','INVALID_ORIGIN','RESET_PASSWORD_DISABLED','TOO_MANY_REQUESTS'].includes(data.code)?data.code:'OMITTED'
          console.warn('[auth-recovery]',JSON.stringify({endpoint:'request-password-reset',status:response.status,code}))
          throw new ApiError(503,'Não foi possível solicitar a recuperação. Tente novamente.')
        }
      }
      return {ok:true}
    },
    async resetPassword(req,_res,value) {
      limit(req)
      if(Object.keys(value).some(k=>!['token','newPassword'].includes(k))||typeof value.token!=='string'||!value.token||value.token.length>512||typeof value.newPassword!=='string'||value.newPassword.length<8||value.newPassword.length>128)throw new ApiError(400,'Use uma senha de 8 a 128 caracteres e um link válido.')
      const response=await call(req,'reset-password',{token:value.token,newPassword:value.newPassword})
      if(!response.ok)throw new ApiError(response.status>=500?503:400,'Não foi possível definir a senha. O link pode ter expirado ou já ter sido usado. Solicite outro link.')
      return {ok:true}
    },
    async session(req,res) {
      if(!(req.headers.cookie||'').split(';').some(c=>c.trim().startsWith(NEON_AUTH_SESSION_COOKIE_NAME+'=')))return null
      // Always check the provider: cached session-data never authorizes the API.
      const response=await call(req,'get-session')
      if(!response.ok){if(response.status>=500)throw new ApiError(503,'O serviço de autenticação está indisponível.');return null}
      const data=await response.json()
      const user=await account(data);if(!user)return null
      cookies(res,response)
      return user
    },
    async login(req,res,value) {
      if(typeof value.email!=='string'||value.email.length>256||typeof value.password!=='string'||value.password.length<1||value.password.length>1024
        ||Object.keys(value).some(k=>!['email','password'].includes(k)))throw new ApiError(400,'Informe e-mail e senha válidos.')
      const key=clientAddress(req)
      const now=Date.now(),previous=attempts.get(key)
      const entry=previous&&previous.until>now?previous:{count:0,until:now+60000}
      if(++entry.count>10)throw new ApiError(429,'Muitas tentativas. Aguarde um minuto e tente novamente.')
      attempts.set(key,entry)
      const response=await call(req,'sign-in/email',{email:value.email.trim(),password:value.password,rememberMe:true})
      if(!response.ok)throw new ApiError(response.status>=500?503:response.status===429?429:401,response.status>=500?'Serviço de autenticação indisponível.':'Não foi possível entrar. Confira suas credenciais e a verificação do e-mail.')
      const data=await response.json()
      // Sign-in response may omit session fields; validate minted cookie upstream.
      const sessionCookie=response.headers.getSetCookie().map(c=>c.split(';')[0]).filter(c=>c.startsWith(NEON_AUTH_SESSION_COOKIE_NAME+'=')).join('; ')
      const check=await call(req,'get-session',undefined,sessionCookie)
      const session=check.ok?await check.json():null
      const user=await account(session)
      if(data?.user?.id!==user?.id||!user) {
        if(sessionCookie)await call(req,'sign-out',{},sessionCookie)
        throw new ApiError(403,'Esta conta não possui acesso ativo ao sistema.')
      }
      cookies(res,response);cookies(res,check)
      attempts.delete(key)
      return {authenticated:true}
    },
    async logout(req,res) {
      const response=await call(req,'sign-out',{})
      if(!response.ok)throw new ApiError(503,'Não foi possível encerrar a sessão no servidor. Tente novamente.')
      cookies(res,response)
      return {authenticated:false}
    },
  }
}
