import {useEffect,useRef,useState,type RefObject} from 'react'
import {createPortal} from 'react-dom'
import type {Bio} from '../types/biosite'
type Point={host:HTMLElement;beforeId:string|null;label:string}
// Editor-only spacers are siblings of sections, never overlays on their content.
// React owns the buttons through portals; cleanup removes all unmanaged hosts.
export function PreviewInsertionPoints({root,bio,onInsert}:{root:RefObject<HTMLDivElement|null>;bio:Bio;onInsert:(beforeId:string|null)=>void}){
 const [points,setPoints]=useState<Point[]>([]),callback=useRef(onInsert)
 useEffect(()=>{callback.current=onInsert},[onInsert])
 useEffect(()=>{const canvas=root.current;if(!canvas)return;const nodes=Array.from(canvas.querySelectorAll<HTMLElement>('[data-section-id]')),next:Point[]=[]
 const insert=(node:HTMLElement,beforeId:string|null,label:string,after=false)=>{const host=document.createElement('div');host.className='studio-insertion-point';if(after)node.after(host);else node.before(host);next.push({host,beforeId,label})}
 nodes.forEach(node=>insert(node,node.dataset.sectionId!,'Adicionar seção antes de '+(bio.sections.find(s=>s.id===node.dataset.sectionId)?.title||'seção')))
 const last=nodes.at(-1);if(last)insert(last,bio.sections[bio.sections.findIndex(s=>s.id===last.dataset.sectionId)+1]?.id||null,'Adicionar seção após '+(bio.sections.find(s=>s.id===last.dataset.sectionId)?.title||'seção'),true)
 else{const hero=canvas.querySelector<HTMLElement>('header');if(hero)insert(hero,null,'Adicionar primeira seção',true)}
 setPoints(next);return()=>next.forEach(p=>p.host.remove())
 },[root,bio])
 return <>{points.map((p,i)=>createPortal(<><button type="button" aria-label={p.label} data-insert-before={p.beforeId||''} onClick={e=>{e.stopPropagation();callback.current(p.beforeId)}}><span aria-hidden="true">＋</span><span className="studio-insertion-label">Adicionar seção</span></button><span className="studio-sr-only">Ponto de inserção {i+1}</span></>,p.host))}</>
}
