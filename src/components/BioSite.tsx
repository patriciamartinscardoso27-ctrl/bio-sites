import {FashionPremiumLayout} from './biosite/FashionPremiumLayout'
import {EditableText} from './EditableText'
import { useId, useState, type CSSProperties } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, Camera, Check, Clock, Heart, MapPin, MessageCircle, Shirt, Sparkles } from 'lucide-react'
import type { Bio } from '../types/biosite'
import { safeWebUrl } from '../lib/actionLinks'
import { QuickActions } from './QuickActions'
import { BusinessBioSite } from './BusinessBioSite'
import { modelDesigns } from '../data/modelDesigns'
import { PremiumBioSite } from './PremiumBioSite'
import {FlexibleBioSite} from './biosite/FlexibleBioSite'
import { CollectionBioSite } from './CollectionBioSite'



export function BioSite(input: { bio: Bio; embedded?: boolean }) {
  const props={...input,bio:resolvePalette(input.bio)}
  if (props.bio.layoutPreset) return <FashionPremiumLayout {...props}/>
  if (props.bio.renderMode==='flexible') return <FlexibleBioSite {...props}/>
  if (props.bio.manual) return <CollectionBioSite {...props}/>
  if (['boutique-gold', 'black-gold'].includes(props.bio.style)) return <PremiumBioSite {...props}/>
  if (['fashion-pink','clean-nude','vintage-barber','urban-street','rose-gold','nude-elegance','luxury-black','gourmet-dark','fast-food-red','rustic-kitchen','candy-pink','chocolate-premium','clean-patisserie','auto-premium','performance-red','tech-blue','business-premium','modern-blue','clean-minimal'].includes(props.bio.style)) return <CollectionBioSite {...props}/>
  return ['boutique-gold','fashion-pink','clean-nude','urban-black','social-trend'].includes(props.bio.style) ? <FashionBioSite {...props}/> : <BusinessBioSite {...props}/>
}

