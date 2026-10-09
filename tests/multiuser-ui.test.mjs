import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const key of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','localStorage'])globalThis[key]=dom.window[key]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true
window.scrollTo=()=>{}
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-multiuser',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {AdminCreation,ModelLibrary}=await vite.ssrLoadModule('/src/components/AdminCreation.tsx'),{default:App}=await vite.ssrLoadModule('/src/App.tsx'),backups=await vite.ssrLoadModule('/src/lib/neonBackups.ts'),{readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts')
const root=createRoot(document.getElementById('root')),render=element=>React.act(async()=>root.render(element)),click=element=>React.act(async()=>element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}))),before=JSON.stringify(readyTemplates)
const originalFetch=globalThis.fetch
globalThis.fetch=async path=>Response.json(String(path)==='/api/publication/config'?{origin:'https://example.invalid',writesEnabled:true}:String(path)==='/api/users'?{items:[]}:{items:[],nextCursor:null})
test('buyers retain complete manual creation and central library; AI entry is absent',async()=>{
 await render(React.createElement(AdminCreation,{onCreate:async()=>true,busy:false,allowAI:false}))
 assert(!document.body.textContent.includes('Criar com IA'));assert(document.body.textContent.includes('Criar do zero'));assert(document.body.textContent.includes('Escolher modelo'));assert(document.body.textContent.includes('Criação inteligente'))
 await render(React.createElement(AdminCreation,{onCreate:async()=>true,busy:false,allowAI:true}));assert(document.body.textContent.includes('Criar com IA'))
 await render(React.createElement(ModelLibrary,{onUse:()=>{}}));assert.equal(document.querySelectorAll('.studio-model-card').length,76);assert.equal(JSON.stringify(readyTemplates),before)
})
test('users section is restricted to principal; account name and roles are rendered correctly',async()=>{
 await render(React.createElement(App,{account:{id:'buyer-fixture',name:'Comprador Fixture',email:'buyer@example.invalid',role:'buyer',multiuser:true}}))
 assert(document.querySelector('.studio-profile').textContent.includes('Comprador Fixture'));assert(![...document.querySelectorAll('.studio-sidebar nav button')].some(b=>b.textContent==='Usuários'))
 await render(React.createElement(App,{key:'principal',account:{id:'principal-fixture',name:'Principal Fixture',email:'root@example.invalid',role:'principal',multiuser:true}}))
 const users=[...document.querySelectorAll('.studio-sidebar nav button')].find(b=>b.textContent==='Usuários');assert(users);await click(users);assert(document.body.textContent.includes('Adicionar usuário'))
})
test('manual invitation shows copy and WhatsApp actions without sending email or storing tokens',async()=>{
 const {UserManagement}=await vite.ssrLoadModule('/src/components/UserManagement.tsx')
 const fixture={id:'11111111-1111-4111-8111-111111111111',name:'Manual fixture',email:'manual@example.invalid',role:'buyer',status:'invited',siteCount:0},url='https://example.invalid/accept-invite#'+('A'.repeat(43));let generated=0,copied=''
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async value=>{copied=value}}})
 globalThis.fetch=async(path,options)=>{if(path==='/api/users/invite-link'){generated++;assert.deepEqual(JSON.parse(options.body),{name:fixture.name,email:fixture.email,userId:fixture.id});return Response.json({url,email:fixture.email,validForHours:48})}assert.equal(path,'/api/users');return Response.json({items:[fixture]})}
 await render(React.createElement(UserManagement));await React.act(async()=>{await new Promise(r=>setTimeout(r,20))})
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Gerar novo convite'));assert.equal(generated,1)
 assert.equal(document.querySelector('textarea').value,url)
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Copiar convite'));assert.equal(copied,url)
 const whatsapp=[...document.querySelectorAll('a')].find(x=>x.textContent==='Enviar pelo WhatsApp');assert.equal(new URL(whatsapp.href).host,'wa.me');assert(new URL(whatsapp.href).searchParams.get('text').includes(url));assert.equal(whatsapp.getAttribute('referrerpolicy'),'no-referrer')
 assert(!Object.values(localStorage).some(x=>String(x).includes(url)));await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Ocultar convite'));assert.equal(document.querySelector('textarea'),null)
 globalThis.fetch=async()=>Response.json({items:[]})
})
test('same browser never automatically exposes another account backup; legacy principal backups remain available',()=>{
 localStorage.clear();const a=createBio(readyTemplates[0]),b=createBio(readyTemplates[1]);backups.setBackupAccount('buyer-a',false);backups.keepNeonBackup(a);backups.setBackupAccount('buyer-b',false);assert.equal(backups.readNeonBackups().length,0);backups.keepNeonBackup(b);assert.deepEqual(backups.readNeonBackups().map(x=>x.content.id),[b.id]);backups.setBackupAccount('buyer-a',false);assert.deepEqual(backups.readNeonBackups().map(x=>x.content.id),[a.id]);localStorage.setItem('vitrine-neon-backup-v1:'+a.id,JSON.stringify({content:a}));backups.setBackupAccount('principal',true);assert.deepEqual(backups.readNeonBackups().map(x=>x.content.id),[a.id]);backups.setBackupAccount('buyer-b',false);assert.deepEqual(backups.readNeonBackups().map(x=>x.content.id),[b.id])
})
test('account caches are encrypted and cannot be decrypted with another account key',()=>{
 localStorage.clear();const bio=createBio(readyTemplates[0]);bio.client={notes:'PRIVATE CACHE FIXTURE'};backups.setBackupAccount('encrypted-a',false,'11'.repeat(32));backups.keepNeonBackup(bio);assert(!localStorage.getItem(localStorage.key(0)).includes('PRIVATE CACHE FIXTURE'));assert.equal(backups.readNeonBackups()[0].content.client.notes,'PRIVATE CACHE FIXTURE');backups.setBackupAccount('encrypted-a',false,'22'.repeat(32));assert.equal(backups.readNeonBackups().length,0)
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());globalThis.fetch=originalFetch;await vite.close();dom.window.close()})
