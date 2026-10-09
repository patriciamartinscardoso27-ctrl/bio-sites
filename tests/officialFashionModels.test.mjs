import test from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import {renderToString} from 'react-dom/server'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {secondBatchModelIds,beautyLoteOneModelIds,loteTwoModelIds,loteThreeModelIds,loteFourModelIds,loteFiveModelIds,loteSixModelIds,loteSevenModelIds} from '../src/data/readyModelIds.ts'
import {validateBio} from '../server/validation.mjs'
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-officialFashionModels',server:{middlewareMode:true,hmr:false}})
const {readyTemplates,templates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts')
for(const id of ['bella-moda-feminina','urban-black-moda-masculina','charmme-moda-feminina','lumiere-boutique','vibe-store','urban-black-2','nexo-moda-masculina','atelier-27','lumiere-moda-feminina','imperium-barbearia','barber-pro','royal-barber','bravo-barbearia','the-cut-barbearia'])test(id+' uses shared renderer, editable owners and safe independent serialization',()=>{
 const model=readyTemplates.find(t=>t.id===id);assert(model);const bio=createBio(model),other=createBio(model);assert.equal(validateBio(JSON.parse(JSON.stringify(bio)),bio.id),id)
 const doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;assert.equal(doc.querySelector('[data-ready-model]').getAttribute('data-ready-model'),id);assert.equal(doc.querySelector('[data-ready-model]').getAttribute('data-responsive-contract'),'stable');for(const grid of doc.querySelectorAll('.gold-benefit-grid'))assert.equal(Number(grid.style.getPropertyValue('--benefit-columns')),Math.min(4,Math.max(1,grid.children.length)))
 assert.equal(resolveEditorTarget(doc.querySelector('h1'),bio).key,'name');assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-headline'),bio).key,'headline');assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-photo'),bio).key,'cover')
 assert.equal(resolveEditorTarget(doc.querySelector('.gold-product strong'),bio).field,'price');assert.equal(resolveEditorTarget(doc.querySelector('.gold-product img'),bio).part,'image');assert.equal(resolveEditorTarget(doc.querySelector('[data-action-id]'),bio).kind,'action')
 for(const img of doc.querySelectorAll('[data-section-id] img'))assert.equal(resolveEditorTarget(img,bio).part,'image')
 const dimensions=JSON.stringify(bio.sections.map(s=>s.visual));bio.sections.find(s=>s.kind==='products'||s.kind==='services').content.items[0].price='R$ 200,00';bio.cover='https://example.com/photo.jpg';bio.phone='5511987654321';const saved=JSON.parse(JSON.stringify(bio));validateBio(saved,saved.id);assert.equal(saved.phone,'5511987654321');assert.equal(JSON.stringify(saved.sections.map(s=>s.visual)),dimensions);assert.notEqual(other.cover,bio.cover);assert.notEqual(other.sections.find(s=>s.kind==='products').content.items[0].price,'R$ 200,00')
})
test('official library preserves 21 originals and complete Urban inventory',()=>{assert.equal(templates.length,21);assert.equal(readyTemplates.length,36+secondBatchModelIds.length+beautyLoteOneModelIds.length+loteTwoModelIds.length+loteThreeModelIds.length+loteFourModelIds.length+loteFiveModelIds.length+loteSixModelIds.length+loteSevenModelIds.length);const urban=readyTemplates.find(t=>t.id==='urban-black-moda-masculina').bio;assert.equal(urban.sections.length,14);assert.equal(urban.sections.find(s=>s.kind==='products').content.items.length,6);assert.equal(urban.sections.find(s=>s.kind==='categories').content.highlights.length,4);assert.equal(urban.sections.find(s=>s.kind==='gallery').content.photos.length,6)})
test('complete Bella and boutique references retain inventory, footer links and independent photo slots',()=>{for(const id of ['bella-moda-feminina','charmme-moda-feminina','lumiere-boutique','vibe-store']){const bio=readyTemplates.find(t=>t.id===id).bio;assert.equal(bio.sections.find(s=>s.kind==='products').content.items.length,6);assert.equal(bio.sections.find(s=>s.kind==='gallery').content.photos.length,6);assert.equal(bio.sections.filter(s=>s.kind==='promotion').length,2);assert(bio.sections.some(s=>s.kind==='hours'));assert(bio.sections.some(s=>s.kind==='location'));assert(bio.sections.some(s=>s.kind==='whatsapp'));const nav=bio.sections.find(s=>s.layout==='inline'&&s.visual?.actionFormat==='rows');assert.equal(nav.content.actions.length,5);for(const a of nav.content.actions)assert(bio.sections.some(s=>s.id===a.sectionId));const doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;const copyright=doc.querySelector('.gold-text-block');assert(copyright);assert.equal(resolveEditorTarget(copyright.querySelector('p'),bio).kind,'section');if(bio.actions.length)assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-button'),bio).kind,'action')}})
test('new commercial references preserve their own inventory and valid editable destinations',()=>{
 const expected={'nexo-moda-masculina':[8,6,4],'atelier-27':[7,3,3],'lumiere-moda-feminina':[6,6,4],'imperium-barbearia':[10,5,4],'barber-pro':[8,4,4],'royal-barber':[8,4,4],'bravo-barbearia':[8,4,4],'the-cut-barbearia':[8,4,4]};
 for(const [id,[itemCount,categories,actionCount]] of Object.entries(expected)){
 const bio=createBio(readyTemplates.find(t=>t.id===id));assert.equal(bio.sections.flatMap(s=>s.content?.items||[]).length,itemCount);assert.equal(bio.sections.find(s=>s.kind==='categories').content.highlights.length,categories);assert.equal(bio.sections.find(s=>s.kind==='actions').content.actions.length,actionCount);
 for(const s of bio.sections)for(const a of s.content?.actions||[])if(a.destination==='section')assert(bio.sections.some(target=>target.id===a.sectionId),'missing '+a.sectionId);
 const doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;assert.equal(resolveEditorTarget(doc.querySelector('.gold-reviews strong'),bio).kind,'entry');
 for(const node of doc.querySelectorAll('.gold-product-contact'))assert.match(node.href,/wa.me/);assert.equal(resolveEditorTarget(doc.querySelector('.gold-hero-button'),bio).kind,'action');
 }
})
test('approved Gold keeps its original responsive rules',()=>{const bio=createBio(readyTemplates.find(t=>t.id==='moda-premium-gold'));const doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;assert.equal(doc.querySelector('[data-ready-model]').getAttribute('data-responsive-contract'),null)})

for(const id of secondBatchModelIds)test(id+' keeps editable content, navigation and persisted preset',()=>{
 const model=readyTemplates.find(t=>t.id===id);assert(model);const bio=createBio(model),independent=createBio(model);
 assert.equal(validateBio(JSON.parse(JSON.stringify(bio)),bio.id),id);
 const doc=new JSDOM(renderToString(React.createElement(BioSite,{bio}))).window.document;
 assert.equal(doc.querySelector('[data-library-batch]').getAttribute('data-library-batch'),'2');
 assert.equal(doc.querySelectorAll('.premium-actions > *').length,5);
 assert.equal(resolveEditorTarget(doc.querySelector('.gold-product img'),bio).part,'image');
 assert.equal(resolveEditorTarget(doc.querySelector('.gold-product strong'),bio).field,'price');
 for(const image of doc.querySelectorAll('[data-section-id] img')){const target=resolveEditorTarget(image,bio);assert(target);if(image.alt==='Logo')assert.equal(target.key,'logo');else assert.equal(target.part,'image');}
 for(const caption of doc.querySelectorAll('.gold-gallery-caption span'))assert.equal(resolveEditorTarget(caption,bio).collection,'highlights');
 assert.match(doc.querySelector('.gold-location-cta').href,/google.com\/maps/);
 for(const s of bio.sections)for(const a of s.content?.actions||[])if(a.destination==='section')assert(bio.sections.some(target=>target.id===a.sectionId),'missing '+a.sectionId);
 const rendered=Array.from(doc.querySelectorAll('.gold-section')).map(node=>node.getAttribute('data-section-id'));
 assert.deepEqual(rendered,bio.sections.filter(s=>s.enabled).map(s=>s.id));
 const priceSection=bio.sections.find(s=>s.kind==='products');priceSection.content.items[0].price='R$ 200,00';
 bio.sections.find(s=>s.kind==='gallery').content.photos[0]='https://example.com/replacement.jpg';
 assert.notEqual(independent.sections.find(s=>s.kind==='products').content.items[0].price,'R$ 200,00');
 validateBio(JSON.parse(JSON.stringify(bio)),bio.id);
})
test.after(async()=>vite.close())