function FashionBioSite({ bio, embedded = false }: { bio: Bio; embedded?: boolean }) {
  const instance = useId().replace(/:/g, '')
  const [selected, setSelected] = useState('all')
  const anchor = (id: string) => `${instance}-${id}`
  const phone = bio.phone.replace(/\D/g, '')
  const wa = (message: string) => phone ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : undefined
  const maps = bio.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bio.address)}` : undefined
  const instagram = safeWebUrl(bio.instagram)
  const enabled = (kind: string) => bio.sections.some(s => s.kind === kind && s.enabled)
  const productsSection = bio.sections.find(s => s.kind === 'products' && s.enabled)
  const currentFilter = bio.highlights.some(h => h.id === selected) ? selected : 'all'
  const products = bio.products.slice(0, 6).filter(p => currentFilter === 'all' || p.categoryId === currentFilter)
  const cta = (label: string, message: string, className = 'shop-cta') => <a className={className} href={wa(message)} target="_blank" rel="noreferrer" aria-disabled={!phone}>{label}<ArrowUpRight size={17} /></a>
  const logo = <div className="shop-logo">{bio.logo ? <img src={bio.logo} alt={`Logo ${bio.name}`} /> : <span>{bio.name.split(' ').map(word => word[0]).slice(0, 2).join('')}</span>}</div>
  const nav = <nav className="shop-nav" aria-label="Navegação do BioSite">{enabled('products') && <a href={`#${anchor(productsSection!.id)}`}>Coleção</a>}{enabled('gallery') && <a href={`#${anchor(bio.sections.find(s => s.kind === 'gallery')!.id)}`}>Inspiração</a>}{enabled('location') && <a href={`#${anchor(bio.sections.find(s => s.kind === 'location')!.id)}`}>A loja</a>}</nav>

  return <article className={`biosite fashion-site compact-biosite style-${bio.style} ${embedded ? 'embedded' : ''}`} style={{ '--brand': bio.color } as CSSProperties} data-style={bio.style}>
    <header className="shop-hero">
      <div className="shop-topline">{logo}<span>{bio.name}</span>{instagram && <a href={instagram} target="_blank" rel="noreferrer" aria-label="Abrir Instagram"><Camera size={19} /></a>}</div>
      {nav}
      <div className="shop-hero-photo">{bio.cover ? <img src={bio.cover} alt={`Editorial de moda ${bio.name}`} fetchPriority="high" /> : <div className="shop-photo-fallback"><Shirt size={55} /></div>}</div>
      <div className="shop-hero-copy"><span className="shop-tagline">{bio.tagline}</span><h1>{bio.name}</h1><strong className="fashion-short-headline">{bio.headline.replace(/\n/g, " ")}</strong><p>{bio.description}</p>{cta(bio.style === 'urban-black' ? 'ENCONTRE SEU ESTILO' : bio.style === 'fashion-pink' ? 'Quero meu próximo look' : 'Descobrir a coleção', 'Olá! Gostaria de conhecer a coleção.')}<span className="hero-scroll"><ArrowDown size={13} /> Explore seu próximo look</span></div>
      {bio.style === 'fashion-pink' && <span className="fashion-sticker">new<br /><b>mood!</b><Sparkles size={17} /></span>}
      {bio.style === 'social-trend' && <div className="social-profile-note"><Check size={13} /> Moda, curadoria & conexão</div>}
    </header>

    <div className="shop-body">{bio.sections.filter(s => s.enabled).map(s => <section key={s.id} id={anchor(s.id)} className={`shop-section section-${s.kind}`}>
      {s.kind === 'actions' ? <QuickActions bio={bio}/> : s.kind === 'promotion' ? <div className="shop-promotion">{s.image && <div className="promo-photo"><img src={s.image} alt="Destaque da coleção" loading="lazy" /></div>}<div className="promo-copy">{s.badge && <span className="shop-tagline">{s.badge}</span>}<EditableText owner={s} field="title" value={s.title} as="h2"/><EditableText owner={s} field="text" value={s.text} as="p"/>{cta(s.ctaLabel ?? 'Conhecer o destaque', `Olá! Gostaria de saber mais sobre ${s.title.replace('\n', ' ')}.`)}</div></div> : s.kind === 'categories' ? <><div className="shop-section-heading"><EditableText owner={s} field="title" value={s.title} as="h2"/>{s.text && <EditableText owner={s} field="text" value={s.text} as="p"/>}</div><div className="shop-highlights">{bio.highlights.map(h => <button key={h.id} className={currentFilter === h.id ? 'chosen' : ''} onClick={() => { setSelected(currentFilter === h.id ? 'all' : h.id); if (productsSection) document.getElementById(anchor(productsSection.id))?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}><span>{h.image && <img src={h.image} alt="" loading="lazy" />}</span><strong>{h.label}</strong><ArrowUpRight size={13} /></button>)}</div></> : s.kind === 'products' ? <><div className="shop-section-heading"><span className="shop-tagline">A NOSSA CURADORIA</span><EditableText owner={s} field="title" value={s.title} as="h2"/><EditableText owner={s} field="text" value={s.text} as="p"/></div><div className="shop-product-filters" aria-label="Filtrar pequena vitrine"><button aria-pressed={currentFilter === 'all'} onClick={() => setSelected('all')}>Todas</button>{bio.highlights.map(h => <button key={h.id} aria-pressed={currentFilter === h.id} onClick={() => setSelected(h.id)}>{h.label}</button>)}</div><div className="shop-products">{products.map((p, index) => <a href={wa(`Olá! Gostaria de consultar tamanhos e disponibilidade de ${p.title}.`)} target="_blank" rel="noreferrer" key={p.id} className="shop-product"><div className="product-photo">{p.image ? <img src={p.image} alt={p.title} loading="lazy" /> : <Shirt size={35} />}<span className="product-number">0{index + 1}</span><span className="product-heart"><Heart size={15} /></span></div><div className="product-copy"><EditableText owner={p} field="title" value={p.title} as="h3"/><EditableText owner={p} field="description" value={p.description} as="p"/><div><EditableText owner={p} field="price" value={p.price} as="strong"/><span className="product-arrow"><ArrowUpRight size={16} /></span></div></div></a>)}</div>{products.length === 0 && <p className="shop-empty">Nenhuma peça nesta seleção. Explore outra categoria.</p>}<small className="shop-price-note">Peças e preços ilustrativos. Consulte tamanhos e disponibilidade.</small></> : s.kind === 'gallery' ? <><div className="shop-section-heading"><span className="shop-tagline">INSPIRE-SE</span><EditableText owner={s} field="title" value={s.title} as="h2"/>{s.text && <EditableText owner={s} field="text" value={s.text} as="p"/>}</div><div className="shop-gallery">{bio.photos.filter(Boolean).map((url, index) => <div key={`${url}-${index}`}><img src={url} alt={`Inspiração de moda ${index + 1}`} loading="lazy" /><span>{String(index + 1).padStart(2, '0')} / {bio.name}</span></div>)}</div>{instagram && <a className="shop-text-link" href={instagram} target="_blank" rel="noreferrer"><Camera size={16} /> Continue a inspiração no Instagram <ArrowUpRight size={14} /></a>}</> : s.kind === 'about' ? <div className="shop-about">{s.image && <img src={s.image} alt={`Curadoria da ${bio.name}`} loading="lazy" />}<div><span className="shop-tagline">A NOSSA HISTÓRIA</span><EditableText owner={s} field="title" value={s.title} as="h2"/><EditableText owner={s} field="text" value={s.text} as="p"/><span className="about-signature">Com carinho, {bio.name}.</span></div></div> : s.kind === 'benefits' ? <><EditableText owner={s} field="title" value={s.title} as="h2"/><div className="shop-benefits">{bio.benefits.map((benefit, index) => { const [title, text] = benefit.split('|'); return <div key={`${index}-${title}`}><span>{index === 0 ? <Sparkles size={19} /> : index === 1 ? <Heart size={19} /> : <StoreIcon />}</span><h3>{title}</h3><p>{text}</p></div> })}</div></> : s.kind === 'hours' ? <div className="shop-hours"><div className="contact-symbol"><Clock size={22} /></div><div><EditableText owner={s} field="title" value={s.title} as="h2"/>{s.text && <EditableText owner={s} field="text" value={s.text} as="p"/>}{bio.hours.split('\n').filter(Boolean).map((line, index) => <div className="hour-line" key={index}><span>{line.split(': ')[0]}</span><strong>{line.split(': ').slice(1).join(': ')}</strong></div>)}</div></div> : s.kind === 'location' ? <div className="shop-location"><div className="location-art" aria-hidden="true"><div className="map-road road-one" /><div className="map-road road-two" /><div className="map-road road-three" /><span><MapPin size={27} /></span><small>VENHA NOS CONHECER</small></div><div><span className="shop-tagline">ENCONTRE A GENTE</span><EditableText owner={s} field="title" value={s.title} as="h2"/><p>{bio.address || 'Endereço a informar'}</p>{s.text && <EditableText owner={s} field="text" value={s.text} as="p"/>}<a className="shop-cta" href={maps} target="_blank" rel="noreferrer"><MapPin size={16} /> Abrir localização <ArrowUpRight size={15} /></a><small className="location-note">Ilustração de localização · endereço demonstrativo</small></div></div> : s.kind === 'whatsapp' ? <div className={`shop-final fashion-final-${modelDesigns[bio.style].final}`}>{["photo","split"].includes(modelDesigns[bio.style].final)&&bio.cover&&<img className="fashion-final-image" src={bio.cover} alt="" loading="lazy"/>}<MessageCircle size={26} /><EditableText owner={s} field="title" value={s.title} as="h2"/><EditableText owner={s} field="text" value={s.text} as="p"/>{cta(s.ctaLabel ?? 'Falar com a loja', 'Olá! Gostaria de ajuda para escolher meu próximo look.')}<span>Atendimento próximo. Escolhas com a sua cara.</span></div> : s.kind === 'services' ? <><EditableText owner={s} field="title" value={s.title} as="h2"/><div className="shop-services">{bio.services.map(item => <a key={item.id} href={wa(`Olá! Gostaria de saber mais sobre ${item.title}.`)} target="_blank" rel="noreferrer"><EditableText owner={item} field="title" value={item.title} as="h3"/><EditableText owner={item} field="description" value={item.description} as="p"/><EditableText owner={item} field="price" value={item.price} as="strong"/><ArrowRight size={16} /></a>)}</div></> : null}
    </section>)}{bio.sections.length === 0 && <div className="shop-empty"><Sparkles size={25} /><p>Adicione seções no painel para dar vida à sua página.</p></div>}</div>
    <footer className="shop-footer"><strong>{bio.name}</strong><p>{bio.tagline}</p><small>Demonstração · Feito com Vitrine Digital</small></footer>
  </article>
}

function StoreIcon() { return <Shirt size={19} /> }





import {resolvePalette} from '../lib/identityPalette'
