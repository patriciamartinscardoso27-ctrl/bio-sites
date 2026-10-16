import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const {resolveEditorTarget}=await import('../src/lib/editorTargets.ts')
const pack=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium-v2/exemplos/beleza-premium-v2.biosite.json',import.meta.url),'utf8'))
const comparison=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium-v2/exemplos/comparacao-v2.biosite.json',import.meta.url),'utf8'))
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','Event','HTMLElement','Element','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.localStorage=dom.window.localStorage;window.scrollTo=()=>{};globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844
const React=await import('react'),{createRoot}=await import('react-dom/client'),{renderToStaticMarkup}=await import('react-dom/server')
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},plugins:[(await import('@vitejs/plugin-react')).default()],optimizeDeps:{noDiscovery:true,include:[]}})
const {BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx')
const {ContextualSectionEditor}=await vite.ssrLoadModule('/src/components/ContextualSectionEditor.tsx')
const {ContextualItemEditor}=await vite.ssrLoadModule('/src/components/ContextualItemEditor.tsx')
const {ContextualActionEditor}=await vite.ssrLoadModule('/src/components/ContextualActionEditor.tsx')
const {PremiumDesignImport}=await vite.ssrLoadModule('/src/components/PremiumDesignImport.tsx')
const root=createRoot(document.getElementById('root'))
const render=async element=>React.act(async()=>root.render(element))
const click=async e=>{assert(e);await React.act(async()=>e.dispatchEvent(new window.MouseEvent('click',{bubbles:true})))}
const edit=async(e,value)=>{assert(e);await React.act(async()=>{Object.getOwnPropertyDescriptor(e.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new window.Event('input',{bubbles:true}))})}
const control=label=>[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith(label))?.querySelector('input:not([type=file]),textarea')
const noop=()=>{}
test('V2 real renderer preserves markup after roundtrip and declares existing editor ownership',async()=>{
 const copy=processPremiumDesign({operation:'import',package:pack}).bio
 const markup=bio=>renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}))
 assert.equal(markup(copy),markup(pack.design))
 await render(React.createElement(BioSite,{bio:copy,embedded:true}))
 assert.equal(document.querySelectorAll('[data-section-id]').length,13)
 assert.equal(resolveEditorTarget(document.querySelector('[data-bio-field=logo] img'),copy).key,'logo')
 assert.equal(resolveEditorTarget(document.querySelector('[data-bio-field=cover] img'),copy).key,'cover')
 assert.equal(resolveEditorTarget(document.querySelector('[data-bio-field=headline]'),copy).key,'headline')
 assert.equal(resolveEditorTarget(document.querySelector('[data-item-id=cut] img'),copy).kind,'item')
 assert.equal(resolveEditorTarget(document.querySelector('[data-section-id=results] [data-photo-index="0"] img'),copy).collection,'photos')
 assert.equal(resolveEditorTarget(document.querySelector('[data-action-id=wa]'),copy).kind,'action')
 const details=document.querySelector('[data-item-id=cut] details');assert(details);assert.equal(details.closest('a'),null)
})
test('existing editors can change service title, image, price, section copy and links while preserving V2 composition',async()=>{
 let bio=structuredClone(pack.design);const composition=JSON.stringify(bio.premiumV2)
 function ItemHarness(){const [current,set]=React.useState(bio);const s=current.sections.find(s=>s.id==='services'),item=s.content.items[0];return React.createElement(ContextualItemEditor,{bio:current,item,section:s,onChange:p=>set(old=>(bio={...old,sections:old.sections.map(s=>s.id==='services'?{...s,content:{...s.content,items:s.content.items.map((i,n)=>n===0?{...i,...p}:i)}}:s)})),onBioChange:noop,onDuplicate:noop,onRemove:noop,onSection:noop})}
 await render(React.createElement(ItemHarness));await edit(control('Nome'),'Corte editado');await edit(control('Preço'),'R$ 90,00');await click([...document.querySelectorAll('button')].find(b=>b.textContent==='Imagem'));await edit(document.querySelector('.image-field input:not([type=file])'),'https://example.com/foto.webp')
 assert.equal(bio.sections[4].content.items[0].title,'Corte editado');assert.equal(bio.sections[4].content.items[0].image,'https://example.com/foto.webp')
 function SectionHarness(){const [current,set]=React.useState(bio);return React.createElement(ContextualSectionEditor,{bio:current,section:current.sections.find(s=>s.id==='about'),onChange:p=>set(old=>(bio={...old,...p})),onRemoved:noop,onDuplicated:noop,onItem:noop})}
 await render(React.createElement(SectionHarness));await edit(control('Título'),'Sobre editado')
 function ActionHarness(){const [current,set]=React.useState(bio);return React.createElement(ContextualActionEditor,{bio:current,action:current.actions[0],onChange:p=>set(old=>(bio={...old,actions:[{...old.actions[0],...p}]})),onBioChange:noop,onDuplicate:noop,onRemove:noop,onSection:noop})}
 await render(React.createElement(ActionHarness));await edit(control('Texto do botão')||control('Nome')||control('Título'),'Novo contato')
 await click([...document.querySelectorAll('button')].find(b=>b.textContent==='Ação'));await edit(control('Link'),'https://example.com/novo-contato');assert.equal(bio.actions[0].url,'https://example.com/novo-contato')
 assert.equal(JSON.stringify(bio.premiumV2),composition)
 assert.doesNotThrow(()=>processPremiumDesign({operation:'export',bio}))
 await render(React.createElement(BioSite,{bio,embedded:true}));assert(document.body.textContent.includes('Corte editado'));assert(document.body.textContent.includes('Sobre editado'));assert.equal(document.querySelector('[data-action-id=hero-contact]').getAttribute('href'),'https://example.com/novo-contato')
})
test('comparison range is interactive and owned by existing gallery photo targets',async()=>{
 const bio=comparison.design;await render(React.createElement(BioSite,{bio,embedded:true}));const range=document.querySelector('input[type=range]');await edit(range,'70');assert(document.querySelector('.pv2-before').style.clipPath.includes('30%'));assert.equal(resolveEditorTarget(document.querySelector('[data-photo-index="0"]'),bio).collection,'photos')
})
test('V2 external upload reaches real preview without implicit create',async()=>{
 const original=globalThis.fetch;let created=0;globalThis.fetch=async(path,options)=>{assert.equal(path,'/api/design-package');return Response.json(processPremiumDesign(JSON.parse(options.body)))}
 try{
 await render(React.createElement(PremiumDesignImport,{busy:false,onBack:noop,onCreate:async()=>{created++;return true}}))
 const input=document.querySelector('input[type=file]'),json=JSON.stringify(pack);Object.defineProperty(input,'files',{value:[{name:'v2.biosite.json',size:json.length,text:async()=>json}],configurable:true});await React.act(async()=>{input.dispatchEvent(new window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,10))});assert(document.querySelector('[data-premium-version="2"]'));assert.equal(created,0)
 }finally{globalThis.fetch=original}
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
