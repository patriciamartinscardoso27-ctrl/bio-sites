import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','HTMLElement','Element','Node','Event','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.localStorage=dom.window.localStorage;globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844;globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{}
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {default:App}=await vite.ssrLoadModule('/src/App.tsx'),{readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{keepNeonBackup}=await vite.ssrLoadModule('/src/lib/neonBackups.ts'),root=createRoot(document.getElementById('root')),oldFetch=globalThis.fetch
const click=async el=>{assert(el);await React.act(async()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))},button=text=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===text)
test('reviewing a recovered local copy never silently overwrites Neon; explicit Save commits it',async()=>{
 const content=createBio(readyTemplates.find(t=>t.id==='fashion-boutique-gold')),saved={id:content.id,slug:'audit-recovery-'+content.id,status:'unpublished',lockVersion:'1',draftRevision:'1',publishedRevision:null,createdAt:'2026-10-08T00:00:00Z',updatedAt:'2026-10-08T00:00:00Z',publishedAt:null,templateId:'fashion-boutique-gold',content:structuredClone(content)},recovered={...structuredClone(content),headline:'Cópia recuperada ainda não aprovada'},writes=[]
 keepNeonBackup(recovered,saved)
 globalThis.fetch=async(path,options={})=>{if(options.method==='PUT'||options.method==='POST'){writes.push(JSON.parse(options.body));return Response.json({...saved,lockVersion:'2',content:writes.at(-1).content})}if(path==='/api/biosites')return Response.json({items:[{...saved,name:content.name,style:content.style,category:content.category}],nextCursor:null});return Response.json(saved)}
 await React.act(async()=>root.render(React.createElement(App)));await click(button('Configurações'));await click(button('Revisar cópias locais da persistência'));await React.act(async()=>new Promise(resolve=>setTimeout(resolve,1800)))
 assert.equal(writes.length,0,'opening the local backup must require an explicit save before any remote write');assert.match(document.body.textContent,/Cópia recuperada ainda não aprovada/)
 await click(document.querySelector('.gold-hero-headline'));const field=document.querySelector('.studio-sheet textarea');await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(field,'Cópia revisada localmente');field.dispatchEvent(new window.Event('input',{bubbles:true}))});await React.act(async()=>new Promise(resolve=>setTimeout(resolve,1700)));assert.equal(writes.length,0,'editing a recovered copy must retain explicit-save protection')
 await click([...document.querySelectorAll('.studio-sidebar nav button')].find(b=>b.textContent.includes('Clientes')));assert.equal(writes.length,0,'navigation must preserve the recovered copy locally');await click([...document.querySelectorAll('.studio-card-actions button')].find(b=>b.textContent==='Editar'));assert.match(document.body.textContent,/Cópia revisada localmente/)
 await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert.equal(writes.length,1);assert.equal(writes[0].content.headline,'Cópia revisada localmente');assert.equal(writes[0].lockVersion,'1');assert.equal(saved.content.headline,content.headline)
})
test.after(async()=>{globalThis.fetch=oldFetch;await React.act(async()=>root.unmount());await vite.close();dom.window.close()})

