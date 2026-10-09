import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const {createBio,templates}=await import('../src/data/templates.ts')
const {actionSubtitle}=await import('../src/lib/actionText.ts')
const {resolvePalette}=await import('../src/lib/identityPalette.ts')
const React=await import('react'),{renderToString}=await import('react-dom/server')
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx')
const {QuickActions}=await vite.ssrLoadModule('/src/components/QuickActions.tsx')
const {ContextualActionEditor}=await vite.ssrLoadModule('/src/components/ContextualActionEditor.tsx')

test('legacy subtitle remains compatible, but explicit empty never restores defaults',()=>{
 assert.equal(actionSubtitle({kind:'instagram'}),'Nos siga');assert.equal(actionSubtitle({kind:'instagram',subtitle:''}),'')
})
test('all 21 models hide section and card text without mutating content; JSONB and palette bindings survive reload',()=>{
 for(const template of templates){
  const bio=createBio(template),s=bio.sections.find(s=>s.kind==='about');s.enabled=true;s.title='Unique section title';s.text='Unique section description';s.textOptions={title:{hidden:true},text:{hidden:true}};
  const products=bio.sections.find(s=>s.kind==='products'||s.kind==='services');products.enabled=true;
  const item=(products.kind==='products'?bio.products:bio.services)[0];item.title='Unique card title';item.description='Unique card description';item.textOptions={description:{hidden:true},title:{visual:{text:'#123456',fontSize:18,weight:'bold',align:'right',colorBindings:{text:'primary'}}}};
  bio.actions[0].subtitle='Unique action subtitle';bio.actions[0].description='Unique action description';bio.actions[0].textOptions={subtitle:{hidden:true},description:{hidden:true}};
  const snapshot=JSON.stringify(bio),reopened=JSON.parse(snapshot);validateBio(reopened);
  const dom=new JSDOM(renderToString(React.createElement(BioSite,{bio:reopened}))),root=dom.window.document;
  assert(!root.querySelector(`[data-section-id="${s.id}"] [data-editable-text="title"]`));assert(!root.body.textContent.includes('Unique section description'));assert(!root.body.textContent.includes('Unique card description'));assert(!root.body.textContent.includes('Unique action subtitle'));assert(!root.body.textContent.includes('Unique action description'));
  assert.equal(resolvePalette(reopened).products[0]?.textOptions?.title?.visual?.text,products.kind==='products'?bio.color:undefined);
  assert.equal(JSON.stringify(bio),snapshot);dom.window.close();
  s.textOptions.text.hidden=false;const shown=renderToString(React.createElement(BioSite,{bio}));assert(shown.includes('Unique section description'));
 }
})
test('optional ActionGrid fields leave no empty text elements and independent style is rendered',()=>{
 const bio=createBio(templates[0]);bio.actions=[{...bio.actions[0],label:'Instagram',subtitle:'',description:'',textOptions:{label:{visual:{text:'#abcdef',fontSize:17,weight:'regular',align:'right'}}}}];
 let dom=new JSDOM(renderToString(React.createElement(QuickActions,{bio})));assert.equal(dom.window.document.querySelectorAll('small').length,0);const title=dom.window.document.querySelector('strong');assert.equal(title.style.fontSize,'17px');assert.equal(title.style.fontWeight,'400');assert.equal(title.style.textAlign,'right');dom.window.close();bio.actions[0].textOptions.label.hidden=true;dom=new JSDOM(renderToString(React.createElement(QuickActions,{bio})));assert.equal(dom.window.document.querySelector('.action-tile-label').children.length,0);assert(dom.window.document.querySelector('.action-icon-slot'));dom.window.close()
})
test('contextual action controls edit, hide and restore optional text immediately',async()=>{
 const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true});for(const key of ['window','document','HTMLElement','Element','Node','Event'])globalThis[key]=dom.window[key];Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true;
 const {createRoot}=await import('react-dom/client'),bio=createBio(templates[0]);let action={...bio.actions[0],subtitle:'Original subtitle',description:'Original description'},changes=0;const root=createRoot(document.getElementById('root'));
 const render=()=>root.render(React.createElement(React.Fragment,null,React.createElement(ContextualActionEditor,{bio,action,onChange:p=>{action={...action,...p};changes++;render()},onBioChange:()=>{},onDuplicate:()=>{},onRemove:()=>{},onSection:()=>{}}),React.createElement(QuickActions,{bio:{...bio,actions:[action]}})));
 try{await React.act(render);assert.equal(document.querySelectorAll('textarea').length,3);const checkbox=[...document.querySelectorAll('label')].find(l=>l.textContent==='Mostrar subtítulo').querySelector('input');await React.act(()=>checkbox.click());assert.equal(action.subtitle,'Original subtitle');assert.equal(action.textOptions.subtitle.hidden,true);assert(!document.querySelector('[data-editable-text="subtitle"]'));await React.act(()=>checkbox.click());assert(document.querySelector('[data-editable-text="subtitle"]'));const input=document.querySelectorAll('textarea')[1];await React.act(()=>{Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(input,'');input.dispatchEvent(new window.Event('input',{bubbles:true}))});assert.equal(action.subtitle,'');assert(!document.querySelector('[data-editable-text="subtitle"]'));assert.equal(changes,3);validateBio(JSON.parse(JSON.stringify({...bio,actions:[action]})))}finally{await React.act(()=>root.unmount());dom.window.close()}
})
test.after(async()=>vite.close())
test('testimonial, benefit and collection captions use shared controls and retain their options after reorder/reload',()=>{
 const bio=createBio(templates[0]),reviews=bio.sections.find(s=>s.kind==='testimonials'),benefits=bio.sections.find(s=>s.kind==='benefits'),categories=bio.sections.find(s=>s.kind==='categories');
 reviews.enabled=true;reviews.text='Person A|Unique review text';benefits.enabled=true;bio.benefits=['Benefit A|Unique benefit text','Benefit B|Other benefit'];categories.enabled=true;bio.highlights[0].caption='Unique caption';bio.highlights[0].textOptions={caption:{hidden:true}};
 const key=(collection,value)=>{let a=2166136261,b=5381;for(let i=0;i<value.length;i++){a=Math.imul(a^value.charCodeAt(i),16777619);b=Math.imul(b,33)^value.charCodeAt(i)}return collection+'-'+(a>>>0).toString(16)+'-'+(b>>>0).toString(16)};
 reviews.entryTextOptions={[key('reviews',reviews.text)]:{description:{hidden:true}}};benefits.entryTextOptions={[key('benefits',bio.benefits[0])]:{description:{hidden:true}}};
 const original=structuredClone(bio);bio.benefits.reverse();const reopened=JSON.parse(JSON.stringify(bio));validateBio(reopened);const output=renderToString(React.createElement(BioSite,{bio:reopened}));assert(!output.includes('Unique review text'));assert(!output.includes('Unique benefit text'));assert(!output.includes('Unique caption'));assert(output.includes('Other benefit'));assert.equal(original.benefits[0],'Benefit A|Unique benefit text');
})
