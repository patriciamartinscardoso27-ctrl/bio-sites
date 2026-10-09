import {test} from 'node:test'
import assert from 'node:assert/strict'
import {generateKeyPairSync,sign,randomUUID} from 'node:crypto'
import {createServer} from 'node:http'
import {createSignupGuard,signupAuthorization} from '../server/signup-guard.mjs'
import {createAdminAuth} from '../server/auth.mjs'
import {createApi} from '../server/api.mjs'
import {hashInvite} from '../server/multiuser.mjs'

const secret='SYNTHETIC TEST SECRET '.repeat(3),token='a'.repeat(43),email='buyer@example.invalid',clock=Date.now()
const {publicKey,privateKey}=generateKeyPairSync('ed25519'),jwk={...publicKey.export({format:'jwk'}),kid:'fixture'}
function delivery(proof=signupAuthorization(secret,token,email,clock),changes={}){
 const event={event_id:randomUUID(),event_type:'user.before_create',context:{endpoint_id:'fixture-endpoint'},user:{email},event_data:{auth_provider:'credential',user_agent:proof},...changes}
 const raw=Buffer.from(JSON.stringify(event)),timestamp=String(clock),header=Buffer.from(JSON.stringify({alg:'EdDSA',kid:'fixture'})).toString('base64url')
 const input=header+'.'+Buffer.from(timestamp+'.'+raw.toString('base64url')).toString('base64url')
 return {raw,headers:{'x-neon-signature':header+'..'+sign(null,Buffer.from(input),privateKey).toString('base64url'),'x-neon-signature-kid':'fixture','x-neon-timestamp':timestamp,'x-neon-event-type':event.event_type,'x-neon-event-id':event.event_id}}
}
const fixture=(users={inspectHash:async h=>{assert.equal(h,hashInvite(token));return {email}}},fetchImpl=async()=>Response.json({keys:[jwk]}))=>createSignupGuard({secret,baseUrl:'https://auth.example.invalid',endpointId:'fixture-endpoint',users,fetchImpl,now:Date.now})
test('signed Neon creation requires backend proof even when the invited email is known',async()=>{
 const guard=fixture(),legit=delivery();assert.deepEqual(await guard(legit.raw,legit.headers),{allowed:true})
 assert.deepEqual(await guard(legit.raw,legit.headers),{allowed:true}) // provider retries are idempotent
 for(const request of [delivery('ordinary-browser'),delivery(signupAuthorization('another secret'.repeat(4),token,email,clock)),delivery(signupAuthorization(secret,token,email,clock-60000)),delivery(undefined,{user:{email:'other@example.invalid'}}),delivery(undefined,{user:{email,role:'admin'}}),delivery(undefined,{user:{email,banned:true}}),delivery(undefined,{context:{endpoint_id:'other'}}),delivery(undefined,{event_data:{auth_provider:'google',user_agent:signupAuthorization(secret,token,email,clock)}})])assert.equal((await guard(request.raw,request.headers)).allowed,false)
})
test('forged signatures, raw body changes, old and future events fail; no database or key outage allows signup',async()=>{
 const request=delivery(),guard=fixture()
 await assert.rejects(guard(Buffer.from(request.raw.toString().replace(email,'fake@example.invalid')),request.headers))
 await assert.rejects(guard(request.raw,{...request.headers,'x-neon-timestamp':String(clock-61000)}))
 await assert.rejects(guard(request.raw,{...request.headers,'x-neon-timestamp':String(clock+61000)}))
 await assert.rejects(guard(request.raw,{...request.headers,'x-neon-signature-kid':'unknown'}))
 await assert.rejects(fixture(undefined,async()=>Response.json({}, {status:503}))(request.raw,request.headers))
 await assert.rejects(fixture({inspectHash:async()=>{throw Object.assign(new Error('private fixture'),{status:503})}})(request.raw,request.headers))
 for(const state of ['expired','revoked','consumed','blocked'])assert.equal((await fixture({inspectHash:async()=>{throw Object.assign(new Error(state),{status:400})}})(request.raw,request.headers)).allowed,false)
})
test('backend supplies proof only after checking invitation and email; password creation remains Neon-only',async()=>{
 let active=false,accepts=0,signups=0
 const guard=fixture({inspectHash:async()=>{assert(!active);return {email}}})
 const users={inspect:async()=>{if(active)throw Object.assign(new Error('used'),{status:400});return {email,name:'Buyer'}},accept:async()=>{active=true;accepts++;return {ok:true}}}
 const auth=createAdminAuth({adminId:'principal',baseUrl:'https://auth.example.invalid',cookieSecret:secret,invitationUsers:async()=>users,proxy:async({path,request})=>{
   assert.equal(path,'sign-up/email');const body=await request.json();assert.equal(body.password,'TEST PASSWORD FIXTURE');signups++
   const event=delivery(request.headers.get('user-agent'));assert.equal((await guard(event.raw,event.headers)).allowed,true)
   return Response.json({user:{id:'buyer-id',email}})
 }})
 const req={headers:{host:'localhost:5173','user-agent':'attacker-header'},socket:{remoteAddress:'127.0.0.1'}}
 await assert.rejects(auth.acceptInvite(req,{}, {token,email:'other@example.invalid',password:'TEST PASSWORD FIXTURE'}));assert.equal(signups,0)
 assert.deepEqual(await auth.acceptInvite(req,{}, {token,email,password:'TEST PASSWORD FIXTURE'}),{ok:true});assert.equal(accepts,1)
 await assert.rejects(auth.acceptInvite(req,{}, {token,email,password:'TEST PASSWORD FIXTURE'}));assert.equal(signups,1)
})
test('webhook route accepts only signed bounded raw JSON independently of browser Origin; other APIs stay protected',async t=>{
 const api=createApi({requestAllowed:()=>false,signupGuard:async()=>fixture()})
 const server=createServer(api);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>server.close())
 const origin='http://127.0.0.1:'+server.address().port,request=delivery()
 const response=await fetch(origin+'/api/webhooks/neon-auth',{method:'POST',headers:{...request.headers,'Content-Type':'application/json'},body:request.raw});assert.equal(response.status,200);assert.deepEqual(await response.json(),{allowed:true})
 assert.equal((await fetch(origin+'/api/webhooks/neon-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:request.raw})).status,403)
 assert.equal((await fetch(origin+'/api/webhooks/neon-auth')).status,405)
 assert.equal((await fetch(origin+'/api/webhooks/neon-auth',{method:'POST',headers:{'Content-Type':'application/json'},body:'x'.repeat(32769)})).status,413)
 assert.equal((await fetch(origin+'/api/users')).status,403)
})
test('configured application cannot activate invitations before the provider guard activation is approved',async()=>{
 let called=false
 const auth=createAdminAuth({cookieSecret:secret,signupGuardReady:false,invitationUsers:async()=>{called=true},proxy:async()=>{called=true}})
 await assert.rejects(auth.acceptInvite({headers:{},socket:{remoteAddress:'127.0.0.1'}},{},{token,email,password:'TEST PASSWORD FIXTURE'}),error=>error.status===503)
 assert.equal(called,false)
})
