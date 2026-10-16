import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const {validateBio}=await import('../server/validation.mjs')
const {v2Gradient}=await import('../src/lib/premiumVisualV2.ts')
const pack=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium-v2/exemplos/beleza-premium-v2.biosite.json',import.meta.url),'utf8'))
const comparison=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium-v2/exemplos/comparacao-v2.biosite.json',import.meta.url),'utf8'))
test('V2 round trip preserves visual contract, content, media, IDs and source; fresh root only',()=>{
 const before=JSON.stringify(pack),r=processPremiumDesign({operation:'import',package:pack});assert.equal(r.compatibility.schemaVersion,2);assert.equal(r.compatibility.rendererVersion,2);assert.equal(r.compatibility.persisted,false)
 assert.notEqual(r.bio.id,pack.design.id);assert.deepEqual({...r.bio,id:pack.design.id},pack.design)
 assert.deepEqual(processPremiumDesign({operation:'export',bio:{...r.bio,id:pack.design.id}}).package,pack);assert.equal(JSON.stringify(pack),before)
 assert.equal(validateBio(r.bio),r.bio.style==='black-gold'?'barber-black-gold':'');assert.doesNotThrow(()=>processPremiumDesign({operation:'import',package:comparison}))
})
test('V2 rejects executable/unknown data, incompatible components, legacy controls and dangling bindings',()=>{
 const mutations=[
 p=>p.schemaVersion=3,p=>p.renderer.version=1,p=>p.design.premiumV2.page.css='body{}',p=>p.design.premiumV2.page.surface.gradient='url(javascript:alert(1))',
 p=>p.design.premiumV2.hero.photo.box.width=120,p=>p.design.premiumV2.hero.cta.actionId='missing',p=>p.design.premiumV2.hero.texts.push(p.design.premiumV2.hero.texts[0]),
 p=>p.design.premiumV2.sections.services.component='hours',p=>p.design.premiumV2.sections.hours.columns=2,p=>p.design.premiumV2.sections.services.variant='mosaic',
 p=>p.design.premiumV2.sections.story.layers[0].source='https://evil.example/code',p=>p.design.premiumV2.sections.story.layers[1].value.stops.reverse(),
 p=>p.design.sections[4].visual={background:'#000000'},p=>p.design.renderMode='flexible',p=>delete p.design.premiumV2.sections.contacts,
 p=>p.design.premiumV2.sections.space.images[0].span=4,p=>p.components.pop(),p=>p.assets.media.pop(),p=>p.design.premiumV2.hero.onClick='alert(1)',
 p=>p.design.actions[0].visual={background:'#ff0000'},p=>p.design.premiumV2.sections.services.responsive={small:{columns:1}},
 p=>p.design.premiumV2.sections.services.variant='vertical',p=>p.design.premiumV2.sections.location.button={height:50},p=>p.design.logo='',
 ]
 for(const mutate of mutations){const p=structuredClone(pack);mutate(p);assert.throws(()=>processPremiumDesign({operation:'import',package:p}))}
 const p=structuredClone(comparison);p.design.premiumV2.sections.comparison.comparison.after=0;assert.throws(()=>processPremiumDesign({operation:'import',package:p}))
})
test('V2 controlled gradient supports alpha without accepting CSS code',()=>{
 assert.equal(v2Gradient({angle:90,stops:[{color:'#000000',at:0,opacity:100},{color:'#000000',at:100,opacity:0}]}),'linear-gradient(90deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)')
 assert.equal(v2Gradient('linear-gradient(90deg, #112233, #445566)'), 'linear-gradient(90deg, #112233, #445566)')
 assert.equal(v2Gradient('url(javascript:alert(1))'),undefined)
})
test('V1 authoring files still validate unchanged and stay V1 after export',async()=>{
 for(const name of ['aurora-flexivel','xavier-biblioteca']){const p=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium/exemplos/'+name+'.biosite.json',import.meta.url),'utf8')),copy=processPremiumDesign({operation:'import',package:p}).bio;assert.equal(copy.premiumV2,undefined);assert.equal(processPremiumDesign({operation:'export',bio:copy}).package.schemaVersion,1)}
})

test('public projection preserves V2 composition without exposing private notes or altering V1',async()=>{
 const {publicContent}=await import('../server/publication.mjs')
 const source={...structuredClone(pack.design),client:{notes:'PRIVATE_NOTE'}},pub=publicContent(source)
 assert.deepEqual(pub.premiumV2,source.premiumV2);assert.equal(pub.client,undefined);assert.notEqual(pub.premiumV2,source.premiumV2)
 assert.doesNotThrow(()=>validateBio(pub));assert.equal(processPremiumDesign({operation:'export',bio:pub}).package.schemaVersion,2)
 const old={...source};delete old.premiumV2;assert.equal(Object.hasOwn(publicContent(old),'premiumV2'),false)
})

test('authenticated V2 API validates in memory and never calls persistence or Gemini',async()=>{
 const {createServer}=await import('node:http'),{createApi}=await import('../server/api.mjs')
 const api=createApi({requestAllowed:()=>true,getAuth:async()=>({session:async()=>({id:'test',role:'principal'})}),getRepository:async()=>{throw Error('NO DATABASE')},vision:{analyze:async()=>{throw Error('NO GEMINI')}}})
 const server=createServer(api);await new Promise(r=>server.listen(0,'127.0.0.1',r))
 try{const response=await fetch('http://127.0.0.1:'+server.address().port+'/api/design-package',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation:'import',package:pack})});assert.equal(response.status,200);const result=await response.json();assert.equal(result.compatibility.schemaVersion,2);assert.equal(result.compatibility.persisted,false)}finally{await new Promise(r=>server.close(r))}
})

test('V2 schema references resolve and strict component properties match runtime catalog',async()=>{
 const schema=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium-v2/contrato-v2.schema.json',import.meta.url),'utf8'))
 const {v2SectionProperties}=await import('../src/lib/premiumVisualV2.ts')
 const walk=v=>{if(!v||typeof v!=='object')return;if(v.$ref)assert(schema.$defs[v.$ref.slice(8)],v.$ref);Object.values(v).forEach(walk)};walk(schema)
 for(const [component,keys] of Object.entries(v2SectionProperties)){const def=schema.$defs['v2Section_'+component];assert.equal(def.additionalProperties,false);assert.deepEqual(Object.keys(def.properties).sort(),['version','component','surface','heading','text','padding','gap',...keys].sort())}
})
