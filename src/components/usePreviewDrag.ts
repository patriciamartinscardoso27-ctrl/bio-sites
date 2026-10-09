import {useLayoutEffect,useRef,useState,type RefObject} from 'react'
import Sortable from 'sortablejs'
import type {Bio} from '../types/biosite'
import {reorderPreview,type ReorderList} from '../lib/previewReorder'
export function usePreviewDrag(root:RefObject<HTMLDivElement|null>,bio:Bio,onChange:(p:Partial<Bio>)=>void){
 const change=useRef(onChange),focusAfter=useRef<string|null>(null)
 useLayoutEffect(()=>{change.current=onChange},[onChange])
 const suppress=useRef(false),[announcement,setAnnouncement]=useState('')
 useLayoutEffect(()=>{
  const canvas=root.current;if(!canvas)return
  const instances:Sortable[]=[],handles:HTMLElement[]=[]
  const add=(nodes:HTMLElement[],list:ReorderList,label:string)=>{
   if(nodes.length<2)return;const parent=nodes[0].parentElement;if(!parent||nodes.some(n=>n.parentElement!==parent))return
   const group='drag-'+handles.length,selector='[data-drag-member="'+group+'"]',handleSelector='[data-drag-group="'+group+'"]'
   const identity=(node:HTMLElement)=>list.scope==='sections'?node.dataset.sectionId!:list.scope==='items'?node.dataset.itemId!:list.scope==='actions'?node.dataset.actionId!:list.scope==='highlights'?node.dataset.highlightId!:node.dataset.reorderIndex!
   const commit=(source:string,target:string)=>{const patch=reorderPreview(bio,list,source,target);if(Object.keys(patch).length){change.current(patch);setAnnouncement(label+' reorganizado. Use Desfazer para voltar.')}}
   nodes.forEach(node=>{
    node.dataset.dragMember=group;node.classList.add('studio-draggable')
    const handle=document.createElement('button');handle.type='button';handle.className='studio-drag-handle';handle.dataset.dragGroup=group;handle.textContent='⠿';handle.setAttribute('aria-label','Arrastar '+label);handle.title='Arraste para reorganizar · teclado: ↑ ↓';node.append(handle);handles.push(handle);const focusKey=JSON.stringify([list,identity(node)]);if(focusAfter.current===focusKey){handle.focus({preventScroll:true});focusAfter.current=null}
    handle.addEventListener('click',e=>{e.preventDefault();e.stopPropagation()})
    handle.addEventListener('keydown',e=>{if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();e.stopPropagation();const i=nodes.indexOf(node),to=i+(['ArrowUp','ArrowLeft'].includes(e.key)?-1:1);if(nodes[to]){focusAfter.current=JSON.stringify([list,identity(node)]);commit(identity(node),identity(nodes[to]))}})
   })
   let originalNext:ChildNode|null=null
   instances.push(new Sortable(parent,{draggable:selector,handle:handleSelector,group:{name:group,pull:false,put:false},animation:matchMedia('(prefers-reduced-motion: reduce)').matches?0:150,delay:180,delayOnTouchOnly:true,touchStartThreshold:5,fallbackTolerance:4,forceFallback:false,fallbackOnBody:true,chosenClass:'studio-drag-chosen',ghostClass:'studio-drag-placeholder',fallbackClass:'studio-drag-floating',onStart:event=>{suppress.current=true;originalNext=event.item.nextSibling;canvas.classList.add('studio-drag-active')},onEnd:event=>{
    const final=Array.from(parent.querySelectorAll<HTMLElement>(':scope > '+selector)),target=nodes[event.newDraggableIndex??-1]
    // Restore React's original DOM before committing a single immutable state change.
    parent.insertBefore(event.item,originalNext);canvas.classList.remove('studio-drag-active')
    if(event.oldDraggableIndex!==event.newDraggableIndex&&target&&final.includes(event.item))commit(identity(event.item),identity(target))
    requestAnimationFrame(()=>{suppress.current=false})
   }}))
  }
  const sections=Array.from(canvas.querySelectorAll<HTMLElement>('[data-section-id]'));add(sections,{scope:'sections'},'seção')
  sections.forEach(section=>{
   const sectionId=section.dataset.sectionId
   const lists:[string,ReorderList['scope'],string][]=[['[data-action-id]','actions','botão'],['[data-item-id]','items','item'],['[data-photo-index]','photos','foto'],['[data-benefit-index]','benefits','diferencial'],['[data-review-index]','testimonials','depoimento'],['[data-highlight-id]','highlights','card']]
   lists.forEach(([selector,scope,label])=>{const nodes=Array.from(section.querySelectorAll<HTMLElement>(selector));nodes.forEach(n=>{if(scope==='photos')n.dataset.reorderIndex=n.dataset.photoIndex;if(scope==='benefits')n.dataset.reorderIndex=n.dataset.benefitIndex;if(scope==='testimonials')n.dataset.reorderIndex=n.dataset.reviewIndex});add(nodes,{scope,sectionId},label)})
  })
  return()=>{instances.forEach(s=>s.destroy());handles.forEach(h=>h.remove());canvas.querySelectorAll('[data-drag-member]').forEach(n=>{n.removeAttribute('data-drag-member');n.classList.remove('studio-draggable')});canvas.classList.remove('studio-drag-active')}
 },[bio,root])
 return {announcement,ignoreClick:(element:Element)=>suppress.current||Boolean(element.closest('.studio-drag-handle'))}
}

