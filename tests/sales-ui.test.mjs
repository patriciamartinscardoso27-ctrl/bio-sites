import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','localStorage'])globalThis[k]=dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{}
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-sales',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {SaleDialog,SalesPanel}=await vite.ssrLoadModule('/src/components/SalesPanel.tsx'),{default:App}=await vite.ssrLoadModule('/src/App.tsx'),{readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{summarize}=await vite.ssrLoadModule('/src/lib/biositesApi.ts')
const root=createRoot(document.getElementById('root')),originalFetch=globalThis.fetch
const render=element=>React.act(async()=>root.render(element)),click=element=>React.act(async()=>{assert(element);element.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,10))}),input=async(element,value)=>React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}))})
const account={id:'buyer',name:'Buyer',email:'buyer@example.invalid',role:'buyer',multiuser:true},site={id:'site',name:'Cliente local'}
const fixture={id:'sale',biositeId:site.id,ownerId:'buyer',ownerName:'Buyer',clientName:site.name,biositeName:site.name,amountCents:35000,soldOn:'2026-10-09',paymentMethod:'pix',paymentStatus:'pending',notes:'',lockVersion:'1'}
test('form registers only on confirmation, parses cents and reopens existing sale for editing',async()=>{
 let existing=null,saved,posts=0,puts=0
 globalThis.fetch=async(path,options)=>{if(String(path).includes('by-biosite'))return Response.json({sale:existing});const fields=JSON.parse(options.body);if(options.method==='POST'){posts++;assert.equal(fields.amountCents,35050);existing={...fixture,...fields}}else{puts++;assert.equal(fields.lockVersion,'1');existing={...existing,...fields,lockVersion:'2'}}return Response.json(existing)}
 await render(React.createElement(SaleDialog,{site,onClose:()=>{},onSaved:s=>saved=s}));assert.equal(posts,0)
 await input(document.querySelector('input[inputmode="decimal"]'),'350,50')
 await React.act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
 assert.equal(posts,1);assert.equal(saved.amountCents,35050)
 await render(React.createElement(SaleDialog,{key:'reopened',site,onClose:()=>{},onSaved:s=>saved=s}))
 assert.equal(document.querySelector('input[inputmode="decimal"]').value,'350,50');assert(document.body.textContent.includes('Editar venda'))
 await input(document.querySelector('input[inputmode="decimal"]'),'400,00');await React.act(async()=>document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})))
 assert.equal(posts,1);assert.equal(puts,1);assert.equal(saved.amountCents,40000)
})
test('financial panel uses filtered API totals and buyer has no all-user selector; paid action is explicit',async()=>{
 let paid=0,filters=[]
 globalThis.fetch=async(path,options)=>{if(options?.method==='PUT'){paid++;assert.equal(JSON.parse(options.body).paymentStatus,'paid');return Response.json({...fixture,paymentStatus:'paid'})}filters.push(String(path));return Response.json({items:[fixture],nextCursor:null,totals:{count:1,totalCents:35000,receivedCents:0,pendingCents:35000,todayCount:1,todayCents:35000,monthCount:1,monthCents:35000},chart:[{month:'2026-10',amountCents:35000}]})}
 await render(React.createElement(SalesPanel,{account,onOpenSale:()=>{}}));assert.equal(paid,0);assert(!document.querySelector('option[value="buyer"]'))
 assert(document.body.textContent.includes('Total recebido'));assert(document.querySelector('[role="img"]').getAttribute('aria-label').includes('350'))
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Hoje'));assert(filters.at(-1).includes('from='));assert(filters.at(-1).includes('to='))
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Marcar paga'));assert.equal(paid,1)
})
test('publishing offers optional sale; dismiss does not register; existing sale suppresses republish prompt',async()=>{
 const content=createBio(readyTemplates.find(x=>x.id==='moda-premium-gold')),saved={id:content.id,slug:'local-fixture',status:'unpublished',lockVersion:'1',draftRevision:'1',publishedRevision:null,createdAt:'2026-10-09',updatedAt:'2026-10-09',publishedAt:null,templateId:'moda-premium-gold',content}
 let publications=0,registrations=0,hasSale=false
 globalThis.fetch=async(path,options)=>{
  if(path==='/api/publication/config')return Response.json({origin:'https://example.invalid',writesEnabled:true})
  if(path==='/api/biosites')return Response.json({items:[summarize(saved)],nextCursor:null})
  if(String(path).endsWith('/publish')){publications++;saved.status='published';saved.publishedRevision='1';return Response.json(saved)}
  if(path==='/api/biosites/'+saved.id)return Response.json(saved)
  if(String(path).includes('/api/sales/by-biosite/'))return Response.json({sale:hasSale?fixture:null})
  if(path==='/api/sales'&&options?.method==='POST'){registrations++;return Response.json(fixture)}
  return Response.json({items:[]})
 }
 await render(React.createElement(App,{account}));await click([...document.querySelectorAll('.studio-card-actions button')].find(x=>x.textContent==='Gerenciar'))
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Publicar BioSite'))
 assert.equal(publications,1);assert.equal(registrations,0);assert(document.body.textContent.includes('Deseja registrar esta venda?'))
 await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Agora não'));assert.equal(registrations,0);assert.equal(document.querySelector('.sales-prompt'),null)
 hasSale=true;await click([...document.querySelectorAll('button')].find(x=>x.textContent==='Atualizar publicação'))
 assert.equal(publications,2);assert.equal(registrations,0);assert.equal(document.querySelector('.sales-prompt'),null)
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());globalThis.fetch=originalFetch;await vite.close();dom.window.close()})
