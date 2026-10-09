export type SectionKind = 'actions' | 'categories' | 'promotion' | 'services' | 'products' | 'gallery' | 'about' | 'benefits' | 'hours' | 'location' | 'whatsapp' | 'testimonials'
export interface Item { id: string; title: string; description: string; price: string; image: string; categoryId?: string }
export interface Section { id: string; kind: SectionKind; title: string; text: string; enabled: boolean; image?: string; badge?: string; ctaLabel?: string }
export type ActionKind = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'reviews' | 'location' | 'phone' | 'email' | 'website' | 'menu' | 'booking' | 'quote' | 'order' | 'custom'
export type GenericIcon = import('../lib/iconCatalog').IconId
// Optional fields preserve existing model buttons; old actions reuse business contacts.
export interface Action {
  id: string; label: string; message: string; kind?: ActionKind;
  enabled?: boolean; source?: 'business' | 'custom'; mode?: 'whatsapp' | 'url';
  url?: string; number?: string; email?: string; icon?: GenericIcon; iconColorMode?:'original'|'theme'|'custom';
}
export interface Highlight { id: string; label: string; image: string }
export interface Appearance { theme: 'light' | 'dark'; secondary: string; font: 'sans' | 'serif' | 'condensed'; buttons: 'rounded' | 'square' | 'pill'; cards: 'rounded' | 'square'; background?:string; text?:string; panel?:string }
export type VisualStyle = 'boutique-gold' | 'fashion-pink' | 'clean-nude' | 'urban-black' | 'social-trend'
  | 'black-gold' | 'vintage-barber' | 'urban-street' | 'clean-gentleman' | 'luxury-dark'
  | 'rose-gold' | 'nude-elegance' | 'luxury-black' | 'clean-spa' | 'beauty-glam'
  | 'gourmet-dark' | 'fast-food-red' | 'rustic-kitchen' | 'clean-menu' | 'street-food'
  | 'candy-pink' | 'chocolate-premium' | 'clean-patisserie' | 'color-fun' | 'luxury-sweet'
  | 'auto-premium' | 'performance-red' | 'tech-blue' | 'industrial' | 'clean-professional'
  | 'business-premium' | 'modern-blue' | 'clean-minimal' | 'vibrant-sales' | 'elegant-corporate'
export interface Bio { manual?: boolean; appearance?: Appearance; heroEnabled?: boolean; id: string; style: VisualStyle; name: string; category: string; headline: string; tagline: string; highlights: Highlight[]; benefits: string[]; description: string; color: string; cover: string; logo: string; phone: string; address: string; hours: string; instagram: string; telephone?: string; email?: string; facebook?: string; tiktok?: string; reviewsUrl?: string; mapsUrl?: string; website?: string; menuUrl?: string; sections: Section[]; actions: Action[]; services: Item[]; products: Item[]; photos: string[] }
export interface Template { id: string; categoryId: string; label: string; subtitle: string; icon: string; bio: Bio }
export interface ClientDetails { responsible?: string; city?: string; notes?: string }
export interface Item { action?:Action }
export interface Bio { client?: ClientDetails }
export interface Action { subtitle?: string }
export interface TextOptions { hidden?:boolean; visual?:VisualSettings }
export interface Action { description?:string; textOptions?:Partial<Record<'label'|'subtitle'|'description',TextOptions>> }
export interface Section { subtitle?:string; auxiliary?:string; textOptions?:Partial<Record<'title'|'text'|'subtitle'|'auxiliary'|'badge'|'ctaLabel',TextOptions>> }
export interface Item { textOptions?:Partial<Record<'title'|'description'|'price',TextOptions>> }
export interface Section { entryTextOptions?:Record<string,Partial<Record<'title'|'description'|'caption',TextOptions>>> }
export interface Highlight { caption?:string; textOptions?:Partial<Record<'label'|'caption',TextOptions>> }
export interface Highlight { action?:Action }
export interface Section { action?:Action; entryIcons?:Record<string,Action> }
export interface Action { destination?:'external'|'section'; sectionId?:string }
export interface Appearance { muted?:string; highlight?:string; border?:string }
export type HeroLayout = 'full'|'compact'|'center'|'overlap'|'left'
export type SectionLayout = 'square'|'rounded'|'two'|'four'|'list'|'pill'|'inline'|'compact'|'large'|'three'|'carousel'|'grid'|'mosaic'|'cards'|'spotlight'
export interface Bio { heroLayout?:HeroLayout }
export interface Section { layout?:SectionLayout }
export interface VisualSettings { background?:string; text?:string; highlight?:string; panel?:string; border?:string; radius?:'square'|'rounded'|'pill'; shadow?:'none'|'soft'|'strong'; spacing?:'compact'|'normal'|'wide'; titleSize?:'small'|'medium'|'large'; align?:'left'|'center'|'right'; font?:'sans'|'serif'|'condensed'; weight?:'regular'|'bold'; imageFit?:'cover'|'contain'; imagePosition?:'center'|'top'|'bottom'; backgroundImage?:string; style?:'solid'|'outline'|'soft' }
export interface SectionContent { items?:Item[]; actions?:Action[]; photos?:string[]; benefits?:string[]; highlights?:Highlight[]; hours?:string; address?:string; mapsUrl?:string }
export interface Section { visual?:VisualSettings; content?:SectionContent; block?:'text'|'image-text'|'picture-text'|'image'|'cards'|'cta'|'list' }
export interface Section { titleVisual?:VisualSettings }
export interface Action { visual?:VisualSettings }
export interface Action { appearanceMode?:'brand'|'theme'|'custom' }
export interface Item { visual?:VisualSettings }
export interface Bio { heroVisual?:VisualSettings }
export interface Bio { textVisual?:Partial<Record<'name'|'description'|'tagline'|'headline',VisualSettings>> }
export interface Bio { composition?:import('../lib/designCompositionEngine').CompositionMetadata }
export interface VisualSettings { titleColor?:string }
export interface VisualSettings { iconColor?:string; textColor?:string; hoverColor?:string }
export interface Appearance { buttonMode?:'original'|'theme'|'mono'|'light'|'dark'|'custom'; buttonDefault?:string; buttonBackground?:string; buttonIcon?:string; buttonText?:string; buttonHover?:string }



