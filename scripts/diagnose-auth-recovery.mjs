// Negative provider probe: nonexistent email, no account/password/token access.
import {readFile} from 'node:fs/promises'
import {parseEnv} from 'node:util'
import {handleAuthProxyRequest} from '@neondatabase/auth/server'
const config=parseEnv(await readFile(new URL('../.env.server.local',import.meta.url),'utf8'))
for(const [host,callbackHost] of [['127.0.0.1:5173','127.0.0.1:5173'],['localhost:5173','localhost:5173'],['127.0.0.1:5173','localhost:5173']]){
  try{
    const origin='http://'+host
    const request=new Request(origin+'/api/auth/request-password-reset',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,'x-neon-auth-proxy':'node'},body:JSON.stringify({email:'negative-recovery-probe@example.invalid',redirectTo:'http://'+callbackHost+'/reset-password'})})
    const response=await handleAuthProxyRequest({request,path:'request-password-reset',baseUrl:config.NEON_AUTH_BASE_URL,cookieSecret:config.NEON_AUTH_COOKIE_SECRET,sameSite:'lax'})
    const value=await response.json().catch(()=>({}))
    const code=typeof value.code==='string'&&/^[A-Z_]{1,100}$/.test(value.code)?value.code:'omitted'
    const msg=String(value.message||value.error||'').toLowerCase()
    const category=msg.includes('origin')?'origin':msg.includes('callback')||msg.includes('redirect')?'callback':msg.includes('disabled')||msg.includes("isn't enabled")?'disabled':msg.includes('password')?'password':msg.includes('rate')?'rate-limit':'unspecified'
    console.log(JSON.stringify({host,callbackHost,status:response.status,code,category,success:response.ok}))
  }catch{console.log(JSON.stringify({host,networkFailure:true}))}
}
