import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const k of ['window','document','HTMLElement','Element','Node','Event','CustomEvent','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[k]=['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(k)?dom.window[k].bind(dom.window):dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;window.scrollTo=()=>{};globalThis.localStorage=dom.window.localStorage;globalThis.matchMedia=()=>({matches:false});globalThis.innerHeight=844
const React=await import('react'),{createRoot}=await import('react-dom/client'),vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-final-audit',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{VisualBioEditor}=await vite.ssrLoadModule('/src/components/VisualBioEditor.tsx'),{resolveEditorTarget}=await vite.ssrLoadModule('/src/lib/editorTargets.ts'),{duplicateDraft}=await vite.ssrLoadModule('/src/lib/adminDrafts.ts'),{keepNeonBackup,readNeonBackups}=await vite.ssrLoadModule('/src/lib/neonBackups.ts')
const root=createRoot(document.getElementById('root')),render=async el=>React.act(async()=>root.render(el)),click=async el=>{assert(el);await React.act(async()=>el.dispatchEvent(new window.MouseEvent('click',{bubbles:true,cancelable:true})))},input=async(el,value)=>{assert(el);const proto=el.tagName==='TEXTAREA'?window.HTMLTextAreaElement.prototype:window.HTMLInputElement.prototype;await React.act(async()=>{Object.getOwnPropertyDescriptor(proto,'value').set.call(el,value);el.dispatchEvent(new window.Event('input',{bubbles:true}))})}
const report=[],components=new Set(),exercised=new Set()
for(const model of readyTemplates)test(model.id+' — owners, direct shared controls, JSON reopening and duplication',async()=>{
 const original=JSON.stringify(model);let current=createBio(model),saved
 const geometry=b=>JSON.stringify([b.layoutPreset,b.heroVisual,b.sections.map(s=>[s.id,s.kind,s.layout,s.visual,s.titleVisual])]),initial=geometry(current)
 await render(React.createElement(BioSite,{bio:current}));let owners=0
 for(const node of document.querySelectorAll('.biosite img,.biosite h1,.biosite h2,.biosite h3,.biosite p,.biosite strong,.biosite small,.biosite a,[data-editor-field],[data-editable-text]')){
  if(!node.textContent.trim()&&!['IMG','A'].includes(node.tagName))continue
  const target=resolveEditorTarget(node,current);assert(target,model.id+' owner missing: '+node.outerHTML);owners++
  const kind=current.sections.find(s=>s.id===target.sectionId||s.id===target.id)?.kind||'',signature=[target.kind,kind,target.collection||target.key||'',target.part||'',target.field||''].join(':');components.add(signature)
 }
 function Harness(){const[bio,setBio]=React.useState(current);return React.createElement(VisualBioEditor,{bio,onAdvanced(){},onChange:p=>setBio(old=>(current={...old,...p})),onSave(){keepNeonBackup(current);saved=JSON.stringify(current)}})}
 await render(React.createElement(Harness,{key:model.id}))
 const headline=document.querySelector('.gold-hero-headline')||document.querySelector('[data-bio-field=name]');assert(headline);await click(headline);await input(document.querySelector('.studio-sheet textarea,.studio-sheet input:not([type=checkbox]):not([type=color])'),'Auditoria local — '+model.id)
 await click(document.querySelector('.gold-hero-photo'));assert(document.querySelector('.studio-sheet .image-field'));assert([...document.querySelectorAll('.studio-sheet button')].some(b=>b.textContent.includes('Recortar/reposicionar')))
 await click(document.querySelector('header .gold-logo'));assert(document.querySelector('.studio-sheet .image-field'))
 const price=document.querySelector('.gold-product strong');if(price){await click(price);await input(document.querySelector('[data-editor-control=price]'),'R$ 321,00')}
 const action=document.querySelector('.gold-hero-button')||document.querySelector('[data-action-id]');await click(action);await click([...document.querySelectorAll('.studio-context-tabs button')].find(b=>b.textContent==='Conteúdo'));assert(document.querySelector('.studio-sheet [data-editor-control=label]'));await input(document.querySelector('.studio-sheet [data-editor-control=label]'),'Ação auditada');await click([...document.querySelectorAll('.studio-context-tabs button')].find(b=>b.textContent==='Ação'));assert(document.querySelector('.studio-sheet input,.studio-sheet .studio-internal-sections'))
 // Exercise every distinct component/field family actually present, once across the catalogue.
 for(const node of [...document.querySelectorAll('.biosite img,.biosite h2,.biosite h3,.biosite p,.biosite strong,.biosite small,.biosite a,[data-editor-field],[data-editable-text]')]){
  if(!node.textContent.trim()&&!['IMG','A'].includes(node.tagName))continue
  const target=resolveEditorTarget(node,current);if(!target)continue
  const kind=current.sections.find(s=>s.id===target.sectionId||s.id===target.id)?.kind||'',signature=[target.kind,kind,target.collection||target.key||'',target.part||'',target.field||''].join(':')
  if(exercised.has(signature))continue;await click(node);assert(document.querySelector('.studio-sheet input,.studio-sheet textarea,.studio-sheet select,.studio-sheet-fields button'),model.id+' empty control: '+signature);exercised.add(signature)
 }
 await click([...document.querySelectorAll('.studio-visual-toolbar button')].find(b=>b.textContent==='Salvar'));assert(saved)
 const reopened=readNeonBackups().find(b=>b.content.id===current.id).content;assert.deepEqual(reopened,JSON.parse(saved));assert.equal(validateBio(reopened,reopened.id),model.id);assert.equal(geometry(reopened),initial);assert.equal(JSON.stringify(model),original)
 const duplicate=duplicateDraft(reopened);assert.notEqual(duplicate.id,reopened.id);assert.equal(duplicate.layoutPreset,reopened.layoutPreset);duplicate.sections[0].title='Só a cópia';assert.notEqual(duplicate.sections[0].title,reopened.sections[0].title)
 await render(React.createElement(BioSite,{bio:reopened}));assert.match(document.body.textContent,/Auditoria local/)
 report.push({id:model.id,label:model.label,owners,directControls:true,localSaveReopened:true,layoutPreserved:true,duplicateIndependent:true,remoteWriteVerified:false})
})
test.after(async()=>{await fs.mkdir('artifacts/functional-audit',{recursive:true});await fs.writeFile('artifacts/functional-audit/editor-76.json',JSON.stringify({models:report,totalExpected:76,componentFamilies:[...components],controlsExercised:[...exercised],remoteWrites:false},null,2));await React.act(async()=>root.unmount());await vite.close();dom.window.close()})

