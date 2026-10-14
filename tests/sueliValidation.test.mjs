import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {JSDOM} from 'jsdom'
import {PGlite} from '@electric-sql/pglite'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
import {createRepository} from '../server/repository.mjs'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=typeof dom.window[k]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};globalThis.localStorage=dom.window.localStorage;globalThis.innerHeight=900;globalThis.matchMedia=()=>({matches:false});window.matchMedia=globalThis.matchMedia
const React=await import('react'),{createRoot}=await import('react-dom/client')
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,templates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{sueliNascimento}=await vite.ssrLoadModule('/src/data/sueliNascimento.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{VisualBioEditor}=await vite.ssrLoadModule('/src/components/VisualBioEditor.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts')
const model=readyTemplates.find(t=>t.id==='sueli-nascimento'),client=sueliNascimento(templates[0].bio),root=createRoot(document.getElementById('root'))
const render=async bio=>React.act(async()=>root.render(React.createElement(BioSite,{bio})))
const click=async el=>React.act(async()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))
test('client and reusable seed validate, contain independent content and local assets',async()=>{
 assert(model);const demo=createBio(model),real=createBio(client)
 for(const bio of [demo,real]){validateBio(JSON.parse(JSON.stringify(bio)),bio.id);for(const url of [bio.cover,bio.logo,...bio.photos,...bio.sections.flatMap(s=>[s.image,...(s.content?.photos||[]),...(s.content?.items||[]).map(i=>i.image)])].filter(Boolean))await fs.access('public'+url)}
 assert.equal(real.name,'Sueli Nascimento');assert.equal(demo.name,model.previewBio.name)
 for(const field of ['phone','instagram'])assert.equal(demo[field],'')
 assert.equal(demo.logo,real.logo)
 assert.equal(model.label,'Beleza Premium — SN Studio')
 assert.equal(model.previewBio.name,'Sueli Nascimento')
 assert.equal(model.previewBio.logo,real.logo)
 const content=JSON.stringify(demo);assert(content.includes('/images/sueli-nascimento/'));assert(content.includes('Sueli Nascimento'))
 assert.deepEqual(JSON.parse(JSON.stringify({...demo,id:model.previewBio.id})),JSON.parse(JSON.stringify(model.previewBio)))
 assert.notEqual(demo.id,real.id);const original=JSON.stringify(model)
 demo.sections.find(s=>s.kind==='services').content.items[0].title='Editado';real.name='Cliente editada';assert.equal(JSON.stringify(model),original)
 const hashes=JSON.parse(await fs.readFile('tests/fixtures/sueli-existing-models.json','utf8'))
 for(const [id,hash] of Object.entries(hashes))assert.equal(createHash('sha256').update(JSON.stringify(readyTemplates.find(t=>t.id===id))).digest('hex'),hash,id)
})
test('all service and result filters, carousel arrows and dots work',async()=>{
 await render(createBio(client))
 const services=document.querySelector('.sn-section-services')
 for(const [label,count] of [['Unhas',1],['Cabelos',1],['Spa dos Pés',1],['Mais',1],['Todos',4]]){await click([...services.querySelectorAll('.sn-filters button')].find(e=>e.textContent===label));assert.equal(services.querySelectorAll('[data-item-id]').length,count)}
 const results=document.querySelector('.sn-results')
 for(const [label,count] of [['Cabelos',2],['Unhas',1],['Sobrancelhas',2],['Mais',2],['Todos',7]]){await click([...results.querySelectorAll('.sn-filters button')].find(e=>e.textContent===label));assert.equal(results.querySelectorAll('figure').length,count)}
 await click(document.querySelector('.sn-next'));assert.equal(document.querySelector('.sn-carousel-track').style.transform,'translateX(-100%)')
 await click(document.querySelector('.sn-prev'));assert.equal(document.querySelector('.sn-carousel-track').style.transform,'translateX(-0%)')
 await click(document.querySelectorAll('.sn-dots button')[1]);assert.equal(document.querySelectorAll('.sn-dots button')[1].getAttribute('aria-pressed'),'true')
 for(const selector of ['.sn-cover','.sn-logo img','.sn-brand h1','.sn-portrait img','.sn-intro-copy h2','.sn-service img','.sn-service h3','.sn-service .sn-button','.sn-banner h2','.sn-result-grid img','.sn-about-copy img','[data-editor-field="hours"]','[data-editor-field="address"]'])assert(resolveEditorTarget(document.querySelector(selector),client.bio),selector)
 for(const a of document.querySelectorAll('a[href^="#"]'))assert(document.getElementById(a.getAttribute('href').slice(1)),a.outerHTML)
})
test('editor embedding preserves visual filters, gallery arrows and dots',async()=>{
 await React.act(async()=>root.render(React.createElement(BioSite,{bio:createBio(model),embedded:true})))
 assert.equal(document.querySelectorAll('.sn-filter').length,10)
 assert.equal(document.querySelectorAll('.sn-prev,.sn-next').length,2)
 assert.equal(document.querySelectorAll('.sn-dot').length,2)
 assert.equal(document.querySelector('.sn-brand h1').textContent,model.previewBio.name)
 assert.equal(document.querySelector('.sn-portrait img').getAttribute('src'),model.previewBio.photos[0])
})
test('shared visual editor changes cloned model name without modifying library',async()=>{
 let current=createBio(model);const original=JSON.stringify(model)
 function Harness(){const [bio,setBio]=React.useState(current);return React.createElement(VisualBioEditor,{bio,onChange:patch=>setBio(old=>(current={...old,...patch})),onAdvanced(){}})}
 await React.act(async()=>root.render(React.createElement(Harness)));await click(document.querySelector('.sn-brand h1'))
 const label=[...document.querySelectorAll('label')].find(e=>e.textContent.startsWith('Nome')),input=label?.querySelector('textarea,input');assert(input,'Name field in visual editor')
 await React.act(async()=>{Object.getOwnPropertyDescriptor(input.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,'value').set.call(input,'Sueli Nascimento — teste');input.dispatchEvent(new window.Event('input',{bubbles:true}))})
 assert.equal(current.name,'Sueli Nascimento — teste');validateBio(JSON.parse(JSON.stringify(current)),current.id);assert.equal(JSON.stringify(model),original)
})
function postgres(db){const sql=(strings,...values)=>{let text='',args=[];strings.forEach((part,i)=>{text+=part;if(i<values.length){const v=values[i];if(v?.sql){const offset=args.length;text+=v.text.replace(/\$(\d+)/g,(_,n)=>'$'+(+n+offset));args.push(...v.values)}else{args.push(v);text+='$'+args.length}}});return {sql:true,text,values:args}};sql.transaction=async queries=>{await db.exec('BEGIN');try{const rows=[];for(const q of queries)rows.push((await db.query(q.text,q.values)).rows);await db.exec('COMMIT');return rows}catch(e){await db.exec('ROLLBACK');throw e}};return sql}
test('production repository saves/reopens independent records in isolated PostgreSQL; retry never duplicates',async()=>{
 const db=new PGlite();try{await db.exec(await fs.readFile('migrations/0001_biosite.sql','utf8'));const repo=createRepository(postgres(db))
 const real=JSON.parse(JSON.stringify(createBio(client))),demo=JSON.parse(JSON.stringify(createBio(model)))
 const a=await repo.create(real),b=await repo.create(demo);await repo.create(real)
 assert.equal((await repo.list()).items.length,2);real.sections.find(s=>s.kind==='services').content.items[0].description='Descrição editada'
 const saved=await repo.save(real.id,real,a.lockVersion);assert.deepEqual((await repo.get(real.id)).content,real);assert.deepEqual((await repo.get(demo.id)).content,demo);assert.equal(saved.publishedRevision,null);assert.equal(b.publishedRevision,null)
 }finally{await db.close()}
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
