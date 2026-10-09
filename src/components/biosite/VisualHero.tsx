import {ImageSlot} from '../ImageSlot'
import type {Bio} from '../../types/biosite'
import {visualStyles} from '../../lib/visualStyles'
import {MapPin} from 'lucide-react'
export function VisualHero({bio}:{bio:Bio}){
 const v={...bio.designVisual,...bio.heroVisual},composition=v.heroComposition||'cover',initials=bio.name.split(/\s+/).map(w=>w[0]).slice(0,2).join('')
 return <header className="visual-hero" data-hero-composition={composition} data-content-position={v.contentPosition||'bottom'} style={visualStyles(v)}>{(bio.cover||bio.heroVisual?.mediaAspect)&&<ImageSlot className="visual-hero-cover collection-cover" src={bio.cover} alt={'Capa de '+bio.name} fetchPriority="high"/>}<div className="visual-hero-shade"/><div className="visual-hero-identity"><div className="collection-logo visual-hero-logo">{bio.logo?<img src={bio.logo} alt={'Logo '+bio.name}/>:<span>{initials}</span>}</div><h1 style={visualStyles(bio.textVisual?.name)} data-text-visual={Boolean(bio.textVisual?.name)||undefined}>{bio.name}</h1><small style={visualStyles(bio.textVisual?.tagline)} data-text-visual={Boolean(bio.textVisual?.tagline)||undefined}>{bio.tagline}</small><p style={visualStyles(bio.textVisual?.description)} data-text-visual={Boolean(bio.textVisual?.description)||undefined}>{bio.description}</p>{bio.address&&<span className="visual-hero-place"><MapPin size={13}/>{bio.address.split('\n')[0]}</span>}</div></header>
}
