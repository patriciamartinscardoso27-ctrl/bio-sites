import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import type {Bio} from '../types/biosite'
import {BioSite} from './BioSite'
import {isPublicDestination} from '../lib/publicDestinations'
import '../styles/publicBio.css'
export function PublishedRenderer({bio}:{bio:Bio}){
 const root=useRef<HTMLDivElement>(null)
 useLayoutEffect(()=>{
  root.current?.querySelectorAll<HTMLAnchorElement>('a').forEach(link=>{
   if(link.closest('.gold-filter-bar,.gold-gallery-controls'))return
   const valid=isPublicDestination(link.getAttribute('href')||'',window.location.origin)
   if(!valid){link.removeAttribute('href');link.setAttribute('aria-disabled','true');link.tabIndex=-1;link.title='Destino indisponível'}
  })
 },[bio])
 return <div ref={root} className="biosite-public-shell" onClickCapture={e=>{if((e.target as Element).closest('a[aria-disabled=true]')){e.preventDefault();e.stopPropagation()}}}><BioSite bio={bio}/></div>
}
export function PublicBioSite(){
 const [bio,setBio]=useState<Bio|null>(null),[error,setError]=useState('')
 useEffect(()=>{const controller=new AbortController();const slug=location.pathname.slice(3);if(!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)||slug.length>100){setError('Página não encontrada.');return}
  fetch('/api/public/biosites/'+encodeURIComponent(slug),{cache:'no-store',credentials:'omit',signal:controller.signal}).then(async response=>{if(!response.ok)throw Error(response.status===404?'Página não encontrada ou retirada do ar.':'Não foi possível carregar esta página. Tente novamente.');return response.json()}).then(value=>{setBio(value.content);document.title=value.content.name+' · Bio Sites'}).catch(e=>{if(e.name!=='AbortError')setError(e.message)});return()=>controller.abort()
 },[])
 if(error)return <main className="public-message"><h1>BioSite indisponível</h1><p>{error}</p></main>
 return bio?<PublishedRenderer bio={bio}/>:<main className="public-message" role="status">Carregando BioSite…</main>
}
