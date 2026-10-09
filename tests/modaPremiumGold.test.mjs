import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=typeof dom.window[k]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};globalThis.localStorage=dom.window.localStorage;globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-modaPremiumGold',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,templates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{ModelLibrary}=await vite.ssrLoadModule('/src/components/AdminCreation.tsx'),{VisualBioEditor}=await vite.ssrLoadModule('/src/components/VisualBioEditor.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts')
const root=createRoot(document.getElementById('root')),template=readyTemplates.find(t=>t.id==='moda-premium-gold'),original=JSON.stringify(template)
const render=async element=>React.act(async()=>root.render(element)),click=async e=>{assert(e);await React.act(async()=>e.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))}
test('ready template preserves original 21 and complete ordered structure',()=>{
 assert.equal(templates.length,21);assert.equal(readyTemplates.length,76);const bio=createBio(template);assert.equal(validateBio(JSON.parse(JSON.stringify(bio)),bio.id),'moda-premium-gold')
 assert.equal(bio.sections.length,14);assert.deepEqual(bio.sections.map(s=>s.kind),['actions','benefits','categories','promotion','products','benefits','gallery','about','promotion','hours','location','whatsapp','about','actions'])
 assert.equal(bio.sections[0].content.actions.length,4);assert.equal(bio.sections[2].content.highlights.length,3);assert.equal(bio.sections[4].content.items.length,4);assert.equal(bio.sections[6].content.photos.length,6);assert.equal(bio.sections[6].visual.columns,3)
})
test('select model in real library, use it and open existing editor',async()=>{
 let selected;await render(React.createElement(ModelLibrary,{categoryId:'fashion',onUse:t=>selected=createBio(t)}));await click(document.querySelector('[aria-label="Abrir modelo Moda Premium Gold"]'))
 await click([...document.querySelectorAll('button')].find(b=>b.textContent.includes('Usar este modelo')));assert.equal(selected.layoutPreset,'moda-premium-gold')
 await render(React.createElement(VisualBioEditor,{bio:selected,onChange(){},onAdvanced(){}}));assert(document.querySelector('.moda-premium-gold'));assert.equal(document.querySelectorAll('[data-item-id]').length,4)
})
test('all photos and actions resolve independent existing editor controls',async()=>{
 const bio=createBio(template);await render(React.createElement(BioSite,{bio}));assert.deepEqual(resolveEditorTarget(document.querySelector('.gold-hero-photo'),bio),{kind:'field',key:'cover'})
 assert.deepEqual(resolveEditorTarget(document.querySelector('.gold-logo'),bio),{kind:'field',key:'logo'});assert.deepEqual(resolveEditorTarget(document.querySelector('h1 small'),bio),{kind:'field',key:'name'})
 for(const img of document.querySelectorAll('[data-section-id] img')){const target=resolveEditorTarget(img,bio);assert(target,'image has contextual editor');assert.equal(target.part,'image')}
 for(const a of document.querySelectorAll('[data-action-id]'))assert.equal(resolveEditorTarget(a,bio).kind,'action')
 assert.equal(document.querySelectorAll('.gold-gallery-grid img').length,6);assert.equal(document.querySelectorAll('.gold-banner').length,2)
})
test('logo, hero, collection, text and WhatsApp edits survive validated JSON round trip without geometry changes or shared mutations',async()=>{
 const bio=createBio(template),other=createBio(template),geometry=b=>JSON.stringify({preset:b.layoutPreset,hero:b.heroVisual,text:b.textVisual,sections:b.sections.map(s=>({id:s.id,kind:s.kind,layout:s.layout,visual:s.visual,titleVisual:s.titleVisual}))}),before=geometry(bio)
 const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/p8AAAAASUVORK5CYII='
 bio.logo=image;bio.cover=image;bio.sections[2].content.highlights[0].image=image;bio.name='Minha Loja';bio.sections[7].text='Texto editado';bio.phone='5511987654321'
 validateBio(bio,bio.id);const reopened=JSON.parse(JSON.stringify(bio));validateBio(reopened,reopened.id);assert.equal(geometry(reopened),before);assert.equal(reopened.logo,image);assert.equal(reopened.cover,image);assert.equal(reopened.sections[2].content.highlights[0].image,image);assert.equal(reopened.sections[7].text,'Texto editado');assert.equal(reopened.phone,'5511987654321');assert.notEqual(other.cover,image);assert.equal(JSON.stringify(template),original)
 await render(React.createElement(BioSite,{bio:reopened}));assert(document.querySelector('[data-action-id="gold-wa"]').href.includes('5511987654321'));assert.equal(document.querySelectorAll('[data-section-id]').length,14)
})
test('actual contextual inputs edit logo, hero, collection, text and business WhatsApp',async()=>{
 let current=createBio(template),saved;const dimensions=JSON.stringify(current.sections.map(s=>s.visual)),hero=JSON.stringify(current.heroVisual)
 function Harness(){const [bio,setBio]=React.useState(current);return React.createElement(VisualBioEditor,{bio,onAdvanced(){},onChange:p=>setBio(old=>(current={...old,...p})),onSave:()=>saved=JSON.stringify(current)})}
 await render(React.createElement(Harness));const input=async(e,value)=>{assert(e);const proto=e.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;await React.act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(e,value);e.dispatchEvent(new window.Event('input',{bubbles:true}))})}
 await click(document.querySelector('header .gold-logo'));await input(document.querySelector('.studio-sheet input:not([type=file])'),'https://example.com/logo.png');assert.equal(current.logo,'https://example.com/logo.png')
 await click(document.querySelector('.gold-hero-photo'));await input(document.querySelector('.studio-sheet input:not([type=file])'),'https://example.com/hero.jpg');assert.equal(current.cover,'https://example.com/hero.jpg')
 await click(document.querySelector('[data-highlight-id] img'));await input(document.querySelector('.studio-sheet .image-field input:not([type=file])'),'https://example.com/collection.jpg');assert.equal(current.sections[2].content.highlights[0].image,'https://example.com/collection.jpg')
 await click(document.querySelector('h1[data-bio-field]'));await input(document.querySelector('.studio-sheet textarea'),'Minha Boutique');assert.equal(current.name,'Minha Boutique')
 await click(document.querySelector('[data-action-id="gold-wa"]'));await click([...document.querySelectorAll('.studio-context-tabs button')].find(b=>b.textContent==='Ação'));const contact=[...document.querySelectorAll('.studio-sheet label')].find(e=>e.textContent.startsWith('Contato do negócio'))?.querySelector('input');await input(contact,'5511988887777');assert.equal(current.phone,'5511988887777')
 await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert.equal(JSON.parse(saved).phone,'5511988887777');validateBio(JSON.parse(saved));assert.equal(JSON.stringify(current.heroVisual),hero);assert.equal(JSON.stringify(current.sections.map(s=>s.visual)),dimensions)
})
test('Admin uses existing API create/save/get flow and reopens the same model and permanent slug',async()=>{
 const {default:App}=await vite.ssrLoadModule('/src/App.tsx'),oldFetch=globalThis.fetch,records=new Map(),calls=[]
 globalThis.fetch=async(path,options={})=>{calls.push({path,method:options.method||'GET',credentials:options.credentials});const payload=options.body?JSON.parse(options.body):null
  if(path==='/api/biosites'&&!payload)return Response.json({items:[...records.values()].map(r=>({...r,name:r.content.name,style:r.content.style,category:r.content.category,layoutPreset:r.content.layoutPreset})),nextCursor:null})
  if(payload){const templateId=validateBio(payload.content),previous=records.get(payload.content.id),record={id:payload.content.id,slug:previous?.slug||'moda-premium-teste',status:'unpublished',lockVersion:String(Number(previous?.lockVersion||0)+1),draftRevision:'1',publishedRevision:null,createdAt:'2026-10-06T00:00:00Z',updatedAt:'2026-10-06T00:00:00Z',publishedAt:null,templateId,content:JSON.parse(JSON.stringify(payload.content))};records.set(record.id,record);return Response.json(record)}
  return Response.json(records.get(path.split('/').at(-1)))
 }
 try{await render(React.createElement(App));await click([...document.querySelectorAll('.studio-nav button')].find(b=>b.textContent.includes('Modelos Prontos'))||[...document.querySelectorAll('button')].find(b=>b.textContent==='Modelos Prontos'))
  await click(document.querySelector('[aria-label="Abrir modelo Moda Premium Gold"]'));await click([...document.querySelectorAll('button')].find(b=>b.textContent.includes('Usar este modelo')));assert(document.querySelector('.studio-builder'));assert.equal(records.size,1);const record=[...records.values()][0];assert.equal(record.templateId,'moda-premium-gold')
  await click(document.querySelector('h1[data-bio-field="name"]'));const field=document.querySelector('.studio-sheet textarea');await React.act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(field,'Boutique de Teste');field.dispatchEvent(new window.Event('input',{bubbles:true}))});await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert.equal(records.get(record.id).content.name,'Boutique de Teste')
  await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent.includes('Voltar')));await click([...document.querySelectorAll('.studio-card-actions button')].find(b=>b.textContent==='Editar'));assert(document.querySelector('.moda-premium-gold'));assert.equal(records.get(record.id).slug,record.slug);assert.equal(records.get(record.id).content.layoutPreset,'moda-premium-gold');assert(calls.some(c=>c.method==='POST'));assert(calls.some(c=>c.method==='PUT'));assert(calls.some(c=>c.path==='/api/biosites/'+record.id&&c.method==='GET'));assert(calls.every(c=>c.credentials==='same-origin'))
 }finally{globalThis.fetch=oldFetch;await render(null)}
})
test('shared visual targets open nonempty panels and focus exact text, image, action, hours and address controls',async()=>{
 for(const seed of [createBio(template),createBio(templates[0])]){
  let current=seed
  function Harness(){const [bio,setBio]=React.useState(seed);return React.createElement(VisualBioEditor,{bio,onAdvanced(){},onChange:p=>setBio(old=>(current={...old,...p}))})}
  await render(React.createElement(Harness))
  const checks=[['[data-item-id] [data-editable-text="price"]','price'],['[data-item-id] [data-editable-text="title"]','title'],['[data-item-id] img','image'],['[data-section-id] [data-editor-field="hours"]','hours'],['[data-section-id] [data-editor-field="address"]','address']]
  for(const [selector,field] of checks){await click(document.querySelector(selector));assert(document.querySelector('.studio-sheet-fields textarea,.studio-sheet-fields input'),selector+' has controls');assert.equal(document.activeElement.dataset.editorControl,field,selector+' focuses exact property')}
  for(const selector of ['[data-action-id] [data-editable-text="label"]','[data-action-id] [data-editor-field="icon"]','[data-highlight-id] img','[data-photo-index] img','[data-benefit-index] [data-editable-text="title"]','[data-benefit-index] [data-editor-field="icon"]']){
   await click(document.querySelector(selector));assert(document.querySelector('.studio-sheet-fields textarea,.studio-sheet-fields input,.studio-sheet-fields select'),selector+' has editable controls')
  }
  if(current.layoutPreset){await click(document.querySelector('.gold-product-contact'));assert(document.querySelector('.studio-sheet [data-editor-control="link"]'));assert(document.querySelector('.gold-product-list'))}
  assert.equal(validateBio(JSON.parse(JSON.stringify(current))),seed.layoutPreset||templates[0].id)
 }
})
test('shared per-section and collection actions and benefit icons retain JSON compatibility and stable entry identity',async()=>{
 const {entryTextKey}=await vite.ssrLoadModule('/src/lib/entryText.ts'),bio=createBio(template),benefits=bio.sections.find(s=>s.id==='gold-benefits'),key=entryTextKey('benefits',benefits.content.benefits[0])
 benefits.entryIcons={[key]:{id:key,kind:'custom',label:'Envio',message:'',icon:'delivery',visual:{iconColor:'#a87930'}}}
 bio.sections.find(s=>s.id==='gold-news').action={id:'banner-action',kind:'custom',label:'Novidades',message:'',mode:'url',source:'custom',url:'https://example.com/news'}
 bio.sections.find(s=>s.id==='gold-collections').content.highlights[0].action={id:'collection-action',kind:'custom',label:'Coleção',message:'',destination:'section',sectionId:'gold-products'}
 const reopened=JSON.parse(JSON.stringify(bio));assert.equal(validateBio(reopened),'moda-premium-gold');await render(React.createElement(BioSite,{bio:reopened}));assert.equal(document.querySelector('.gold-banner-button').href,'https://example.com/news');assert(document.querySelector('[data-highlight-id="gold-dresses"]').href.includes('gold-products'));assert(document.querySelector('[data-section-id="gold-benefits"] [data-generic-icon="delivery"]'))
})
test('cleanup',async()=>{await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
