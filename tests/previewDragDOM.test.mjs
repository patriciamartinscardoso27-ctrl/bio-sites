import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import '../server/validation.mjs'
const dom=new JSDOM('<div id="root"></div>',{pretendToBeVisual:true,url:'http://localhost'})
for(const key of ['window','document','Event','CustomEvent','HTMLElement','Element','Node','getComputedStyle','requestAnimationFrame','cancelAnimationFrame'])globalThis[key]=typeof dom.window[key]==='function'&&['getComputedStyle','requestAnimationFrame','cancelAnimationFrame'].includes(key)?dom.window[key].bind(dom.window):dom.window[key]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true})
globalThis.matchMedia=()=>({matches:false})
globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{createRoot}=await import('react-dom/client'),{usePreviewDrag}=await import('../src/components/usePreviewDrag.ts')
const {createBio,templates}=await import('../src/data/templates.ts')
const Sortable=(await import('sortablejs')).default;Sortable.supportPointer=false
const pause=ms=>new Promise(r=>setTimeout(r,ms))
let root=createRoot(document.getElementById('root'))
let current,commits=0,history=[]
function Harness(){const [bio,setBio]=React.useState(()=>{const b=createBio(templates[0]);b.sections=b.sections.filter(s=>s.kind==='actions');return b}),ref=React.useRef(null);React.useLayoutEffect(()=>{current=bio},[bio]);usePreviewDrag(ref,bio,patch=>{commits++;history.push(bio);setBio({...bio,...patch})});return React.createElement('div',{ref},React.createElement('div',{},bio.sections.map(s=>React.createElement('section',{'data-section-id':s.id,key:s.id},React.createElement('div',{id:'actions'},bio.actions.map(a=>React.createElement('a',{'data-action-id':a.id,key:a.id},a.label)))))))}
await React.act(async()=>root.render(React.createElement(Harness)))
test('real Sortable React bridge commits once, restores DOM before React, supports keyboard and focus',async()=>{
 const before=structuredClone(current),handle=document.querySelector('.studio-drag-handle');await React.act(async()=>handle.dispatchEvent(new window.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true})))
 assert.equal(commits,1);assert.equal(current.actions[1].id,before.actions[0].id);assert.deepEqual(current.actions[1],before.actions[0]);assert.equal(document.activeElement.parentElement.dataset.actionId,before.actions[0].id);assert.equal(history.length,1)
 const parent=document.getElementById('actions'),sortable=Sortable.get(parent),nodes=Array.from(parent.children),source=nodes[0],next=source.nextSibling
 await React.act(async()=>{sortable.option('onStart')({item:source});parent.append(source);sortable.option('onEnd')({item:source,oldDraggableIndex:0,newDraggableIndex:nodes.length-1});await pause(30)})
 assert.equal(commits,2);assert.equal(current.actions.at(-1).id,nodes[0].dataset.actionId);assert.equal(parent.children[0].dataset.actionId,next.dataset.actionId);assert.deepEqual(Array.from(parent.children).map(n=>n.dataset.actionId),current.actions.map(a=>a.id));assert.equal(document.querySelectorAll('.studio-drag-floating').length,0)
})
test('mobile touch requires a handle, cancels early scrolling and rejects transfer to incompatible groups',async()=>{
 const sortable=Sortable.get(document.getElementById('actions'));assert.equal(sortable.option('delay'),180);assert.equal(sortable.option('delayOnTouchOnly'),true);assert(sortable.option('touchStartThreshold')>=1&&sortable.option('touchStartThreshold')<=5);assert.equal(sortable.option('group').checkPull(sortable,sortable),false);assert.equal(sortable.option('group').checkPut(sortable,sortable),false)
 const count=commits,target=document.querySelector('[data-action-id]'),handle=target.querySelector('.studio-drag-handle')
 const touch=(type,element,y)=>{const event=new window.Event(type,{bubbles:true,cancelable:true});const point={target:element,identifier:1,clientX:10,clientY:y,pageX:10,pageY:y};Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[point]});Object.defineProperty(event,'changedTouches',{value:[point]});element.dispatchEvent(event)}
 await React.act(async()=>{touch('touchstart',target,10);touch('touchmove',target,60);touch('touchend',target,60);await pause(220)})
 assert.equal(commits,count);assert.equal(document.querySelector('.studio-drag-active'),null)
 await React.act(async()=>{touch('touchstart',handle,10);touch('touchmove',handle,60);touch('touchend',handle,60);await pause(220)})
 assert.equal(commits,count);assert.equal(document.querySelector('.studio-drag-active'),null);assert.equal(document.querySelector('.studio-drag-floating'),null)
})
test('held touch activates drag and commits only on release through real touch events',async()=>{
 const parent=document.getElementById('actions'),nodes=Array.from(parent.children),source=nodes[0],target=nodes.at(-1),handle=source.querySelector('.studio-drag-handle'),count=commits,first=current.actions[0].id
 const rect=(y,height=60)=>({x:0,y,top:y,left:0,right:240,bottom:y+height,width:240,height,toJSON(){return this}})
 parent.getBoundingClientRect=()=>rect(0,240);nodes.forEach(n=>{n.getBoundingClientRect=()=>rect(Array.from(parent.children).indexOf(n)*60);n.querySelector('.studio-drag-handle').getBoundingClientRect=n.getBoundingClientRect})
 document.elementFromPoint=()=>target
 const touch=(type,y)=>{const event=new window.Event(type,{bubbles:true,cancelable:true}),point={target:handle,identifier:7,clientX:20,clientY:y,pageX:20,pageY:y};Object.defineProperty(event,'touches',{value:type==='touchend'?[]:[point]});Object.defineProperty(event,'changedTouches',{value:[point]});handle.dispatchEvent(event)}
 await React.act(async()=>{touch('touchstart',30);await pause(220);touch('touchmove',40);await pause(40);touch('touchmove',220);await pause(130);assert.equal(commits,count);touch('touchend',220);await pause(40)})
 assert.equal(commits,count+1);assert.equal(current.actions.at(-1).id,first);assert.equal(document.querySelector('.studio-drag-active'),null);assert.equal(document.querySelector('.studio-drag-floating'),null)
})
test('pointer touch activates drag, preserves normal scroll outside handles and commits once',async()=>{
 await React.act(async()=>root.unmount());Sortable.supportPointer=true;root=createRoot(document.getElementById('root'));await React.act(async()=>root.render(React.createElement(Harness)))
 const parent=document.getElementById('actions'),nodes=Array.from(parent.children),source=nodes[0],target=nodes.at(-1),handle=source.querySelector('.studio-drag-handle'),count=commits,first=current.actions[0].id
 const rect=(y,height=60)=>({x:0,y,top:y,left:0,right:240,bottom:y+height,width:240,height,toJSON(){return this}})
 parent.getBoundingClientRect=()=>rect(0,240);nodes.forEach(n=>{n.getBoundingClientRect=()=>rect(Array.from(parent.children).indexOf(n)*60);n.querySelector('.studio-drag-handle').getBoundingClientRect=n.getBoundingClientRect})
 document.elementFromPoint=()=>target
 const touch=(type,y)=>handle.dispatchEvent(new window.PointerEvent(type==='touchstart'?'pointerdown':type==='touchend'?'pointerup':'pointermove',{pointerType:'touch',pointerId:7,isPrimary:true,button:0,buttons:type==='touchend'?0:1,clientX:20,clientY:y,bubbles:true,cancelable:true}))
 await React.act(async()=>{touch('touchstart',30);await pause(220);touch('touchmove',40);await pause(40);touch('touchmove',220);await pause(130);assert.equal(commits,count);touch('touchend',220);await pause(40)})
 assert.equal(commits,count+1);assert.equal(current.actions.at(-1).id,first);assert.equal(document.querySelector('.studio-drag-active'),null);assert.equal(document.querySelector('.studio-drag-floating'),null)
})
test('cleanup removes library instances and editor-only handles',async()=>{const parent=document.getElementById('actions');await React.act(async()=>root.unmount());assert.equal(Sortable.get(parent),null);assert.equal(document.querySelector('.studio-drag-handle'),null);dom.window.close()})




