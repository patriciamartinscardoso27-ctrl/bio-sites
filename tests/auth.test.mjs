import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createAdminAuth } from '../server/auth.mjs'
import { createApi, createAdminPageGuard, canonicalLocalPage, localRequest } from '../server/api.mjs'
import { NEON_AUTH_SESSION_COOKIE_NAME as cookie } from '@neondatabase/auth/server'
import { recoveryLocation } from '../src/lib/passwordRecovery.ts'

test('callback code survives reload without query, storage or referrer; provider errors disable reset',()=>{
  const first=recoveryLocation('http://localhost:5173/reset-password?token=synthetic%2Bfixture')
  assert.equal(first.token,'synthetic+fixture')
  assert(!first.cleanUrl.includes('?'))
  const reloaded=recoveryLocation('http://localhost:5173'+first.cleanUrl)
  assert.deepEqual(reloaded,first)
  assert.equal(recoveryLocation('http://localhost:5173/reset-password?error=INVALID_TOKEN&token=synthetic').token,'')
  assert.equal(recoveryLocation('http://localhost:5173/reset-password').token,'')
  assert.equal(recoveryLocation('http://localhost:5173/reset-password?token='+'x'.repeat(513)).token,'')
})

test('official recovery endpoints: admin only, fixed redirect, no token leak, invalid/used links and throttling',async()=>{
  const calls=[]
  let used=false
  const auth=createAdminAuth({adminId:'admin-fixture',baseUrl:'https://example.invalid',cookieSecret:'x'.repeat(48),isAdminEmail:async email=>email==='admin@example.invalid',proxy:async({path,request})=>{
    const value=await request.json();calls.push({path,value})
    if(path==='request-password-reset')return Response.json({status:true,token:'never-return-to-browser'})
    assert.equal(path,'reset-password')
    if(value.token!=='valid-fixture'||used)return Response.json({error:'private upstream error'}, {status:400})
    used=true;return Response.json({status:true})
  }})
  const req={headers:{host:'localhost:5173'},socket:{remoteAddress:'127.0.0.1'}}
  assert.deepEqual(await auth.requestReset(req,{}, {email:'other@example.invalid'}),{ok:true})
  assert.equal(calls.length,0)
  await assert.rejects(auth.requestReset(req,{}, {email:'admin@example.invalid',redirectTo:'https://evil.invalid'}),e=>e.status===400)
  assert.deepEqual(await auth.requestReset(req,{}, {email:'admin@example.invalid'}),{ok:true})
  assert.equal(calls[0].path,'request-password-reset')
  assert.equal(calls[0].value.redirectTo,'http://localhost:5173/reset-password')
  const resetReq={...req,socket:{remoteAddress:'reset-fixture'}}
  await assert.rejects(auth.resetPassword(resetReq,{}, {token:'invalid',newPassword:'fixture-password'}),e=>e.status===400&&!e.message.includes('private'))
  await assert.rejects(auth.resetPassword(resetReq,{}, {token:'valid-fixture',newPassword:'short'}),e=>e.status===400)
  assert.deepEqual(await auth.resetPassword(resetReq,{}, {token:'valid-fixture',newPassword:'fixture-password'}),{ok:true})
  await assert.rejects(auth.resetPassword(resetReq,{}, {token:'valid-fixture',newPassword:'fixture-password'}),e=>e.status===400)
  await auth.requestReset(req,{}, {email:'other@example.invalid'})
  await auth.requestReset(req,{}, {email:'other@example.invalid'})
  await assert.rejects(auth.requestReset(req,{}, {email:'admin@example.invalid'}),e=>e.status===429)
})

test('numeric loopback pages redirect to localhost preserving callback; unrelated routes and foreign hosts do not redirect',()=>{
  const navigation={method:'GET',url:'/forgot-password',socket:{remoteAddress:'127.0.0.1'},headers:{host:'localhost:5173','sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document'}}
  assert(localRequest(navigation))
  assert.equal(localRequest({...navigation,url:'/api/biosites'}),false)
  assert.equal(localRequest({...navigation,method:'POST'}),false)
  for(const path of ['/login','/forgot-password','/reset-password?token=fixture']){
    const req={url:path,method:'GET',headers:{host:'127.0.0.1:5173'},socket:{remoteAddress:'127.0.0.1'}}
    let status,headers
    canonicalLocalPage(req,{writeHead:(s,h)=>{status=s;headers=h},end:()=>{}},()=>assert.fail('Must redirect'))
    assert.equal(status,302);assert.equal(headers.Location,'http://localhost:5173'+path)
    assert.equal(headers['Referrer-Policy'],'no-referrer')
    let continued=false
    canonicalLocalPage({...req,headers:{host:'localhost:5173'}},{},()=>{continued=true})
    assert(continued)
  }
  for(const [url,host] of [['/api/auth/session','127.0.0.1:5173'],['/login','evil.example']]){
    let continued=false
    canonicalLocalPage({url,method:'GET',headers:{host},socket:{remoteAddress:'127.0.0.1'}},{},()=>{continued=true})
    assert(continued)
  }
})

