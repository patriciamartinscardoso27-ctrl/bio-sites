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

test('real editor recovers 409, reviews same-field conflicts, saves and publishes on the same URL',async()=>{
 const {patyGaletos}=await vite.ssrLoadModule('/src/data/patyGaletos.ts'),{templates}=await vite.ssrLoadModule('/src/data/templates.ts')
 const content=createBio(patyGaletos(templates[0].bio));content.name='Paty Galetos'
 let current={id:content.id,slug:'paty-existing-url',status:'published',lockVersion:'1',draftRevision:'1',publishedRevision:'1',createdAt:'2026-10-14T00:00:00Z',updatedAt:'2026-10-14T00:00:00Z',publishedAt:'2026-10-14T00:00:00Z',templateId:'paty-galetos',content:structuredClone(content)},writes=[],forceConflict=true
 globalThis.fetch=async(path,options={})=>{
  if(path==='/api/publication/config')return Response.json({origin:'https://example.com',writesEnabled:true})
  if(path==='/api/biosites')return Response.json({items:[{...current,name:current.content.name,style:current.content.style,category:current.content.category}],nextCursor:null})
  if(options.method==='PUT'){
   const value=JSON.parse(options.body);writes.push(value)
   if(forceConflict){forceConflict=false;return Response.json({error:'Este BioSite foi salvo em outra aba.'},{status:409})}
   assert.equal(value.lockVersion,current.lockVersion)
   current={...current,content:value.content,lockVersion:String(+current.lockVersion+1),draftRevision:String(+current.draftRevision+1)};return Response.json(current)
  }
  if(options.method==='POST'&&path.endsWith('/publish')){const value=JSON.parse(options.body);assert.equal(value.lockVersion,current.lockVersion);current={...current,publishedRevision:current.draftRevision};return Response.json(current)}
  return Response.json(current)
 }
 await React.act(async()=>root.render(React.createElement(App)))
 await click([...document.querySelectorAll('.studio-card-actions button')].find(b=>b.textContent==='Editar'))
 const edit=async value=>{await click(document.querySelector('[data-bio-field="headline"]'));const field=document.querySelector('.studio-sheet textarea');assert(field);await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(field,value);field.dispatchEvent(new window.Event('input',{bubbles:true}))});await click(button('Fechar painel'))}
 current={...current,lockVersion:'2',draftRevision:'2',content:{...current.content,hours:'Horário remoto preservado'}}
 await edit('Cardápio local preservado');await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'))
 assert.equal(current.content.headline,'Cardápio local preservado');assert.equal(current.content.hours,'Horário remoto preservado');assert.equal(writes.length,2)
 current={...current,lockVersion:'4',draftRevision:'4',content:{...current.content,headline:'Outra alteração remota'}};forceConflict=true
 await edit('Minha edição em conflito');await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'))
 assert.match(document.body.textContent,/Escolha o conteúdo dos campos em conflito/);assert.equal(writes.length,3)
 const radio=document.querySelector('section[aria-label="Recuperar alterações em conflito"] input[type="radio"]');await click(radio);await click(button('Preparar versão recuperada para revisão'))
 await React.act(async()=>new Promise(r=>setTimeout(r,1700)));assert.equal(writes.length,3,'review must not auto-save')
 await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert.equal(current.content.headline,'Minha edição em conflito');assert.equal(current.slug,'paty-existing-url')
 await click([...document.querySelectorAll('.publication-panel button')].find(b=>b.textContent==='Atualizar publicação'));assert.equal(current.publishedRevision,current.draftRevision)
 assert(localStorage.length>1,'separate recovery copies retained')
 const unsaved={...structuredClone(current.content),hours:'Horários locais ainda não salvos'};keepNeonBackup(unsaved,current)
 const count=writes.length
 await React.act(async()=>root.render(React.createElement(App,{key:'reopen'})))
 await click([...document.querySelectorAll('.studio-card-actions button')].find(b=>b.textContent==='Editar'))
 assert.match(document.body.textContent,/Horários locais ainda não salvos/)
 await React.act(async()=>new Promise(r=>setTimeout(r,1700)));assert.equal(writes.length,count,'restoring local copy cannot overwrite Neon automatically')
 await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert.equal(current.content.hours,unsaved.hours)
 await click([...document.querySelectorAll('.publication-panel button')].find(b=>b.textContent==='Atualizar publicação'));assert.equal(current.publishedRevision,current.draftRevision);assert.equal(current.slug,'paty-existing-url')

})
test.after(async()=>{globalThis.fetch=oldFetch;await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
