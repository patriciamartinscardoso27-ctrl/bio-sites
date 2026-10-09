import {test} from 'node:test'
import assert from 'node:assert/strict'
import {validateBio,slugFor} from '../server/validation.mjs'
const {createBio,templates}=await import('../src/data/templates.ts')
const {prepareSmartDraft,duplicateDraft,goals}=await import('../src/lib/adminDrafts.ts')
const {clientStatus,recentClients}=await import('../src/lib/adminExperience.ts')
const {summarize}=await import('../src/lib/biositesApi.ts')
test('smart creation preserves all 21 models and 7 goals without inventing contacts or mutating templates',()=>{
  for(const template of templates)for(const goal of goals){
    const original=createBio(template),before=structuredClone(template.bio)
    original.phone='';original.instagram=''
    const bio=prepareSmartDraft(original,goal.id)
    assert.equal(validateBio(bio),template.id)
    assert.equal(bio.phone,'');assert.equal(bio.instagram,'')
    if(goal.id!=='products')assert.equal(bio.actions[0].kind||'whatsapp',goal.kind)
    assert.deepEqual(template.bio,before)
    assert(!Object.is(bio.sections,original.sections))
  }
})
test('duplication gets permanent independent ID/slug and deep-clones client, buttons and products',()=>{
  const original=createBio(templates[0]);original.client={responsible:'Pessoa',city:'São Paulo',notes:'Somente Admin'}
  const copy=duplicateDraft(original)
  assert.notEqual(copy.id,original.id);assert.notEqual(slugFor(copy),slugFor(original))
  copy.client.notes='Outra observação';copy.products[0].price='Outro preço';copy.actions[0].label='Outro botão'
  assert.equal(original.client.notes,'Somente Admin');assert.notEqual(copy.products[0].price,original.products[0].price);assert.notEqual(copy.actions[0].label,original.actions[0].label)
  validateBio(copy)
})
test('customer metadata is bounded, compatible with legacy drafts and excluded from list summaries',()=>{
  const content=createBio(templates[0]);validateBio(content)
  content.client={responsible:'Gabriel',city:'Curitiba',notes:'Notas internas'};validateBio(content)
  const summary=summarize({id:content.id,content,templateId:templates[0].id,status:'unpublished',publishedRevision:null,createdAt:'2026-10-05T12:00:00Z',updatedAt:'2026-10-05T12:00:00Z'})
  assert.equal(summary.city,'Curitiba');assert(!JSON.stringify(summary).includes('Notas internas'))
  for(const client of [{notes:'x'.repeat(5001)},{ownerId:'arbitrary'},null,[]])assert.throws(()=>validateBio({...content,client}))
})
test('home statuses distinguish never published drafts from unpublished editions; recent list is immutable',()=>{
  assert.equal(clientStatus({status:'unpublished',publishedRevision:null}),'Rascunho')
  assert.equal(clientStatus({status:'unpublished',publishedRevision:'3'}),'Despublicado')
  assert.equal(clientStatus({status:'published',publishedRevision:'3'}),'Publicado')
  const rows=[{id:'a',updatedAt:'2026-10-04'},{id:'b',updatedAt:'2026-10-05'}]
  assert.equal(recentClients(rows)[0].id,'b');assert.equal(rows[0].id,'a')
})
