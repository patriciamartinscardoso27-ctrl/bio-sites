// Synthetic, invalid code only. Does not access real recovery links or change passwords.
import {readFile} from 'node:fs/promises'
import {parseEnv} from 'node:util'
import {get} from 'node:http'
import {handleAuthProxyRequest} from '@neondatabase/auth/server'
const config=parseEnv(await readFile(new URL('../.env.server.local',import.meta.url),'utf8'))
try{
  const url=new URL(config.NEON_AUTH_BASE_URL+'/reset-password/synthetic-invalid-fixture')
  url.searchParams.set('callbackURL','http://localhost:5173/reset-password')
  const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)})
  const location=response.headers.get('location')
  let callback
  if(location){const parsed=new URL(location);callback={origin:parsed.origin,path:parsed.pathname,queryKeys:[...parsed.searchParams.keys()],invalidCode:parsed.searchParams.get('error')==='INVALID_TOKEN'}}
  console.log(JSON.stringify({providerStatus:response.status,callback}))
  const request=new Request('http://localhost:5173/api/auth/reset-password',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json'},body:JSON.stringify({token:'synthetic-invalid-fixture',newPassword:'synthetic-test-password'})})
  const rejected=await handleAuthProxyRequest({request,path:'reset-password',baseUrl:config.NEON_AUTH_BASE_URL,cookieSecret:config.NEON_AUTH_COOKIE_SECRET,sameSite:'lax'})
  const rejection=await rejected.json().catch(()=>({}))
  console.log(JSON.stringify({resetStatus:rejected.status,invalidTokenRejected:rejection.code==='INVALID_TOKEN'}))
  for(const host of ['localhost','127.0.0.1'])await new Promise(resolve=>{
    get(`http://${host}:5173/reset-password?token=synthetic-fixture`,{headers:{'sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document',Referer:'https://example.invalid/'}},r=>{console.log(JSON.stringify({host,pageStatus:r.statusCode}));r.resume();r.on('end',resolve)}).on('error',()=>{console.log(JSON.stringify({host,unreachable:true}));resolve()})
  })
}catch{console.log('Callback probe failed; private details omitted.');process.exitCode=1}
