import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const k of ['window','document','HTMLElement','Element','Node','Event','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=typeof dom.window[k]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};globalThis.localStorage=window.localStorage;globalThis.innerHeight=1000;globalThis.matchMedia=()=>({matches:false});window.matchMedia=globalThis.matchMedia
const React=await import('react'),{createRoot}=await import('react-dom/client')
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,templates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{patyGaletos}=await vite.ssrLoadModule('/src/data/patyGaletos.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts')
const model=patyGaletos(templates[0].bio),root=createRoot(document.getElementById('root'))
const render=async embedded=>React.act(async()=>root.render(React.createElement(BioSite,{bio:createBio(model),embedded})))
const click=async element=>React.act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))
test('client layout validates with original assets and stays outside ready templates',async()=>{
 assert(model);assert.equal(readyTemplates.filter(t=>t.id===model.id).length,0);assert.equal(model.categoryId,'food')
 const a=createBio(model),b=createBio(model);validateBio(JSON.parse(JSON.stringify(a)),a.id)
 assert.deepEqual({...a,id:model.bio.id},model.bio);assert.notEqual(a.id,b.id);a.name='Editado';a.sections[4].content.items[0].title='Outro prato';assert.equal(b.name,model.bio.name);assert.equal(b.sections[4].content.items[0].title,'Marmita Caprichada')
 for(const f of (await fs.readdir('public/images/paty-galetos')).filter(f=>f.endsWith('.webp')))assert.match(f,/^[a-z0-9-]+\.webp$/)
 for(const url of [b.logo,b.cover,...b.sections.flatMap(s=>[s.image,...(s.content?.photos||[]),...(s.content?.items||[]).map(i=>i.image),...(s.content?.highlights||[]).map(i=>i.image)])].filter(Boolean))await fs.access('public'+url)
})
test('single continuous page has no navigation menu; card filters and gallery work',async()=>{
 await render(false);assert.equal(document.querySelectorAll('.pg-product').length,3)
 for(const [name,products,categories] of [['Marmitas',1,1],['Galetos',1,1],['Costela',1,1],['Acompanhamentos',0,2],['Todos',3,6]]){await click([...document.querySelectorAll('.pg-filter')].find(e=>e.textContent===name));assert.equal(document.querySelectorAll('.pg-product').length,products);assert.equal(document.querySelectorAll('.pg-categories>a').length,categories)}
 assert.equal(document.querySelectorAll('.pg-hamburger,.pg-menu').length,0)
 for(const a of document.querySelectorAll('a[href^="#"]'))assert(document.getElementById(a.getAttribute('href').slice(1)))
 await click(document.querySelector('.pg-gallery img'));assert(document.querySelector('[role="dialog"]'))
 await click(document.querySelector('.pg-lightbox button'));assert(!document.querySelector('[role="dialog"]'))
})
test('embedded editor retains filters, imagery and all field targets',async()=>{
 await render(true);assert.equal(document.querySelectorAll('.pg-filter').length,5);assert.equal(document.querySelectorAll('.pg-gallery img').length,3)
 for(const selector of ['.pg-cover','.pg-logo','.pg-hero h1','.pg-product img','.pg-product h3','.pg-product strong','.pg-product-bottom a','.pg-categories img','.pg-about p','.pg-info [data-editor-field="hours"]','.pg-location p','.pg-order'])assert(resolveEditorTarget(document.querySelector(selector),model.bio),selector)
})
test('client preview and public renderer stay identical after editing',async()=>{
 const {PublishedRenderer}=await vite.ssrLoadModule('/src/components/PublicBioSite.tsx')
 const {publicContent}=await import('../server/publication.mjs')
 assert((await fs.readFile('src/App.tsx','utf8')).includes("bio.layoutPreset==='paty-galetos'?<PublishedRenderer bio={bio}/>:<BioSite bio={bio}/>"))
 const edited=createBio(model);edited.description='Descrição editada';edited.sections.find(s=>s.kind==='about').text='Sobre editado'
 await React.act(async()=>root.render(React.createElement(PublishedRenderer,{bio:edited})))
 const preview=document.querySelector('.pg-site').outerHTML
 assert.match(preview,/Descrição editada/);assert.match(preview,/Sobre editado/)
 await React.act(async()=>root.render(React.createElement(PublishedRenderer,{bio:publicContent(edited)})))
 assert.equal(document.querySelector('.pg-site').outerHTML,preview)
 assert.notEqual(model.bio.description,edited.description)
})

test('client location connects both map buttons without touching other layouts',async()=>{
 const {patyLocationPatch}=await vite.ssrLoadModule('/src/lib/patyLocation.ts')
 const current=createBio(model),mapsUrl='https://maps.app.goo.gl/X6dW4ioGXCXiKihA8'
 const patch=patyLocationPatch(current,{mapsUrl}),updated={...current,...patch}
 await React.act(async()=>root.render(React.createElement(BioSite,{bio:updated})))
 const maps=[...document.querySelectorAll('a')].filter(a=>a.href===mapsUrl)
 assert.equal(maps.length,2)
 assert.deepEqual(patyLocationPatch({...current,layoutPreset:undefined},{mapsUrl}),{mapsUrl})
 assert.equal(current.mapsUrl,'')
})

test('empty beverage image opens the image uploader and can be replaced like the other cards',async()=>{
 const b=createBio(model),section=b.sections.find(s=>s.kind==='categories')
 await React.act(async()=>root.render(React.createElement(BioSite,{bio:b,embedded:true})))
 const slot=document.querySelector('.pg-category-symbol'),target=resolveEditorTarget(slot,b)
 assert.equal(target.kind,'entry');assert.equal(target.collection,'highlights');assert.equal(target.part,'image');assert.equal(target.field,'image')
 const {ContextualEntryEditor}=await vite.ssrLoadModule('/src/components/ContextualEntryEditor.tsx')
 let patch
 await React.act(async()=>root.render(React.createElement(ContextualEntryEditor,{bio:b,section,collection:'highlights',index:target.index,part:target.part,field:target.field,onChange:p=>patch=p,onRemoved:()=>{}})))
 assert(document.querySelector('input[type=file]'),'upload available immediately')
 const input=document.querySelector('[data-editor-control=image]')
 await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'/images/paty-galetos/galeto.webp');input.dispatchEvent(new window.Event('input',{bubbles:true}))})
 assert(patch);const updated={...b,...patch}
 await React.act(async()=>root.render(React.createElement(BioSite,{bio:updated})))
 const card=[...document.querySelectorAll('[data-highlight-id]')].find(e=>e.textContent==='Bebidas')
 assert.equal(card.querySelector('img').getAttribute('src'),'/images/paty-galetos/galeto.webp');assert.equal(card.querySelector('.pg-category-symbol'),null)
 assert.equal(section.content.highlights[target.index].image,'','original remains intact')
})

test('cleanup',async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
