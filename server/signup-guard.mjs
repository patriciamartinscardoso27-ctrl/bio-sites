import {createHmac,createPublicKey,timingSafeEqual,verify} from 'node:crypto'
import {ApiError} from './validation.mjs'
import {hashInvite,getUsers} from './multiuser.mjs'
import {serverConfig} from './config.mjs'

// Backend-only proof. Never forwarded to the browser or written to our logs.
// User-Agent is part of Neon's documented, signed webhook event_data contract.
const prefix='BioSitesInvite/'
const mac=(secret,value)=>createHmac('sha256',secret).update('biosites-signup-v1:'+value).digest('base64url')
export function signupAuthorization(secret,token,email,now=Date.now()){
  if(!secret||secret.length<32)throw new ApiError(503,'Proteção de convites indisponível.')
  const data=Buffer.from(JSON.stringify({h:hashInvite(token),e:email.toLowerCase(),exp:now+60000})).toString('base64url')
  return prefix+data+'.'+mac(secret,data)
}
function authorization(secret,value,now){
  if(typeof value!=='string'||value.length>2048||!value.startsWith(prefix))return null
  const parts=value.slice(prefix.length).split('.');if(parts.length!==2)return null
  const expected=Buffer.from(mac(secret,parts[0])),actual=Buffer.from(parts[1])
  if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null
  try{const data=JSON.parse(Buffer.from(parts[0],'base64url').toString());return /^[a-f0-9]{64}$/.test(data.h)&&typeof data.e==='string'&&Number.isSafeInteger(data.exp)&&data.exp>now&&data.exp<=now+60000?data:null}catch{return null}
}
export function createSignupGuard({secret,baseUrl,endpointId,users,fetchImpl=fetch,now=Date.now}){
  let cache,cacheUntil=0,lastRefresh=0
  const denied={allowed:false,error_code:'INVITATION_REQUIRED',error_message:'Use um convite válido do Administrador.'}
  return async(raw,headers)=>{
    if(!secret||secret.length<32)throw new ApiError(503,'Proteção de convites indisponível.')
    const timestamp=headers['x-neon-timestamp'],kid=headers['x-neon-signature-kid'],signature=headers['x-neon-signature']
    if(typeof timestamp!=='string'||!/^\d{13}$/.test(timestamp)||Math.abs(now()-Number(timestamp))>60000||typeof kid!=='string'||kid.length>128||typeof signature!=='string'||signature.length>2048)throw new ApiError(403,'Evento não autorizado.')
    const parts=signature.split('.');if(parts.length!==3||parts[1]!=='')throw new ApiError(403,'Evento não autorizado.')
    let protectedHeader;try{protectedHeader=JSON.parse(Buffer.from(parts[0],'base64url').toString())}catch{throw new ApiError(403,'Evento não autorizado.')}
    if(protectedHeader.alg!=='EdDSA'||protectedHeader.kid!==kid||protectedHeader.crit)throw new ApiError(403,'Evento não autorizado.')
    if(!cache||cacheUntil<now()||(!cache.keys.some(k=>k.kid===kid)&&now()-lastRefresh>10000)){
      lastRefresh=now();const response=await fetchImpl(baseUrl+'/.well-known/jwks.json',{signal:AbortSignal.timeout(3000),redirect:'error'})
      if(!response.ok)throw new ApiError(503,'Validação indisponível.')
      cache=await response.json();if(!Array.isArray(cache.keys))throw new ApiError(503,'Validação indisponível.');cacheUntil=now()+300000
    }
    const key=cache.keys.find(k=>k.kid===kid&&k.kty==='OKP'&&k.crv==='Ed25519')
    const payload=Buffer.from(timestamp+'.'+Buffer.from(raw).toString('base64url')).toString('base64url')
    if(!key||!verify(null,Buffer.from(parts[0]+'.'+payload),createPublicKey({key,format:'jwk'}),Buffer.from(parts[2],'base64url')))throw new ApiError(403,'Evento não autorizado.')
    let event;try{event=JSON.parse(raw)}catch{throw new ApiError(400,'Evento inválido.')}
    if(event.event_type!=='user.before_create'||headers['x-neon-event-type']!==event.event_type||headers['x-neon-event-id']!==event.event_id||event.context?.endpoint_id!==endpointId)return denied
    const proof=authorization(secret,event.event_data?.user_agent,now())
    if(!proof||event.user?.email?.toLowerCase()!==proof.e||event.event_data?.auth_provider!=='credential'||(event.user?.role!==undefined&&event.user.role!=='user')||event.user?.banned===true)return denied
    try{const target=await users.inspectHash(proof.h);return target.email.toLowerCase()===proof.e?{allowed:true}:denied}catch(error){if(error.status===400)return denied;throw error}
  }
}
let configured
export async function getSignupGuard(){
  configured??=(async()=>{const config=await serverConfig();if(config.BIOSITE_MULTIUSER!=='enabled'||config.NEON_AUTH_BASE_URL!=='https://ep-cool-flower-b4g5hcwp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth')throw new ApiError(503,'Proteção de convites indisponível.');return createSignupGuard({secret:config.NEON_AUTH_COOKIE_SECRET,baseUrl:config.NEON_AUTH_BASE_URL,endpointId:'ep-cool-flower-b4g5hcwp',users:await getUsers()})})().catch(error=>{configured=undefined;throw error})
  return configured
}
