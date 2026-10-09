import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import '../server/validation.mjs'
const {defaultReferenceSpec}=await import('../src/lib/referenceDesign.ts')
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const key of ['window','document','Event','CustomEvent','HTMLElement','Element','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key)?dom.window[key].bind(dom.window):dom.window[key]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844;globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.localStorage=dom.window.localStorage;window.scrollTo=()=>{}
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,server:{middlewareMode:true},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {AdminCreation}=await vite.ssrLoadModule('/src/components/AdminCreation.tsx')
const root=createRoot(document.getElementById('root')),requests=[],originalFetch=globalThis.fetch
const description='Barbearia premium preta e dourada, quatro botões grandes, seis serviços em três colunas e Como chegar.'
globalThis.fetch=async(path,options)=>{requests.push({path,body:options?.body?JSON.parse(options.body):null,credentials:options?.credentials});return Response.json(path.endsWith('status')?{configured:true}:{spec:{...defaultReferenceSpec,actionTypes:['whatsapp','instagram','booking','location'],actionSize:64,serviceCount:6,serviceLayout:'three',productCount:0,sections:['actions','services','location'],sectionOrder:['actions','services','location']}})}
const button=text=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent.trim()===text)
const click=async node=>{assert(node);await React.act(async()=>node.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))}
const change=async(node,value)=>{await React.act(async()=>{const setter=Object.getOwnPropertyDescriptor(node.tagName==='SELECT'?window.HTMLSelectElement.prototype:node.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype,'value').set;setter.call(node,value);node.dispatchEvent(new window.Event(node.tagName==='SELECT'?'change':'input',{bubbles:true}))})}

test('Admin -> Criar com IA -> private description request -> editable generated design',async()=>{
 await React.act(async()=>root.render(React.createElement(AdminCreation,{onCreate:async()=>true,busy:false})))
 await click(Array.from(document.querySelectorAll('.studio-creation-modes button')).find(b=>b.textContent.includes('Criar com IA')))
 assert(document.querySelector('.studio-ai-description'));assert(document.querySelector('input[multiple]'));assert(button('✨ Gerar BioSite').disabled)
 await change(document.querySelector('.studio-reference-preferences select'),'barber');await change(document.querySelector('.studio-ai-description'),description);assert(!button('✨ Gerar BioSite').disabled)
 await click(button('✨ Gerar BioSite'));assert.equal(requests.at(-1).path,'/api/reference/analyze');assert.equal(requests.at(-1).credentials,'same-origin');assert.deepEqual(requests.at(-1).body,{creationMode:'creative',description,categoryId:'barber'})
 assert.equal(document.querySelectorAll('[data-item-id]').length,6);assert.equal(document.querySelectorAll('[data-action-id]').length,4)
 await click(button('🎨 Personalizar este'));assert(document.querySelector('.studio-builder'));assert.equal(document.querySelector('.studio-visual-toolbar button[title]').textContent,'Publicar');assert(document.querySelector('.studio-visual-toolbar button[title]').disabled)
 await click(document.querySelector('[data-section-id="section-services"] h2'));assert.equal(document.querySelectorAll('.studio-context-tabs button').length,4)
 await click(button('Aparência'));const number=Array.from(document.querySelectorAll('.studio-sheet label')).find(l=>l.textContent.includes('Espaçamento lateral')).querySelector('input');await change(number,'14');assert.equal(document.querySelector('[data-section-id="section-services"]').style.paddingInline,'14px')
 assert(document.querySelector('[aria-label="Desfazer edição"]')&&!document.querySelector('[aria-label="Desfazer edição"]').disabled);await click(document.querySelector('[aria-label="Desfazer edição"]'));assert.equal(document.querySelector('[data-section-id="section-services"]').style.paddingInline,'')
})

test('reference crop confirms locally, supports replacing/reordering, and cancel leaves references intact',async()=>{
 const {ReferenceCreation}=await vite.ssrLoadModule('/src/components/ReferenceCreation.tsx');const imageClass=globalThis.Image,originalCreate=URL.createObjectURL,originalRevoke=URL.revokeObjectURL;
 globalThis.Image=class{naturalWidth=1200;naturalHeight=800;set src(value){queueMicrotask(()=>this.onload?.())}};URL.createObjectURL=()=> 'data:image/png;base64,iVBORw0KGgo=';URL.revokeObjectURL=()=>{};
 for(const [key,value] of Object.entries({naturalWidth:1200,naturalHeight:800,width:1200,height:800,complete:true}))Object.defineProperty(dom.window.HTMLImageElement.prototype,key,{configurable:true,get:()=>value});
 const originalRect=dom.window.HTMLElement.prototype.getBoundingClientRect;dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return {x:0,y:0,left:0,top:0,right:600,bottom:400,width:600,height:400,toJSON(){}}};
 dom.window.HTMLCanvasElement.prototype.getContext=()=>({getImageData(){return {data:new Uint8ClampedArray([212,175,55,255,0,0,0,255])}},fillRect(){},drawImage(){},clearRect(){},save(){},restore(){},translate(){},rotate(){},scale(){},setTransform(){}});dom.window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/jpeg;base64,YWJjZA==';
 const upload=async(selector,names)=>{const input=document.querySelector(selector);assert(input);Object.defineProperty(input,'files',{value:names.map(name=>new window.File(['demo'],name,{type:'image/png'})),configurable:true});await React.act(async()=>{input.dispatchEvent(new window.Event('change',{bubbles:true}));await new Promise(r=>setTimeout(r,150))})};
 const confirm=async()=>{for(let attempt=0;attempt<20&&(!button('Confirmar recorte')||button('Confirmar recorte').disabled);attempt++)await React.act(async()=>new Promise(r=>setTimeout(r,100)));assert(button('Confirmar recorte')&&!button('Confirmar recorte').disabled,'crop preview must be ready');await click(button('Confirmar recorte'))};
 try{await React.act(async()=>root.render(React.createElement(ReferenceCreation,{onBack(){},onCreate:async()=>true,busy:false})));const before=requests.length;await upload('input[multiple]',['one.png','two.png']);assert(document.querySelector('[role=dialog]'));assert.equal(requests.length,before);assert.equal(document.querySelectorAll('.studio-ai-references figure').length,0);await confirm();await confirm();assert.equal(document.querySelectorAll('.studio-ai-references figure').length,2);
 await click(document.querySelector('[aria-label="Descer referência 1"]'));await upload('[aria-label="Substituir referência 1"]',['replacement.png']);await click(button('Cancelar'));assert.equal(document.querySelectorAll('.studio-ai-references figure').length,2);await upload('[aria-label="Substituir referência 1"]',['replacement.png']);await confirm();assert.equal(document.querySelectorAll('.studio-ai-references figure').length,2);await click(document.querySelector('[aria-label="Remover referência 2"]'));assert.equal(document.querySelectorAll('.studio-ai-references figure').length,1);assert.equal(requests.length,before);
 }finally{dom.window.HTMLElement.prototype.getBoundingClientRect=originalRect;globalThis.Image=imageClass;URL.createObjectURL=originalCreate;URL.revokeObjectURL=originalRevoke}
})

test('cleanup',async()=>{globalThis.fetch=originalFetch;await React.act(async()=>root.unmount());await vite.close();dom.window.close()})
