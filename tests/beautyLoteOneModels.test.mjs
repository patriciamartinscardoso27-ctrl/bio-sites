import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import React from 'react'
import {renderToString} from 'react-dom/server'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-beautyLoteOneModels',server:{middlewareMode:true,hmr:false}})
const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{beautyLoteOneModelIds}=await vite.ssrLoadModule('/src/data/readyModelIds.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts'),{setSectionContent}=await vite.ssrLoadModule('/src/lib/sections.ts'),{keepNeonBackup,readNeonBackups}=await vite.ssrLoadModule('/src/lib/neonBackups.ts')
const sequences={
 'eclat-beleza':['actions','results','team','packages','space','space-gallery','reviews','care','hours','location','whatsapp','identity','social','navigation','copyright'],
 'nails-glam':['hero-benefits','actions','about','results','care','services','offer','packages','reviews','hours','location','whatsapp','identity','social','navigation','copyright'],
 'lumiere-beleza-estetica':['hero-proof','actions','transform','results','care','services','packages','team','reviews','hours','location','whatsapp','identity','social','navigation','copyright'],
 'nail-lux':['actions','about','benefits','results','care','services','offer','packages','reviews','hours','location','whatsapp','identity','social','navigation','copyright'],
 'bella-nails-studio':['actions','about','benefits','results','care','services','offer','packages','reviews','hours','location','whatsapp','identity','social','navigation','copyright']
}
test('five independent models extend the previous 38 without replacement',async()=>{const inventory=JSON.parse(await fs.readFile('artifacts/official-models/audit-inventory.json','utf8'));assert.equal(readyTemplates.length,76);assert.equal(new Set(readyTemplates.map(t=>t.id)).size,76);for(const old of inventory.registered)assert(readyTemplates.some(t=>t.id===old.id));assert.equal(beautyLoteOneModelIds.length,5)})
for(const id of beautyLoteOneModelIds)test(id+' preserves its full reference, editable owners, local saving and reopening',async()=>{
 const model=readyTemplates.find(t=>t.id===id),bio=createBio(model),other=createBio(model),doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;
 assert.equal(validateBio(JSON.parse(JSON.stringify(bio)),bio.id),id)
 assert.deepEqual(bio.sections.map(s=>s.id.slice(id.length+1)),sequences[id]);assert.equal(new Set(bio.sections.map(s=>s.id)).size,bio.sections.length)
 assert.equal(doc.querySelector('[data-library-batch]').getAttribute('data-library-batch'),'3');assert.equal(doc.querySelector('[data-responsive-contract]').getAttribute('data-responsive-contract'),'stable')
 const rendered=[...doc.querySelectorAll('[data-section-id]')].map(n=>n.getAttribute('data-section-id'));assert.deepEqual(rendered,bio.sections.map(s=>s.id))
 assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-headline'),bio).key,'headline');assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-button'),bio).kind,'action');assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-photo'),bio).key,'cover')
 for(const img of doc.querySelectorAll('[data-section-id] img')){const target=resolveEditorTarget(img,bio);assert(target,img.outerHTML);if(img.alt==='Logo')assert.equal(target.key,'logo');else assert.equal(target.part,'image')}
 for(const node of doc.querySelectorAll('.gold-product h3,.gold-product strong,.gold-product-contact'))assert.equal(resolveEditorTarget(node,bio).kind,'item')
 for(const node of doc.querySelectorAll('[data-benefit-index] h3')){const target=resolveEditorTarget(node,bio);assert.equal(target.kind,'entry');assert.equal(target.collection,'benefits')}
 for(const node of doc.querySelectorAll('.gold-gallery-caption span'))assert.equal(resolveEditorTarget(node,bio).collection,'highlights')
 for(const node of doc.querySelectorAll('.gold-reviews strong'))assert.equal(resolveEditorTarget(node,bio).collection,'reviews')
 for(const s of bio.sections){for(const a of [...(s.content?.actions||[]),...(s.content?.highlights||[]).map(h=>h.action),s.action].filter(Boolean))if(a.destination==='section')assert(bio.sections.some(target=>target.id===a.sectionId),a.sectionId)}
 assert.match(doc.querySelector('.gold-location-cta').href,/google.com\/maps/);assert.match(doc.querySelector('.gold-whatsapp-card').href,/wa.me/)
 for(const src of [...doc.querySelectorAll('img')].map(i=>i.src)){assert(!src.includes('next-batch-references'));if(src.startsWith('/images/'))await fs.access('public'+src)}
 const section=bio.sections.find(s=>s.kind==='products'),items=structuredClone(section.content.items);items[0].price='R$ 201,90';Object.assign(bio,setSectionContent(bio,section,{items}));const gallery=bio.sections.find(s=>s.kind==='gallery'),photos=[...gallery.content.photos];photos[0]='https://example.com/edited-photo.jpg';Object.assign(bio,setSectionContent(bio,gallery,{photos}));bio.headline='Título editado';bio.sections.find(s=>s.kind==='promotion').title='Banner editado';
 const previous=globalThis.localStorage,storage=new Map();globalThis.localStorage={get length(){return storage.size},key:i=>[...storage.keys()][i],getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)};
 try{keepNeonBackup(bio);keepNeonBackup(other);const reopened=readNeonBackups().find(b=>b.content.id===bio.id).content;assert.equal(reopened.layoutPreset,id);assert.deepEqual(reopened,JSON.parse(JSON.stringify(bio)));assert.equal(validateBio(reopened,reopened.id),id);assert.notEqual(other.sections.find(s=>s.kind==='products').content.items[0].price,'R$ 201,90');const reopenedDoc=new JSDOM(renderToString(React.createElement(BioSite,{bio:reopened}))).window.document;assert.equal(reopenedDoc.querySelector('.gold-hero-headline').textContent,'Título editado');assert.match(reopenedDoc.body.textContent,/R\$ 201,90/)}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous}
})
test.after(async()=>vite.close())

