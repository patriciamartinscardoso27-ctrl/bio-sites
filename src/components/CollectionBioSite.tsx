import type { CSSProperties } from 'react'
import { MapPin, Sparkles } from 'lucide-react'
import type { Bio } from '../types/biosite'
import { modelDesigns } from '../data/modelDesigns'
import { visualStyles } from '../lib/visualStyles'
import { PremiumBioSite } from './PremiumBioSite'

const profiles = ['fashion-pink','vintage-barber','nude-elegance','fast-food-red','chocolate-premium','performance-red','modern-blue']
const splits = ['clean-nude','urban-street','luxury-black','rustic-kitchen','clean-patisserie','tech-blue','clean-minimal']
const contrastInk = (hex:string) => {
  const value = hex.replace('#','')
  const channels = [0,2,4].map(i => parseInt(value.slice(i,i+2),16)/255).map(v => v<=0.04045 ? v/12.92 : ((v+0.055)/1.055)**2.4)
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722 > 0.179 ? '#101519' : '#ffffff'
}
export function CollectionBioSite({ bio, embedded = false }: { bio: Bio; embedded?: boolean }) {
  const d = modelDesigns[bio.style]
  const layout = profiles.includes(bio.style) ? 'profile' : splits.includes(bio.style) ? 'split' : 'scene'
  const fashion = ['fashion-pink','clean-nude'].includes(bio.style)
  const service = ['Barbearia','Salão / Estética','Oficina / Serviços'].includes(bio.category)
  const dark = bio.appearance ? bio.appearance.theme === 'dark' : ['luxury-black','gourmet-dark','chocolate-premium','auto-premium','performance-red','business-premium','urban-street'].includes(bio.style)
  const css = { '--brand':bio.color, '--collection-bg':bio.appearance?.background || (dark ? '#101519' : d.paper), '--collection-ink':bio.appearance?.text || (dark ? '#f7f4ec' : d.ink), '--collection-muted':bio.appearance?.muted || (dark ? '#b5bcc2' : d.muted), '--collection-panel':bio.appearance?.panel || (dark ? '#1b2329' : '#fff'), '--collection-line':bio.appearance?.border || (dark ? '#ffffff18' : '#00000012'), '--collection-secondary':bio.appearance?.secondary || (dark ? '#29313a' : '#eee5da'), '--collection-font':bio.appearance?.font === 'serif' ? 'Georgia,serif' : bio.appearance?.font === 'condensed' ? 'Impact,Arial,sans-serif' : bio.appearance ? 'Arial,sans-serif' : d.heading } as CSSProperties
  Object.assign(css, {'--collection-secondary-ink':contrastInk(bio.appearance?.secondary || (dark ? '#29313a' : '#eee5da')),'--collection-brand-ink':contrastInk(bio.color)})
  const initials = bio.name.split(/\s+/).filter(w=>!['da','de','do','e'].includes(w.toLowerCase())).map(w=>w[0]).slice(0,2).join('').toUpperCase()
  const logo = <div className="collection-logo">{bio.logo ? <img src={bio.logo} alt={`Logo ${bio.name}`}/> : <span>{initials}</span>}</div>
  const identity = <div className="collection-identity">{logo}<div><small data-text-visual={bio.textVisual?.tagline?true:undefined} style={visualStyles(bio.textVisual?.tagline)} >{bio.tagline}</small><h1 data-text-visual={bio.textVisual?.name?true:undefined} style={visualStyles(bio.textVisual?.name)} >{bio.name}</h1><p data-text-visual={bio.textVisual?.description?true:undefined} style={visualStyles(bio.textVisual?.description)} >{bio.description}</p>{bio.address && <span className="collection-place"><MapPin size={12}/>{bio.address.split('\n')[0]}</span>}</div></div>
  const cover = bio.cover && <img className="collection-cover" src={bio.cover} alt={`Capa de ${bio.name}`} fetchPriority="high"/>
  // Approved models remain untouched. Their tested sections also serve the new compositions.
  return <article className={`collection-site collection-${layout} collection-style-${bio.style} ${dark ? 'collection-dark' : ''} ${fashion ? 'collection-fashion' : ''} ${embedded ? 'embedded' : ''} buttons-${bio.appearance?.buttons || (layout==='profile'?'pill':layout==='split'?'square':'rounded')} cards-${bio.appearance?.cards || (layout==='split'?'square':'rounded')}`} style={css} data-style={bio.style}>
    {bio.heroEnabled !== false && <header className="collection-hero" data-hero-layout={bio.heroLayout} style={visualStyles(bio.heroVisual)} data-spacing={bio.heroVisual?.spacing}>{cover}{layout==='profile' && bio.photos[1] && <img className="collection-accent-photo" src={bio.photos[1]} alt=""/>}{identity}{layout==='scene' && <span className="collection-signature"><Sparkles size={12}/>{bio.category}</span>}</header>}
    <PremiumBioSite sourceStyle={bio.style} bio={{...bio,heroEnabled:false,style:service ? 'black-gold' : 'boutique-gold'}} embedded categoryCta={fashion ? 'Ver peças' : 'Ver opções'}/>
  </article>
}

