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
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()],optimizeDeps:{noDiscovery:true,include:[]}})
const {PremiumDesignImport}=await vite.ssrLoadModule('/src/components/PremiumDesignImport.tsx')
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

test('export and reimport stay in memory until explicit approval; no create or publish request is automatic',async()=>{
 await React.act(async()=>root.render(React.createElement(PremiumDesignImport,{onBack(){},onCreate:async b=>{creations++;assert.notEqual(b.id,source.id);return true},busy:false})))
 const select=document.querySelector('select');await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set.call(select,source.id);select.dispatchEvent(new window.Event('change',{bubbles:true}))})
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

test('cleanup',async()=>{globalThis.fetch=originalFetch;await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
