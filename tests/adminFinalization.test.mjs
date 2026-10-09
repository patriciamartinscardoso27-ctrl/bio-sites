import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
import {publicContent} from '../server/publication.mjs'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent'])globalThis[k]=dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-admin-final',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{ModelLibrary}=await vite.ssrLoadModule('/src/components/AdminCreation.tsx'),{ClientProfile}=await vite.ssrLoadModule('/src/components/ClientProfile.tsx')
const root=createRoot(document.getElementById('root')),original=JSON.stringify(readyTemplates)
const render=async element=>React.act(async()=>root.render(element)),click=async element=>{assert(element);await React.act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))},input=async(element,value)=>{assert(element);const proto=element.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;await React.act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(element,value);element.dispatchEvent(new window.Event('input',{bubbles:true}))})}
test('gallery preserves 76 models, searches accents, combines seven category filters and uses actual selected model',async()=>{
 let selected;await render(React.createElement(ModelLibrary,{onUse:t=>selected=t}))
 assert.equal(document.querySelectorAll('.studio-model-card').length,76);assert.equal(document.querySelectorAll('.studio-filters button').length,8)
 const search=document.querySelector('[aria-label="Buscar modelo por nome"]')
 await input(search,'acai');assert.equal(document.querySelectorAll('.studio-model-card').length,2)
 await click([...document.querySelectorAll('.studio-filters button')].find(x=>x.textContent==='Loja de Roupas'));assert.equal(document.querySelectorAll('.studio-model-card').length,0);assert(document.querySelector('.studio-empty'))
 await input(search,'');await click(document.querySelector('.studio-filters button'));await input(search,'Moda Premium Gold')
 assert.equal(document.querySelectorAll('.studio-model-card').length,1)
 await click([...document.querySelectorAll('.studio-model-copy button')].find(x=>x.textContent==='Visualizar'));assert(document.querySelector('.moda-premium-gold'))
 await click([...document.querySelectorAll('.studio-model-bar button')].find(x=>x.textContent.includes('Usar este modelo')));assert.equal(selected.id,'moda-premium-gold')
 assert.equal(JSON.stringify(readyTemplates),original)
})
test('client fields remain optional, save/reopen with existing JSON schema and keep internal notes out of public snapshot',async()=>{
 let current=createBio(readyTemplates[0]),saved;const geometry=JSON.stringify(current.sections)
 function Harness(){const [bio,setBio]=React.useState(current);return React.createElement(ClientProfile,{bio,busy:false,dirty:true,status:'Rascunho',onChange:patch=>setBio(old=>(current={...old,...patch})),onSave:()=>saved=JSON.stringify(current)})}
 await render(React.createElement(Harness))
 const field=label=>[...document.querySelectorAll('label')].find(x=>x.textContent.startsWith(label))?.querySelector('input,textarea,select')
 assert.equal(field('Estabelecimento').required,true);for(const label of ['Responsável','WhatsApp','Telefone','E-mail','Endereço','Observações'])assert.equal(field(label).required,false)
 await input(field('Responsável'),'Responsável TESTE LOCAL');await input(field('E-mail'),'contato@example.com');await input(field('WhatsApp'),'5511987654321');await input(field('Telefone'),'551132345678');await input(field('Endereço'),'Rua do Teste, 100 · Centro · Cidade · SP · 00000-000');await input(field('Observações'),'NOTA INTERNA TESTE LOCAL')
 await React.act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 const reopened=JSON.parse(saved);validateBio(reopened);assert.equal(reopened.client.responsible,'Responsável TESTE LOCAL');assert.equal(reopened.email,'contato@example.com');assert.equal(reopened.telephone,'551132345678');assert.equal(JSON.stringify(reopened.sections),geometry);assert(!JSON.stringify(publicContent(reopened)).includes('NOTA INTERNA'));assert(!JSON.stringify(publicContent(reopened)).includes('Responsável TESTE LOCAL'));assert.equal(JSON.stringify(readyTemplates),original)
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
