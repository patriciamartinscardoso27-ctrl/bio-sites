import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createServer} from 'node:http'
import '../server/source-modules.mjs'
const {exportPremiumDesign,importPremiumDesign,assertPremiumPackage,premiumMedia}=await import('../src/lib/premiumDesignPackage.ts')
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const {createApi}=await import('../server/api.mjs')
const {validateBio}=await import('../server/validation.mjs')
const source=JSON.parse(await fs.readFile(new URL('./fixtures/xavier-premium-roundtrip.json',import.meta.url),'utf8'))
const newid='c6ff8419-d35d-49db-9a83-f97c0bfcc401'

test('Xavier export/import preserves every public field, image, order and visual property without mutating source',()=>{
 const before=JSON.stringify(source),pack=exportPremiumDesign(source),copy=importPremiumDesign(JSON.parse(JSON.stringify(pack)),newid)
 assert.equal(JSON.stringify(source),before);assert.notEqual(copy.id,source.id)
 assert.deepEqual({...copy,id:source.id},source);assert.equal(copy.sections.length,14)
 assert.deepEqual(premiumMedia(copy),premiumMedia(source));assert.equal(pack.renderer.presetId,'moda-premium-gold')
 assert.equal(pack.assets.media.length,17);validateBio(copy)
 const server=processPremiumDesign({operation:'import',package:pack})
 assert.notEqual(server.bio.id,source.id);assert.equal(server.compatibility.persisted,false);assert.deepEqual({...server.bio,id:source.id},source)
})

test('new compositions use flexible renderer, arbitrary supported section order and independent visuals',()=>{
 const flexible=structuredClone(source);delete flexible.layoutPreset;flexible.renderMode='flexible'
 flexible.sections=[source.sections[6],source.sections[8],source.sections[4]].map(s=>structuredClone(s))
 flexible.sections[0].visual={background:'#112233',text:'#ffffff',columns:3,gap:12,mediaAspect:80}
 flexible.sections[1].visual={background:'#331100',backgroundGradient:'linear-gradient(90deg, #331100, #ff8800)',overlayGradient:'linear-gradient(0deg, #111111 0%, #332211 100%)',shadow:'soft',radiusPx:24,paddingX:18}
 const {bio}=processPremiumDesign({operation:'import',package:exportPremiumDesign(flexible)})
 assert.equal(bio.layoutPreset,undefined);assert.equal(bio.renderMode,'flexible');assert.deepEqual(bio.sections,flexible.sections)
})

test('incompatible versions, undeclared components, unsafe properties and altered asset inventory fail closed',()=>{
 const mutations=[
  p=>p.schemaVersion=99,p=>p.renderer.version=2,p=>p.components[0].version=2,
  p=>p.components.push({id:'custom.javascript',version:1}),p=>p.design.html='<script>alert(1)</script>',
  p=>p.design.sections[0].onClick='alert(1)',p=>p.assets.media.pop(),p=>p.renderer.presetId='missing',
  p=>p.design.sections[0].visual={fontSize:999999},p=>p.design.sections[0].visual={css:'body{display:none}'},
  p=>p.design.sections[0].visual={backgroundGradient:'url(javascript:alert(1))'},p=>p.design.appearance.css='body{display:none}',
  p=>p.code='export default function(){}',p=>p.assets.storage='zip',
 ]
 for(const mutate of mutations){const p=exportPremiumDesign(source);mutate(p);assert.throws(()=>processPremiumDesign({operation:'import',package:p}))}
 const poisoned=JSON.parse(JSON.stringify(exportPremiumDesign(source)).replace('"schemaVersion":1','"schemaVersion":1,"__proto__":{"polluted":true}'))
 assert.throws(()=>assertPremiumPackage(poisoned));assert.equal({}.polluted,undefined)
 const p=exportPremiumDesign(source);p.design.sections[0].content.actions[0].url='javascript:alert(1)';assert.throws(()=>processPremiumDesign({operation:'import',package:p}),/link não permitido/)
})

test('internal client notes are not exported and large documents are rejected',()=>{
 const p=exportPremiumDesign({...source,client:{notes:'PRIVATE_INTERNAL_NOTE'}})
 assert(!JSON.stringify(p).includes('PRIVATE_INTERNAL_NOTE'));assert.equal(p.design.client,undefined)
 p.design.description='x'.repeat(4_000_001);assert.throws(()=>assertPremiumPackage(p),/4 MB/)
})

test('administrative validation route requires session, never uses Neon/Gemini and never publishes',async()=>{
 let authenticated=false
 const api=createApi({requestAllowed:()=>true,getAuth:async()=>({session:async()=>authenticated?{id:'test',role:'principal'}:null}),getRepository:async()=>{throw Error('NO DATABASE ALLOWED')},vision:{analyze:async()=>{throw Error('NO GEMINI ALLOWED')}}})
 const server=createServer(api);await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/api/design-package'
 const request=value=>fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value)})
 try{
  assert.equal((await request({operation:'export',bio:source})).status,401);authenticated=true
  const exported=await request({operation:'export',bio:source});assert.equal(exported.status,200)
  const imported=await request({operation:'import',package:(await exported.json()).package});assert.equal(imported.status,200)
  const result=await imported.json();assert.equal(result.compatibility.persisted,false);assert.notEqual(result.bio.id,source.id)
  assert.equal((await request({operation:'import',package:{code:'alert(1)'}})).status,400)
 }finally{await new Promise(r=>server.close(r))}
})
