import {useId,useState,type CSSProperties} from 'react'
import {ArrowRight,ChevronRight,Truck,Clock,MapPin,ChefHat,UtensilsCrossed,ConciergeBell,CupSoda} from 'lucide-react'
import type {Bio,Section} from '../../types/biosite'
import {EditableText} from '../EditableText'
import {ImageSlot} from '../ImageSlot'
import {ActionIcon} from '../ActionIcon'
import {QuickActions} from '../QuickActions'
import {sectionContent,sectionBio} from '../../lib/sections'
import {sectionAction} from '../../lib/editableActions'
import {actionDestination} from '../../lib/actionLinks'
import {entryTextKey,entryTextOwner} from '../../lib/entryText'
import {visualStyles} from '../../lib/visualStyles'
import '../../styles/patyGaletos.css'

export function PatyGaletosLayout({bio,embedded=false}:{bio:Bio;embedded?:boolean}){
 const instance=useId().replaceAll(':',''),anchor=(id:string)=>instance+'-'+id
 const [filter,setFilter]=useState('all'),[galleryOpen,setGalleryOpen]=useState<number|null>(null)
 const Control=embedded?'span':'button'
 const sections=bio.sections.filter(s=>s.enabled)
 const categories=sections.find(s=>s.kind==='categories')
 const heading=(s:Section)=><EditableText owner={s} field="title" value={s.title} as="h2"/>
 const href=(s:Section)=>actionDestination(sectionAction(bio,s),sectionBio(bio,s),anchor).href
 const cta=(s:Section,cls='pg-button')=><a className={cls} data-editor-field="action" href={href(s)} aria-disabled={!href(s)||undefined}><EditableText owner={s} field="ctaLabel" value={s.ctaLabel||s.action?.label||'Ver mais'} as="span"/><ArrowRight size={17}/></a>
 const brand=()=> <div className="pg-brand-strip"><ImageSlot src={bio.cover} className="pg-brand-backdrop" alt=""/><div className="pg-small-brand"><ImageSlot src={bio.logo} alt="Logo" data-bio-field="logo"/><h1 data-bio-field="name" style={visualStyles(bio.textVisual?.name)}>{bio.name}</h1></div></div>
 return <article className={'biosite pg-site'+(embedded?' embedded':'')} data-ready-model="paty-galetos" style={{'--pg-bg':bio.appearance?.background,'--pg-ink':bio.appearance?.text,'--pg-panel':bio.appearance?.panel,'--pg-orange':bio.color,'--pg-border':bio.appearance?.border} as CSSProperties}>
 {bio.heroEnabled!==false&&<header className="pg-hero"><ImageSlot className="pg-cover" src={bio.cover} alt="Capa" data-bio-field="cover" fetchPriority="high"/><ImageSlot className="pg-logo" src={bio.logo} alt="Logo Paty Galetos" data-bio-field="logo"/><h1 data-bio-field="headline" style={visualStyles(bio.textVisual?.headline)}>{bio.headline.split('\n').map((line,i)=><span key={i}>{line}</span>)}</h1><p data-bio-field="description" style={visualStyles(bio.textVisual?.description)}>{bio.description}</p></header>}
 <main>{sections.map(s=>{
  const c=sectionContent(bio,s),own=sectionBio(bio,s),isDelivery=s.id.endsWith('-delivery'),isMenuBanner=s.id.endsWith('-menu-banner')
  const visibleItems=(c.items||[]).filter(item=>filter==='all'||item.categoryId===filter)
  return <div key={s.id} className={'pg-section-wrap pg-wrap-'+s.kind}>
   {(s.kind==='products'||s.kind==='about')&&brand()}
   <section id={anchor(s.id)} data-section-id={s.id} className={'pg-section pg-section-'+s.kind+(isDelivery?' pg-delivery-section':'')+(isMenuBanner?' pg-menu-banner-section':'')}>
    {s.kind==='actions'?<QuickActions bio={own} className="pg-actions" anchorFor={anchor}/>
    :s.kind==='promotion'?isDelivery?<a className="pg-delivery" href={href(s)} aria-disabled={!href(s)||undefined} data-editor-field="action"><Truck size={41}/><div>{heading(s)}<EditableText owner={s} field="text" value={s.text} as="p"/></div><ChevronRight size={24}/></a>:<div className={'pg-banner'+(isMenuBanner?' pg-menu-banner':'')}><ImageSlot src={s.image} alt={s.title}/><div>{heading(s)}<EditableText owner={s} field="text" value={s.text} as="p"/>{s.ctaLabel&&cta(s)}</div></div>
    :s.kind==='benefits'?<div className="pg-benefits">{c.benefits?.map((value,i)=>{const action=s.entryIcons?.[entryTextKey('benefits',value)]||{id:s.id+'-'+i,kind:'custom' as const,icon:'heart' as const,label:value,message:''};return <div key={i} data-benefit-index={i}><span data-editor-field="icon">{action.icon==='food'?s.id.endsWith('-about-benefits')?<ChefHat size={30}/>:i===1?<ConciergeBell size={30}/>:<UtensilsCrossed size={30}/>:<ActionIcon action={action} size={30}/>}</span><EditableText owner={entryTextOwner(s,'benefits',value)} field="title" value={value.split('|')[0]} as="h3"/><EditableText owner={entryTextOwner(s,'benefits',value)} field="description" value={value.split('|')[1]} as="p"/></div>})}</div>
    :s.kind==='products'||s.kind==='services'?<><div className="pg-section-heading">{heading(s)}{cta(s,'pg-text-link')}</div><div className="pg-products">{visibleItems.map(item=>{const dest=actionDestination(item.action||sectionAction(bio,s),own,anchor);return <article key={item.id} data-item-id={item.id} className="pg-product"><ImageSlot src={item.image} alt={item.title}/><div><EditableText owner={item} field="title" value={item.title} as="h3"/><EditableText owner={item} field="description" value={item.description} as="p"/><div className="pg-product-bottom"><EditableText owner={item} field="price" value={item.price} as="strong"/><a href={dest.href} aria-disabled={!dest.href||undefined} aria-label={'Pedir '+item.title} data-editor-field="action"><ActionIcon action={item.action||sectionAction(bio,s)} size={22}/></a></div></div></article>})}</div></>
    :s.kind==='categories'?<><nav className="pg-filters" aria-label="Filtrar cardápio">{c.actions?.filter(a=>a.enabled!==false).map(a=><Control type={embedded?undefined:'button'} key={a.id} data-action-id={a.id} className="pg-filter" aria-pressed={filter===a.id} onClick={embedded?undefined:()=>setFilter(a.id)}><EditableText owner={a} field="label" value={a.label} as="span"/></Control>)}</nav><div className="pg-categories">{c.highlights?.filter(h=>filter==='all'||h.caption===filter).map(h=><a key={h.id} data-highlight-id={h.id} href={h.action?actionDestination(h.action,bio,anchor).href:undefined} data-editor-field="action">{h.image?<ImageSlot src={h.image} alt={h.label}/>:<div className="pg-category-symbol" data-editor-image="true" data-editor-field="image"><CupSoda size={43}/></div>}<EditableText owner={h} field="label" value={h.label} as="h3"/></a>)}</div></>
    :s.kind==='about'?<div className="pg-about">{heading(s)}<EditableText owner={s} field="text" value={s.text} as="p"/><ImageSlot src={s.image} alt={s.title}/></div>
    :s.kind==='gallery'?<><div className="pg-section-heading">{heading(s)}{cta(s,'pg-text-link')}</div><div className="pg-gallery">{c.photos?.map((photo,i)=><div key={i} data-photo-index={i}><ImageSlot src={photo} alt={'Galeria '+(i+1)} onClick={embedded?undefined:()=>setGalleryOpen(i)}/></div>)}</div>{galleryOpen!==null&&!embedded&&<div className="pg-lightbox" role="dialog" aria-modal="true" aria-label="Foto ampliada"><button type="button" aria-label="Fechar foto" onClick={()=>setGalleryOpen(null)}>×</button><ImageSlot src={c.photos?.[galleryOpen]} alt={'Galeria '+(galleryOpen+1)}/><button type="button" onClick={()=>setGalleryOpen((galleryOpen+1)%(c.photos?.length||1))}>Próxima foto <ArrowRight size={20}/></button></div>}</>
    :s.kind==='hours'?<div className="pg-info"><div className="pg-info-title"><Clock size={25}/>{heading(s)}</div><div data-editor-field="hours">{(c.hours??bio.hours).split('\n').map((line,i)=>{const colon=line.indexOf(':');return <div className="pg-hour" key={i}><span>{colon<0?line:line.slice(0,colon)}</span><strong>{colon<0?'':line.slice(colon+1)}</strong></div>})}</div></div>
    :s.kind==='location'?<div className="pg-info pg-location"><div className="pg-info-title"><MapPin size={27}/>{heading(s)}</div><p data-editor-field="address">{c.address||bio.address||s.text}</p>{cta(s)}</div>
    :s.kind==='whatsapp'?<a className="pg-order" data-editor-field="action" href={href(s)} aria-disabled={!href(s)||undefined}><ActionIcon action={sectionAction(bio,s)} size={48}/>{heading(s)}<span><ChevronRight size={28}/></span></a>
    :<>{heading(s)}<EditableText owner={s} field="text" value={s.text} as="p"/></>}
   </section>
  </div>
 })}</main>
 {categories&&!embedded&&<span className="pg-accessibility-note" aria-live="polite">{filter==='all'?'Cardápio completo':'Categoria selecionada: '+filter}</span>}
 </article>
}
