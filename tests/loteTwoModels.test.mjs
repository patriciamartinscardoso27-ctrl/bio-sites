import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};globalThis.localStorage=dom.window.localStorage;globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-loteTwoModels',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{loteTwoModelIds}=await vite.ssrLoadModule('/src/data/readyModelIds.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{VisualBioEditor}=await vite.ssrLoadModule('/src/components/VisualBioEditor.tsx'),{ModelLibrary}=await vite.ssrLoadModule('/src/components/AdminCreation.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts'),{keepNeonBackup,readNeonBackups}=await vite.ssrLoadModule('/src/lib/neonBackups.ts')
const root=createRoot(document.getElementById('root')),render=async el=>React.act(async()=>root.render(el)),click=async el=>{assert(el);await React.act(async()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))},input=async(el,value)=>{assert(el);const proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;await React.act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}))})}
const sequences={
 'lash-beauty':['actions','about','benefits','results','care','services','transform','packages','reviews'],
 'cilios-studio':['actions','about','results','care','services','transform','benefits','reviews','gallery'],
 'lash-more':['actions','about','services','care','benefits','results','packages','reviews','transform'],
 'burger-fire':['actions','about','benefits','products','combo-banner','combos','space','gallery','reviews'],
 'sabor-da-casa':['actions','about','benefits','products','combo-banner','categories','space','reviews','gallery']
}
test('76 unique records preserve every previous record in the 43-model inventory',async()=>{assert.equal(readyTemplates.length,76);assert.equal(new Set(readyTemplates.map(t=>t.id)).size,76);const inventory=JSON.parse(await fs.readFile('artifacts/official-models/audit-inventory.json','utf8'));for(const old of inventory.registered)assert(readyTemplates.some(t=>t.id===old.id));for(const id of loteTwoModelIds)assert(readyTemplates.some(t=>t.id===id))})
for(const id of loteTwoModelIds){
 test(id+' renders its original full sequence with direct ownership for every content type',async()=>{const bio=createBio(readyTemplates.find(t=>t.id===id));assert.equal(validateBio(bio,bio.id),id);await render(React.createElement(BioSite,{bio}));assert.deepEqual(bio.sections.map(s=>s.id.slice(id.length+1)),[...sequences[id],'hours','location','whatsapp','identity','social','navigation','copyright']);assert.equal(document.querySelector('[data-library-batch]').dataset.libraryBatch,'4');assert.equal(document.querySelectorAll('[data-section-id]').length,bio.sections.length)
  for(const img of document.querySelectorAll('img')){const target=resolveEditorTarget(img,bio);assert(target,img.outerHTML);if(img.alt==='Logo')assert.equal(target.key,'logo');else if(img.alt==='Capa')assert.equal(target.key,'cover');else if(img.closest('[data-action-id]'))assert.equal(target.kind,'action');else assert.equal(target.part,'image',img.outerHTML);if(img.src.includes('/images/'))await fs.access('public'+new URL(img.src).pathname)}
  for(const node of document.querySelectorAll('a,h2,h3,p,strong,small,[data-editable-text],[data-editor-field]'))if(node.textContent.trim()||node.tagName==='A')assert(resolveEditorTarget(node,bio),node.outerHTML)
  for(const n of document.querySelectorAll('.gold-product strong'))assert.equal(resolveEditorTarget(n,bio).field,'price');for(const n of document.querySelectorAll('.gold-product-contact'))assert.equal(resolveEditorTarget(n,bio).field,'action')
  for(const s of bio.sections)for(const a of [...(s.content?.actions||[]),...(s.content?.highlights||[]).map(h=>h.action),s.action].filter(Boolean))if(a.destination==='section')assert(bio.sections.some(t=>t.enabled&&t.id===a.sectionId),a.sectionId)
 })
 test(id+' actual shared editor clicks, edits, saves and reopens without changing composition',async()=>{const template=readyTemplates.find(t=>t.id===id),original=JSON.stringify(template),other=createBio(template);let current=createBio(template),saved;const geometry=b=>JSON.stringify({hero:b.heroVisual,text:b.textVisual,sections:b.sections.map(s=>[s.id,s.kind,s.layout,s.visual,s.titleVisual])}),before=geometry(current)
  function Harness(){const [bio,setBio]=React.useState(current);return React.createElement(VisualBioEditor,{bio,onAdvanced(){},onChange:p=>setBio(old=>(current={...old,...p})),onSave:()=>{keepNeonBackup(current);saved=JSON.stringify(current)}})}
  await render(React.createElement(Harness,{key:id}));
  await click(document.querySelector('.gold-hero-headline'));assert.equal(document.querySelector('.studio-sheet textarea').value,current.headline);await input(document.querySelector('.studio-sheet textarea'),'Meu título editado')
  await click(document.querySelector('header .gold-logo'));assert.equal(document.querySelector('.studio-sheet .image-field input:not([type=file])').value,current.logo);await input(document.querySelector('.studio-sheet .image-field input:not([type=file])'),'/images/official-batch-2/beauty-leaf.svg')
  await click(document.querySelector('.gold-hero-photo'));await input(document.querySelector('.studio-sheet .image-field input:not([type=file])'),'/images/official-batch-2/beauty-hero.png')
  await click(document.querySelector('.gold-product h3'));assert.equal(document.querySelector('.studio-sheet [data-editor-control=title]').value,current.sections.find(s=>s.content?.items?.length).content.items[0].title);await input(document.querySelector('.studio-sheet [data-editor-control=title]'),'Item editado')
  await click(document.querySelector('.gold-product strong')||document.querySelector('.gold-product h3'));assert(document.querySelector('.studio-sheet [data-editor-control=price]'));await input(document.querySelector('.studio-sheet [data-editor-control=price]'),'R$ 207,90')
  await click(document.querySelector('.gold-product img'));assert(document.querySelector('.studio-sheet .image-field'));await input(document.querySelector('.studio-sheet .image-field input:not([type=file])'),'/images/official-batch-2/beauty-brows.png')
  await click(document.querySelector('.gold-product-contact'));assert.equal(document.querySelector('.studio-context-tabs button[aria-pressed=true]').textContent,'Ação');assert(document.querySelector('.studio-sheet input[data-editor-control=link]'));await input(document.querySelector('.studio-sheet input[data-editor-control=link]'),'5511988887777')
  await click(document.querySelector('.gold-banner h2'));await input(document.querySelector('.studio-sheet [data-editor-control=title]'),'Banner editado')
  await click(document.querySelector('.gold-banner-button'));assert.equal(document.querySelector('.studio-context-tabs button[aria-pressed=true]').textContent,'Ação');assert(document.querySelector('.studio-sheet .studio-internal-sections button,.studio-sheet input,.studio-sheet select'))
  await click(document.querySelector('.gold-gallery-grid img'));await input(document.querySelector('.studio-sheet .image-field input:not([type=file])'),'/images/official-batch-2/beauty-brows.png')
  await click(document.querySelector('[data-benefit-index] h3'));assert(document.querySelector('.studio-sheet [data-editor-control=title]'));await input(document.querySelector('.studio-sheet [data-editor-control=title]'),'Benefício editado')
  await click(document.querySelector('.gold-reviews strong'));await input(document.querySelector('.studio-sheet [data-editor-control=title]'),'Cliente editada')
  await click(document.querySelector('.gold-hours-card [data-editor-field=hours]'));assert(document.querySelector('.studio-sheet textarea'))
  await click(document.querySelector('.gold-address p'));assert(document.querySelector('.studio-sheet textarea'))
  await click(document.querySelector('.gold-location-image'));assert(document.querySelector('.studio-sheet .image-field'))
  await click(document.querySelector('.gold-location-cta'));assert.equal(document.querySelector('.studio-context-tabs button[aria-pressed=true]').textContent,'Ação')
  await click(document.querySelector('.gold-footer-navigation a'));assert(document.querySelector('.studio-sheet-fields').textContent.trim())
  await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert(saved);const reopened=readNeonBackups().find(b=>b.content.id===current.id).content;assert.deepEqual(reopened,JSON.parse(saved));assert.equal(validateBio(reopened,reopened.id),id);assert.equal(geometry(reopened),before);assert.equal(JSON.stringify(template),original);assert.notEqual(other.headline,current.headline)
  await render(React.createElement(BioSite,{bio:reopened}));assert.equal(document.querySelector('.gold-hero-headline').textContent,'Meu título editado');assert.match(document.body.textContent,/R\$ 207,90/);assert.match(document.body.textContent,/Cliente editada/)
 })
}
test('all five are selectable in actual ModelLibrary and open the shared editor',async()=>{for(const id of loteTwoModelIds){const t=readyTemplates.find(t=>t.id===id);let selected;await render(React.createElement(ModelLibrary,{key:id,categoryId:t.categoryId,onUse:model=>selected=createBio(model)}));await click(document.querySelector('[aria-label="Abrir modelo '+t.label+'"]'));await click([...document.querySelectorAll('button')].find(b=>b.textContent.includes('Usar este modelo')));assert.equal(selected.layoutPreset,id)}})
test.after(async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})


