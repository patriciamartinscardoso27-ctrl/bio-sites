import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep, basename } from 'node:path'
import { validateBio, slugFor, ApiError, validateVersion } from '../server/validation.mjs'
import { createApi, localRequest } from '../server/api.mjs'
import { createRepository } from '../server/repository.mjs'
import { createAppServer } from '../server/http-server.mjs'
const { templates, createBio, createManualBio } = await import('../src/data/templates.ts')
const { createAction, actionTypes } = await import('../src/lib/actionLinks.ts')
const { sameBio } = await import('../src/lib/biositesApi.ts')
const { keepNeonBackup, readNeonBackups } = await import('../src/lib/neonBackups.ts')

test('all 21 models and all 14 action kinds remain valid JSONB payloads',()=>{
  for(const template of templates) {
    const bio=createBio(template)
    bio.actions=actionTypes.map(a=>createAction(a.kind,bio))
    const before=structuredClone(bio)
    assert.equal(validateBio(bio),template.id)
    assert.deepEqual(bio,before)
    assert.match(slugFor(bio),/^[a-z0-9]+(-[a-z0-9]+)*$/)
    assert(slugFor(bio).length<=100)
  }
  const manual=createManualBio({name:'Minha página',categoryId:'barber',phone:'',instagram:'',address:'',logo:'',cover:''})
  assert.equal(validateBio(manual),templates.find(t=>t.bio.style==='clean-minimal').id)
})
test('validation rejects malformed content, duplicate IDs and cross-site content',()=>{
  const bio=createBio(templates[0])
  for(const patch of [{name:''},{category:'unknown'},{style:'invalid'},{sections:null},{actions:[{id:'a'}]},{products:[...bio.products,bio.products[0]]},{cover:'javascript:alert(1)'},{appearance:{theme:'unknown'}},{name:'nul\u0000'}]) {
    assert.throws(()=>validateBio({...bio,...patch}),error=>error instanceof ApiError && error.status===400)
  }
  assert.throws(()=>validateBio(bio,crypto.randomUUID()),ApiError)
  assert.throws(()=>validateVersion('1; DROP TABLE biosites'),ApiError)
  assert.throws(()=>validateVersion(1),ApiError)
})
test('JSONB key normalization preserves array order and dirty-state detection',()=>{
  const bio=createBio(templates[0])
  const reordered=Object.fromEntries(Object.entries(bio).reverse())
  assert(sameBio(bio,reordered))
  assert(!sameBio(bio,{...bio,sections:[...bio.sections].reverse()}))
  assert(!sameBio(bio,{...bio,name:'Changed'}))
})
test('local fallback preserves legacy drafts and keeps sites independent without importing them',()=>{
  const original=globalThis.localStorage
  const storage=new Map([['vitrine-premium-drafts-v1','legacy untouched']])
  globalThis.localStorage={get length(){return storage.size},key:i=>[...storage.keys()][i],getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)}
  try {
    const a=createBio(templates[0]),b=createBio(templates[1])
    keepNeonBackup(a);keepNeonBackup(b)
    assert.equal(storage.get('vitrine-premium-drafts-v1'),'legacy untouched')
    const copies=readNeonBackups()
    assert.equal(copies.length,2)
    assert.deepEqual(copies.find(c=>c.content.id===a.id).content,a)
    a.name='Updated copy';keepNeonBackup(a)
    assert.deepEqual(readNeonBackups().find(c=>c.content.id===b.id).content,b)
    assert.equal(storage.get('vitrine-premium-drafts-v1'),'legacy untouched')
  } finally {
    if(original===undefined)delete globalThis.localStorage
    else globalThis.localStorage=original
  }
})
test('origin/host checks reject foreign requests and DNS rebinding',()=>{
  const req={method:'POST',socket:{remoteAddress:'127.0.0.1'},headers:{host:'localhost:5173',origin:'http://localhost:5173'}}
  assert.equal(localRequest(req),true)
  assert.equal(localRequest({...req,headers:{host:'localhost:5173'}}),false)
  assert.equal(localRequest({...req,headers:{...req.headers,origin:'https://evil.example'}}),false)
  assert.equal(localRequest({...req,headers:{...req.headers,host:'evil.example:5173'}}),false)
  assert.equal(localRequest({...req,socket:{remoteAddress:'192.168.1.20'}}),false)
  assert.equal(localRequest({...req,headers:{...req.headers,'sec-fetch-site':'cross-site'}}),false)
})
test('repository driver failures do not leak private details',async()=>{
  const sql=()=>({})
  sql.transaction=async()=>{throw new Error('DATABASE_URL=private-test-secret')}
  const repo=createRepository(sql)
  await assert.rejects(repo.list(),error=>error instanceof ApiError&&error.status===503&&!error.message.includes('private-test-secret'))
})
test('API exercises its routes, validates mutation envelopes and sanitizes failures',async t=>{
  const content=createBio(templates[0])
  const calls=[]
  const repository={
    list:async cursor=>{calls.push(['list',cursor]);return {items:[],nextCursor:null}},
    get:async id=>{calls.push(['get',id]);return {content}},
    create:async value=>{calls.push(['create',value]);return {content:value}},
    save:async(id,value,version)=>{calls.push(['save',id,version]);return {content:value}},
  }
  const api=createApi({repository,getAuth:async()=>({session:async()=>({id:'test-admin'})})})
  const server=createServer((req,res)=>void api(req,res))
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  t.after(()=>new Promise(resolve=>server.close(resolve)))
  const base=`http://127.0.0.1:${server.address().port}`
  const request=(path,method='GET',value)=>fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json'},body:value?JSON.stringify(value):undefined})
  assert.equal((await request('/api/biosites')).status,200)
  assert.equal((await request('/api/biosites','POST',{content})).status,201)
  assert.equal((await request(`/api/biosites/${content.id}`)).status,200)
  assert.equal((await request(`/api/biosites/${content.id}/draft`,'PUT',{content,lockVersion:'1'})).status,200)
  assert.deepEqual(calls.map(c=>c[0]),['list','create','get','save'])
  assert.equal((await request('/api/biosites','POST',{content,slug:'changed'})).status,400)
  assert.equal((await request(`/api/biosites/${content.id}/publish`,'POST',{content})).status,400)
  assert.equal((await request('/api/biosites','DELETE')).status,404)
  assert.equal((await fetch(base+'/api/biosites',{method:'POST',headers:{Origin:'http://foreign.example','Content-Type':'application/json'},body:'{}'})).status,403)
  assert.equal((await fetch(base+'/api/biosites',{method:'POST',headers:{Origin:base,'Content-Type':'text/plain'},body:'{}'})).status,415)
  repository.list=async()=>{throw new Error('postgresql://private-test-secret')}
  const failure=await request('/api/biosites')
  assert.equal(failure.status,503)
  assert(!(await failure.text()).includes('private-test-secret'))
})
test('build server serves index and assets but cannot serve files outside dist',async t=>{
  const fixture=await mkdtemp(join(tmpdir(),'biosite-http-test-'))
  const dist=join(fixture,'dist')
  await mkdir(dist)
  await writeFile(join(dist,'index.html'),'<html>Admin test</html>')
  await writeFile(join(dist,'asset.css'),'body { margin: 0 }')
  await writeFile(join(fixture,'.env.server.local'),'private-fixture')
  const server=createAppServer({dist,pageGuard:(req,res,next)=>next(),canonical:(req,res,next)=>next()})
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  t.after(async()=>{
    await new Promise(resolve=>server.close(resolve))
    assert(resolve(fixture).startsWith(resolve(tmpdir())+sep) && basename(fixture).startsWith('biosite-http-test-'))
    await rm(fixture,{recursive:true,force:true})
  })
  const base=`http://127.0.0.1:${server.address().port}`
  const index=await fetch(base+'/')
  assert.equal(index.status,200);assert.equal(await index.text(),'<html>Admin test</html>')
  assert.equal((await fetch(base+'/asset.css')).status,200)
  for(const path of ['/forgot-password','/reset-password?token=fixture']) {
    const response=await fetch(base+path)
    assert.equal(response.status,200)
    assert.equal(response.headers.get('referrer-policy'),'no-referrer')
    assert.equal(response.headers.get('cache-control'),'no-store')
  }
  assert.equal((await fetch(base+'/.env.server.local')).status,404)
  assert.equal((await fetch(base+'/%2e%2e%2f.env.server.local')).status,404)
  assert.equal((await fetch(base+'/%2e%2e%5c.env.server.local')).status,404)
  assert.equal((await fetch(base+'/',{method:'HEAD'})).status,200)
})