test('admin login, server authorization, logout and independent stored data',async()=>{
  const adminId='577703bb-0f7a-477b-8a26-c781fb4d9c7b'
  let active=false,other=false,calls=0
  const data={user:{id:adminId},session:{userId:adminId,expiresAt:new Date(Date.now()+60000).toISOString()}}
  const auth=createAdminAuth({adminId,baseUrl:'https://example.invalid/auth',cookieSecret:'x'.repeat(48),proxy:async({request,path})=>{
    if(path==='sign-in/email'){
      const value=await request.json()
      if(value.password!=='test-fixture')return Response.json({}, {status:401})
      active=true;other=value.email==='other@example.invalid'
      return Response.json({user:{id:other?'other':adminId},token:'never-expose'}, {headers:{'Set-Cookie':`${cookie}=fixture; HttpOnly; Secure; SameSite=Lax; Path=/`}})
    }
    if(path==='get-session'){
      assert.equal(new URL(request.url).searchParams.get('disableCookieCache'),'true')
      return Response.json(active&&request.headers.get('cookie')===`${cookie}=fixture`?other?{...data,user:{id:'other'}}:data:null)
    }
    if(path==='sign-out'){active=false;return Response.json({}, {headers:{'Set-Cookie':`${cookie}=; Max-Age=0; HttpOnly; Secure; Path=/`}})}
    throw Error('Unexpected provider route')
  }})
  const stored=[{id:'site-a',content:{name:'A'}},{id:'site-b',content:{name:'B'}}]
  const api=createApi({getAuth:async()=>auth,repository:{list:async()=>{calls++;return {items:structuredClone(stored)}},get:async(id)=>{calls++;return stored.find(s=>s.id===id)}}})
  const guard=createAdminPageGuard({getAuth:async()=>auth})
  const server=createServer((req,res)=>void api(req,res,()=>void guard(req,res,()=>res.end('panel'))))
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${server.address().port}`
  const call=(path,method='GET',value,session='')=>fetch(base+path,{method,redirect:'manual',headers:{Origin:base,'Content-Type':'application/json',Cookie:session},body:value?JSON.stringify(value):undefined})
  try{
    assert.equal((await call('/admin')).status,302)
    for(const [path,method] of [['/api/biosites','GET'],['/api/biosites','POST'],['/api/biosites/site-a','GET'],['/api/biosites/site-a/draft','PUT']])assert.equal((await call(path,method,method==='GET'?undefined:{})).status,401)
    assert.equal(calls,0)
    assert.equal((await call('/api/biosites','GET',undefined,`${cookie}=forged`)).status,401)
    assert.equal((await call('/api/auth/sign-up/email','POST',{})).status,404)
    assert.equal((await call('/api/auth/login','POST',{email:'admin@example.invalid',password:'wrong'})).status,401)
    assert.equal((await call('/api/auth/login','POST',{email:'other@example.invalid',password:'test-fixture'})).status,403)
    assert.equal(active,false)
    const login=await call('/api/auth/login','POST',{email:'admin@example.invalid',password:'test-fixture'})
    assert.equal(login.status,200)
    assert.deepEqual(await login.json(),{authenticated:true})
    assert.match(login.headers.get('set-cookie'),/HttpOnly/)
    const session=`${cookie}=fixture`
    assert.equal((await call('/admin','GET',undefined,session)).status,200)
    assert.deepEqual((await (await call('/api/biosites','GET',undefined,session)).json()).items,stored)
    assert.deepEqual(await (await call('/api/biosites/site-a','GET',undefined,session)).json(),stored[0])
    assert.deepEqual(await (await call('/api/auth/logout','POST',{},session)).json(),{authenticated:false})
    assert.equal((await call('/api/biosites','GET',undefined,session)).status,401)
    assert.deepEqual(stored.map(s=>s.content.name),['A','B'])
  }finally{await new Promise(resolve=>server.close(resolve))}
})
