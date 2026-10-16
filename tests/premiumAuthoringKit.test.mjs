import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const {premiumMedia}=await import('../src/lib/premiumDesignPackage.ts')
const {readyTemplates}=await import('../src/data/templates.ts')
const base=new URL('../docs/kit-autoria-premium/',import.meta.url)
const read=async name=>JSON.parse(await fs.readFile(new URL(name,base),'utf8'))

for(const name of ['aurora-flexivel.biosite.json','xavier-biblioteca.biosite.json'])test('authoring kit example accepted by real importer without structural loss: '+name,async()=>{
 const pack=await read('exemplos/'+name),before=JSON.stringify(pack)
 const {bio,compatibility}=processPremiumDesign({operation:'import',package:pack})
 assert.equal(compatibility.persisted,false);assert.notEqual(bio.id,pack.design.id)
 assert.deepEqual({...bio,id:pack.design.id},pack.design)
 assert.deepEqual(premiumMedia(bio),pack.assets.media)
 assert.equal(JSON.stringify(pack),before)
 if(name.startsWith('aurora')){
  assert.equal(pack.renderer.profile,'flexible');assert.equal(bio.renderMode,'flexible');assert.equal(bio.layoutPreset,undefined)
  assert(bio.sections.some(s=>s.visual?.backgroundGradient));assert(bio.sections.some(s=>s.content?.items?.length))
 }else{
  const model=readyTemplates.find(t=>t.id==='moda-premium-gold');assert(model)
  const source=model.previewBio||model.bio
  assert.deepEqual({...pack.design,id:source.id},source)
 }
})

test('externally edited examples must maintain media inventory and safe declarative vocabulary',async()=>{
 const pack=await read('exemplos/aurora-flexivel.biosite.json')
 pack.design.sections[1].content.items[0].image='https://example.com/replaced.webp'
 assert.throws(()=>processPremiumDesign({operation:'import',package:pack}),/inventário/)
 pack.assets.media=premiumMedia(pack.design)
 assert.doesNotThrow(()=>processPremiumDesign({operation:'import',package:pack}))
 pack.design.sections[0].visual.locationVisual='map'
 assert.throws(()=>processPremiumDesign({operation:'import',package:pack}))
 delete pack.design.sections[0].visual.locationVisual
 pack.design.html='<script>alert(1)</script>'
 assert.throws(()=>processPremiumDesign({operation:'import',package:pack}))
})

test('schema reference has no dangling refs and catalog matches authoritative local enums',async()=>{
 const schema=await read('contrato.schema.json'),catalog=await read('catalogo.json')
 const {visualNumberBounds,visualEnumValues}=await import('../src/lib/visualSpec.ts')
 const {sectionLayouts}=await import('../src/lib/designSystem.ts')
 assert.deepEqual(catalog.visualNumberBounds,visualNumberBounds)
 assert.deepEqual(catalog.visualEnumValues,visualEnumValues)
 assert.deepEqual(catalog.sectionLayouts,sectionLayouts)
 const walk=value=>{
  if(!value||typeof value!=='object')return
  if(value.$ref){assert(value.$ref.startsWith('#/$defs/'));assert(schema.$defs[value.$ref.slice(8)],value.$ref)}
  Object.values(value).forEach(walk)
 }
 walk(schema)
 assert.equal(schema.$defs.visual.properties.locationVisual,undefined)
 assert.equal(schema.$defs.design.additionalProperties,false)
})