export interface VisualSettings { paddingX?:number; paddingY?:number; gap?:number; minHeight?:number; mediaHeight?:number; iconSize?:number; borderWidth?:number; borderStyle?:'solid'|'dashed'|'dotted' }

export interface VisualSettings { columns?:1|2|3|4 }

export interface VisualSettings { radiusPx?:number; maxWidth?:number; mediaWidth?:number; fontSize?:number; logoSize?:number; glyphSize?:number; buttonHeight?:number; labelSize?:number; subtitleSize?:number; overlay?:number; heroComposition?:'cover'|'stacked'|'split'|'profile'|'overlap'; contentPosition?:'top'|'center'|'bottom'; actionFormat?:'tiles'|'cards'|'rows'|'icons'; iconPosition?:'top'|'left'; cardMedia?:'top'|'left'|'background'; mediaPlacement?:'top'|'bottom'|'left'|'right'|'background' }

export interface Bio { renderMode?:'flexible'; designVisual?:VisualSettings }

export interface VisualSettings { backgroundGradient?:string }
export interface VisualSettings { locationVisual?:'map'|'image'|'map-info'|'image-info' }
export interface VisualSettings { colorBindings?:Partial<Record<'background'|'panel'|'text'|'titleColor'|'highlight'|'border'|'iconColor'|'textColor'|'hoverColor',import('../lib/identityPalette').PaletteToken>> }
export interface Bio { identity?:{brandColors?:string[];extractedColors?:string[];instagram?:string;logoPalette?:string[];instagramPalette?:string[];referencePalette?:string[];sources?:{name:string;role:'logo'|'instagram'|'reference';colors:string[]}[]} }

export interface VisualSettings { heightPercent?:number; widthPercent?:number }

export interface VisualSettings { mediaAspect?:number }

export interface VisualSettings { imagePositionX?:number; imagePositionY?:number; bodySize?:number; lineHeight?:number; letterSpacing?:number; fontWeight?:number; textStyle?:'normal'|'italic' }

export interface VisualSettings { surfaceRadius?:number; surfaceBorderWidth?:number; surfaceShadow?:'none'|'soft'|'strong' }

export interface Bio { layoutPreset?:typeof import('../data/readyModelIds').readyModelIds[number] }

export interface VisualSettings { cardPaddingX?:number;cardPaddingY?:number;cardGap?:number;cardTitleSize?:number;cardBodySize?:number;priceSize?:number;headingGap?:number;contentWidth?:number;overlayGradient?:string;cardSurface?:'plain'|'panel' }

export interface VisualSettings {surfaceText?:string}
