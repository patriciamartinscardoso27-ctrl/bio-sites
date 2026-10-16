import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const source=JSON.parse(await fs.readFile(new URL('./fixtures/xavier-premium-roundtrip.json',import.meta.url),'utf8'))
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','Event','HTMLElement','Element','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client')
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},plugins:[(await import('@vitejs/plugin-react')).default()],optimizeDeps:{noDiscovery:true,include:[]}})
const {PremiumDesignImport}=await vite.ssrLoadModule('/src/components/PremiumDesignImport.tsx')
const {readyTemplates}=await vite.ssrLoadModule('/src/data/templates.ts')
const originalFetch=globalThis.fetch,requests=[];let creations=0
globalThis.fetch=async(path,options)=>{
 requests.push({path,method:options?.method||'GET'})
 if(path==='/api/biosites')return Response.json({items:[{id:source.id,name:source.name}],nextCursor:null})
 if(path==='/api/biosites/'+source.id)return Response.json({content:source})
 if(path==='/api/design-package'){try{return Response.json(processPremiumDesign(JSON.parse(options.body)))}catch(e){return Response.json({error:e.message},{status:400})}}
 throw Error('Unexpected request '+path)
}
const root=createRoot(document.getElementById('root'))
const click=async text=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent===text);assert(b);await React.act(async()=>b.dispatchEvent(new window.MouseEvent('click',{bubbles:true})))}
const choose=async(label,value)=>{const select=document.querySelector(`select[aria-label="${label}"]`);assert(select);await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set.call(select,value);select.dispatchEvent(new window.Event('change',{bubbles:true}))})}

test('ready library is the default; real premium model round-trip needs no customer reads or writes',async()=>{
 await React.act(async()=>root.render(React.createElement(PremiumDesignImport,{onBack(){},onCreate:async()=>{creations++;return true},busy:false})))
 assert.equal(document.querySelector('[aria-label="Origem do design"]').value,'models')
 assert.equal(requests.length,0)
 const select=document.querySelector('[aria-label="Modelo Pronto para exportar"]')
 assert.equal(select.options.length,readyTemplates.length+1)
 const model=readyTemplates.find(t=>t.id==='moda-premium-gold');assert(model)
 const before=JSON.stringify(model)
 await choose('Modelo Pronto para exportar',model.id)
 await click('Exportar e conferir reimportação')
 assert(document.querySelector('[data-premium-import-preview]'));assert.equal(creations,0)
 assert(requests.every(r=>r.path==='/api/design-package'))
 assert.equal(JSON.stringify(model),before)
 await choose('Origem do design','clients')
 assert(!document.querySelector('[data-premium-import-preview]'))
 assert.equal(document.querySelector('[aria-label="BioSite para exportar"]').options.length,2)
})

test('export and reimport stay in memory until explicit approval; no create or publish request is automatic',async()=>{
 await React.act(async()=>root.render(React.createElement(PremiumDesignImport,{onBack(){},onCreate:async b=>{creations++;assert.notEqual(b.id,source.id);return true},busy:false})))
 await choose('Origem do design','clients')
 await choose('BioSite para exportar',source.id)
 await click('Exportar e conferir reimportação')
 assert(document.querySelector('[data-premium-import-preview]'));assert.equal(creations,0)
 assert(!requests.some(r=>r.method==='POST'&&r.path!=='/api/design-package'))
 await click('Aprovar e criar novo rascunho');assert.equal(creations,1)
})

test('invalid uploaded package is rejected before preview or server upload',async()=>{
 const input=document.querySelector('input[type=file]'),before=requests.length
 Object.defineProperty(input,'files',{value:[{name:'unsafe.json',size:30,text:async()=>'{"format":"evil","code":"alert(1)"}'}],configurable:true})
 await React.act(async()=>{input.dispatchEvent(new window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,10))})
 assert(document.querySelector('[role=alert]'));assert(!document.querySelector('[data-premium-import-preview]'));assert.equal(requests.length,before)
})

test('external package import remains available in default model origin without saving',async()=>{
 await choose('Origem do design','models')
 const input=document.querySelector('input[type=file]'),before=creations
 const pack=processPremiumDesign({operation:'export',bio:source}).package
 const json=JSON.stringify(pack)
 Object.defineProperty(input,'files',{value:[{name:'external.biosite.json',size:Buffer.byteLength(json),text:async()=>json}],configurable:true})
 await React.act(async()=>{input.dispatchEvent(new window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,10))})
 assert(document.querySelector('[data-premium-import-preview]'));assert.equal(creations,before)
 assert.equal(document.querySelector('[aria-label="Origem do design"]').value,'models')
})

test('cleanup',async()=>{globalThis.fetch=originalFetch;await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
