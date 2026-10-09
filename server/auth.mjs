import { handleAuthProxyRequest, NEON_AUTH_SESSION_COOKIE_NAME } from '@neondatabase/auth/server'
import { ApiError, isUuid } from './validation.mjs'
import { connectRepository } from './repository.mjs'
import {serverConfig,requestOrigin} from './config.mjs'
import {isIP} from 'node:net'

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
    return createAdminAuth({baseUrl:config.NEON_AUTH_BASE_URL,adminId:config.BIOSITE_ADMIN_AUTH_ID,cookieSecret:config.NEON_AUTH_COOKIE_SECRET})
  })().catch(()=>{configured=undefined;throw new ApiError(503,'Configuração de autenticação indisponível.')})
  return configured
}
export function createAdminAuth({baseUrl,adminId,cookieSecret,proxy=handleAuthProxyRequest,isAdminEmail=async email=>(await connectRepository()).isAdminEmail(adminId,email)}) {
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
  const call=async(req,path,body,cookieOverride)=>{
    const origin=requestOrigin(req)
    const headers=new Headers({'Content-Type':'application/json',Origin:origin,'x-neon-auth-proxy':'node'})
    if(cookieOverride??req.headers.cookie)headers.set('cookie',cookieOverride??req.headers.cookie)
    const request=new Request(origin+'/api/auth/'+path+(path==='get-session'?'?disableCookieCache=true':''),{
      method:body===undefined?'GET':'POST',headers,body:body===undefined?undefined:JSON.stringify(body),
    })
    try{return await proxy({request,path,baseUrl,cookieSecret,sameSite:'lax'})}
    catch{throw new ApiError(503,'O serviço de autenticação está indisponível. Tente novamente.')}
  }
  const authorized=data=>data?.user?.id===adminId && data?.session?.userId===adminId && Number.isFinite(Date.parse(data.session.expiresAt)) && Date.parse(data.session.expiresAt)>Date.now()
  return {
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
      if(!authorized(data))return null
      cookies(res,response)
      return {id:adminId}
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
      if(data?.user?.id!==adminId||!authorized(session)) {
        if(sessionCookie)await call(req,'sign-out',{},sessionCookie)
        throw new ApiError(403,'Esta conta não possui acesso ao Admin.')
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
