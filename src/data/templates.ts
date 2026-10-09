import type { Bio, Section, SectionKind, Template, VisualStyle } from '../types/biosite'
import { additionalCategories, additionalTemplates } from './businessTemplates'
import { modelDesigns } from './modelDesigns'

export const image = (id: string, width = 1000) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
export const labels: Record<SectionKind, string> = {
  testimonials: 'Depoimentos', actions: 'Ações rápidas', categories: 'Categorias visuais', promotion: 'Destaque / promoção',
  services: 'Serviços', products: 'Pequena vitrine', gallery: 'Galeria / feed', about: 'Sobre',
  benefits: 'Diferenciais', hours: 'Horários', location: 'Localização', whatsapp: 'Chamada para WhatsApp',
}
export const categories = [{ id: 'fashion', label: 'Loja de Roupas', subtitle: 'Curadoria, novidades e looks para cada ocasião.', icon: '↗' }, ...additionalCategories]
const allVisualStyles: { id: VisualStyle; label: string; description: string }[] = [
  { id: 'boutique-gold', label: 'Boutique Gold', description: 'Luxo em preto e dourado. Hero cinematográfico, coleção em cards elegantes e galeria editorial.' },
  { id: 'fashion-pink', label: 'Fashion Pink', description: 'Rosa vibrante. Hero em colagem, lançamentos, promoção marcante e cards com formas divertidas.' },
  { id: 'clean-nude', label: 'Clean Nude', description: 'Bege e branco. Fotografia ampla, tipografia delicada, coleção com respiro e navegação discreta.' },
  { id: 'urban-black', label: 'Urban Black', description: 'Moda urbana em preto e cinza. Manchetes fortes, cortes geométricos e vitrine em linhas editoriais.' },
  { id: 'social-trend', label: 'Social Trend', description: 'Compacto e conectado. Perfil, destaques circulares, vitrine rápida e feed fotográfico.' },
  ...additionalTemplates.map(t => ({ id:t.bio.style, label:t.label, description:modelDesigns[t.bio.style].description })),
]

export const visualStyles = allVisualStyles.filter(v=>!['urban-black','social-trend'].includes(v.id))

const photos = {
  gold: image('photo-1515886657613-9f3515b0c78f'),
  pink: image('photo-1539109136881-3be0616acf4b'),
  nude: image('photo-1485230895905-ec40ba36b9bc'),
  urban: image('photo-1551028719-00167b16eac5'),
  social: image('photo-1483985988355-763728e1935b'),
  dress: image('photo-1595777457583-95e059d581b8', 700),
  trousers: image('photo-1594633312681-425c7b97ccd1', 700),
  knit: image('photo-1434389677669-e08b4cac3105', 700),
  rack: image('photo-1544441893-675973e31985', 700),
}

function section(kind: SectionKind, title: string, text = '', extra: Partial<Section> = {}): Section {
  return { id: kind, kind, title, text, enabled: true, ...extra }
}

interface FashionConfig {
  style: VisualStyle; name: string; tagline: string; headline: string; description: string; color: string;
  cover: string; promotion: { title: string; text: string; badge: string; image: string; cta: string };
  order: SectionKind[]; productsTitle: string; galleryTitle: string; aboutTitle: string; about: string;
}

const configs: FashionConfig[] = [
  {
    style: 'boutique-gold', name: 'MAISON NOIR', tagline: 'CURADORIA DE MODA', headline: 'O extraordinário\nestá nos detalhes.',
    description: 'Uma seleção de peças que traduzem elegância. Descubra sua próxima assinatura de estilo.', color: '#d1b17b', cover: photos.gold,
    promotion: { title: 'Uma coleção.\nInfinitas possibilidades.', text: 'Texturas refinadas, caimentos impecáveis e peças para ocasiões que merecem ser lembradas.', badge: 'THE SIGNATURE COLLECTION', image: photos.nude, cta: 'Conhecer a coleção' },
    order: ['actions','categories','products','promotion','gallery','about','benefits','hours','location','whatsapp'], productsTitle: 'Peças para permanecer.', galleryTitle: 'Um olhar sobre a coleção.',
    aboutTitle: 'Vestir bem é sentir-se você.', about: 'Na Maison Noir, cada peça é escolhida pelo que faz você sentir. Uma boutique de curadoria próxima, para quem encontra beleza no que é singular.',
  },
  {
    style: 'fashion-pink', name: 'PINK CLUB', tagline: 'NEW MOOD. NEW YOU.', headline: 'Seu look.\nSuas regras.',
    description: 'Looks que acompanham o seu mood. Novidades, cor e muita personalidade para sair do óbvio.', color: '#d82472', cover: photos.pink,
    promotion: { title: 'Seu próximo look\nestá aqui.', text: 'Drop de lançamento: looks selecionados com 15% de desconto. Consulte peças e condições pelo WhatsApp.', badge: '15% OFF · DROP DA SEMANA', image: photos.social, cta: 'Quero meu look' },
    order: ['actions','promotion','categories','products','gallery','benefits','about','hours','location','whatsapp'], productsTitle: 'Acabaram de chegar ♡', galleryTitle: 'Looks para salvar.',
    aboutTitle: 'Mais atitude. Mais você.', about: 'A Pink Club nasceu para deixar a moda leve, divertida e possível. Aqui, cada novidade é um convite para experimentar uma nova versão de você.',
  },
  {
    style: 'clean-nude', name: 'alma boutique', tagline: 'ESSENCIAIS, COM ALMA', headline: 'Menos excesso.\nMais essência.',
    description: 'Peças leves, tons naturais e escolhas que fazem sentido. Uma boutique para vestir a sua essência.', color: '#826952', cover: photos.nude,
    promotion: { title: 'Leveza para\ntodos os dias.', text: 'Nossa nova seleção combina texturas naturais e silhuetas que acolhem. Conheça os essenciais da estação.', badge: 'NOVA ESTAÇÃO', image: photos.knit, cta: 'Descobrir os essenciais' },
    order: ['actions','categories','products','promotion','about','gallery','benefits','hours','location','whatsapp'], productsTitle: 'Escolhas que ficam.', galleryTitle: 'Inspiração no cotidiano.',
    aboutTitle: 'Uma forma mais leve de vestir.', about: 'A alma é um espaço de escolhas cuidadosas. Valorizamos conforto, versatilidade e a beleza dos detalhes, com um atendimento que respeita o seu tempo.',
  },
  {
    style: 'urban-black', name: 'OFF GRID', tagline: 'INDEPENDENT STYLE / SP', headline: 'FORA DO\nPADRÃO.',
    description: 'Silhuetas urbanas. Presença real. Peças para quem faz o próprio caminho.', color: '#c6cfb5', cover: photos.urban,
    promotion: { title: 'DROP 001.\nSEM REGRAS.', text: 'Uma seleção de peças de atitude. Pergunte por tamanhos, combinações e disponibilidade.', badge: 'LIMITED SELECTION / 2026', image: photos.gold, cta: 'Explorar o drop' },
    order: ['actions','promotion','products','categories','gallery','about','benefits','location','hours','whatsapp'], productsTitle: 'THE EDIT / 06', galleryTitle: 'STREET NOTES.',
    aboutTitle: 'Seu estilo não pede licença.', about: 'A OFF GRID conecta moda e expressão. Nossa curadoria reúne básicos de presença e peças que quebram a rotina. Do seu jeito, no seu ritmo.',
  },
  {
    style: 'social-trend', name: 'use.mood', tagline: 'SEU LOOK DO DIA', headline: 'Seu próximo\nlook favorito.',
    description: 'Novidades para o seu feed e para a vida real. Encontre seu mood e converse com a gente.', color: '#7358d5', cover: photos.social,
    promotion: { title: 'O look que você\nsalvou no feed.', text: 'Chegou por aqui! Fale com a gente para consultar tamanhos e reservar suas peças favoritas.', badge: 'TREND DA SEMANA', image: photos.pink, cta: 'Consultar meu tamanho' },
    order: ['actions','categories','promotion','products','gallery','about','benefits','hours','location','whatsapp'], productsTitle: 'Favoritos do seu mood', galleryTitle: 'No nosso feed',
    aboutTitle: 'Da tela para o seu guarda-roupa.', about: 'Somos uma loja de encontros: entre tendências, pessoas e estilos. Compartilhamos novidades todos os dias e ajudamos você a encontrar peças com a sua cara.',
  },
]

export const templates: Template[] = [...configs.slice(0, 3).map((config): Template => {
  const sections: Record<SectionKind, Section> = {
    testimonials: section('testimonials', 'Depoimentos'), actions: section('actions', 'Vamos nos conectar'),
    categories: section('categories', config.style === 'social-trend' ? 'Explore seu mood' : 'Encontre seu estilo'),
    promotion: section('promotion', config.promotion.title, config.promotion.text, { badge: config.promotion.badge, image: config.promotion.image, ctaLabel: config.promotion.cta }),
    products: section('products', config.productsTitle),
    gallery: section('gallery', config.galleryTitle),
    about: section('about', config.aboutTitle, config.about, { image: photos.rack }),
    benefits: section('benefits', 'Uma experiência feita para você.'),
    hours: section('hours', 'Seu tempo, nosso encontro.'),
    location: section('location', 'Venha nos conhecer.'),
    whatsapp: section('whatsapp', config.style === 'urban-black' ? 'SEU PRÓXIMO\nMOVIMENTO.' : 'Seu próximo look\ncomeça com uma conversa.', 'Conte o que você procura. A gente ajuda a encontrar.', { ctaLabel: 'Falar com a loja' }),
    services: section('services', 'Atendimento personalizado'),
  }
  return {
    id: `fashion-${config.style}`, categoryId: 'fashion', label: visualStyles.find(v => v.id === config.style)!.label,
    subtitle: config.description, icon: '↗',
    bio: {
      id: `fashion-${config.style}`, style: config.style, name: config.name, category: 'Loja de roupas',
      headline: config.headline, tagline: config.tagline, description: config.description.split('. ')[0] + '.', color: config.color,
      cover: config.cover, logo: '', phone: '5511999990000', instagram: 'https://www.instagram.com/',
      address: 'Rua Exemplo, 128 · Vila Madalena\nSão Paulo, SP', hours: 'Seg a sex: 10h às 19h\nSábado: 10h às 17h\nDomingo: fechado',
      highlights: [ { id: 'new', label: 'Novidades', image: config.cover }, { id: 'looks', label: 'Looks', image: photos.gold }, { id: 'essentials', label: 'Essenciais', image: photos.knit }, { id: 'accessories', label: 'Acessórios', image: photos.rack } ],
      benefits: ['Curadoria de peças|Escolhas que combinam com você.', 'Atendimento próximo|Ajuda para encontrar seu tamanho e estilo.', 'Retirada na loja|Combine tudo pelo WhatsApp.'],
      sections: config.order.map(kind => sections[kind]),
      actions: [ { id: 'wa', label: 'WhatsApp', message: 'Olá! Gostaria de conhecer a coleção.', kind: 'whatsapp' }, { id: 'ig', label: 'Instagram', message: '', kind: 'instagram' }, { id: 'map', label: 'Como chegar', message: '', kind: 'location' } ],
      services: [],
      products: [
        { id: 'dress', title: 'Vestido Signature', description: 'Leveza e movimento.', price: 'R$ 249', image: photos.dress, categoryId: 'looks' },
        { id: 'knit', title: 'Tricot Essencial', description: 'Textura para o dia a dia.', price: 'R$ 189', image: photos.knit, categoryId: 'essentials' },
        { id: 'trousers', title: 'Calça Atelier', description: 'Um caimento que acompanha.', price: 'R$ 219', image: photos.trousers, categoryId: 'essentials' },
        { id: 'jacket', title: 'Jaqueta Urban', description: 'Presença em cada detalhe.', price: 'R$ 329', image: photos.urban, categoryId: 'looks' },
        { id: 'look', title: 'Look da Estação', description: 'Sua nova combinação favorita.', price: 'R$ 289', image: photos.gold, categoryId: 'new' },
        { id: 'accessory', title: 'Seleção de Acessórios', description: 'O toque final do seu estilo.', price: 'A partir de R$ 59', image: photos.rack, categoryId: 'accessories' },
      ],
      photos: [config.cover, photos.gold, photos.pink, photos.nude],
    },
  }
}), ...additionalTemplates]

// Preserve the two approved presentations while expanding the category library.
export const premiumTemplates = templates.filter(t => ['boutique-gold', 'black-gold'].includes(t.bio.style))
for (const template of premiumTemplates) {
  const bio = template.bio
  const fashion = bio.style === 'boutique-gold'
  bio.name = fashion ? 'Loja da Ana' : 'Barbearia do João'
  bio.description = fashion ? 'Estilo que combina com você ♥' : 'Muito mais que um corte, é o seu estilo.'
  bio.tagline = fashion ? 'MODA FEMININA' : 'QUALIDADE · ESTILO · CONFIANÇA'
  bio.address = 'Rua das Flores, 123 · Centro\nSão Paulo · SP'
  bio.hours = fashion ? 'Segunda a Sexta: 09:00 – 19:00\nSábado: 09:00 – 17:00\nDomingo: Fechado' : 'Segunda a Sexta: 09:00 – 20:00\nSábado: 09:00 – 18:00\nDomingo: 09:00 – 14:00'
  const titles: Partial<Record<SectionKind, string>> = { categories: 'Nossas coleções', products: 'Produtos em destaque', services: 'Nossos serviços', about: 'Sobre nós', benefits: 'Nossos diferenciais', gallery: 'Galeria', hours: 'Horário de funcionamento', location: 'Localização', whatsapp: fashion ? 'Vamos encontrar seu próximo look?' : 'Pronto para renovar seu estilo?' }
  bio.sections.forEach(s => { if (titles[s.kind]) s.title = titles[s.kind]! })
  const promo = bio.sections.find(s => s.kind === 'promotion')!
  Object.assign(promo, fashion ? { title: 'Novidades\ntoda semana ♥', text: 'Peças selecionadas para você estar sempre na moda.', badge: 'NOVA COLEÇÃO', ctaLabel: 'Ver novidades' } : { title: 'Corte + Barba', text: 'Seu ritual completo por R$ 45,00. Consulte condições e horários.', badge: 'PROMOÇÃO DA SEMANA', ctaLabel: 'Agendar agora' })
  if (fashion) {
    bio.cover = photos.pink
    bio.color = '#d1b17b'
    bio.highlights = [{ id: 'looks', label: 'Vestidos', image: photos.dress }, { id: 'essentials', label: 'Blusas', image: photos.knit }, { id: 'new', label: 'Calças', image: photos.trousers }]
    bio.actions.push({ id: 'catalog', kind: 'order', label: 'Catálogo', message: 'Olá! Quero conhecer o catálogo.', mode: 'whatsapp' })
    bio.benefits = ['Envio rápido|Para a sua região', 'Compra segura|Com atendimento próximo', 'Peças selecionadas|Com muito carinho']
  } else {
    bio.services = bio.services.slice(0, 3).map((s, i) => ({ ...s, title: ['Corte', 'Barba', 'Corte + Barba'][i], price: ['R$ 35,00', 'R$ 25,00', 'R$ 45,00'][i] }))
    bio.benefits = ['Atendimento personalizado|Cuidado em cada detalhe', 'Produtos de alta qualidade|Seu estilo em boas mãos', 'Ambiente moderno|Conforto durante seu atendimento', 'Agendamento online|Escolha o melhor horário']
  }
  const about = bio.sections.find(s => s.kind === 'about')!
  about.text = fashion ? 'A Loja da Ana nasceu para oferecer moda feminina de qualidade com estilo e preço justo. Aqui você encontra peças escolhidas com carinho para realçar sua beleza e autoestima.' : 'A Barbearia do João nasceu para oferecer mais que um corte. Aqui você encontra estilo, cuidado e um ambiente feito para você se sentir bem.'
  bio.sections.push(section('testimonials', 'Depoimentos', fashion ? 'Ana Paula|Peças lindas e atendimento muito atencioso.\nCarla Lima|Adorei as novidades e o cuidado na escolha do meu look.' : 'Matheus Silva|Excelente corte e atendimento cuidadoso.\nCarlos Lima|Sempre saio satisfeito. Recomendo!', { enabled: true }))
  const order: SectionKind[] = fashion ? ['actions','promotion','categories','products','about','benefits','gallery','testimonials','hours','location','whatsapp'] : ['actions','promotion','services','benefits','about','gallery','testimonials','hours','location','whatsapp','products','categories']
  bio.sections.sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind))
}

for (const template of templates.filter(t => !premiumTemplates.includes(t))) {
  const bio = template.bio
  if (!bio.sections.some(s => s.kind === 'testimonials')) {
    const review = section('testimonials', 'Quem conhece, recomenda', 'Cliente demonstrativo|Atendimento atencioso e uma ótima experiência.\nCliente exemplo|Gostei do cuidado nos detalhes. Recomendo!')
    const position = bio.sections.findIndex(s => s.kind === 'hours')
    bio.sections.splice(position < 0 ? bio.sections.length : position, 0, review)
  }
  if (template.categoryId === 'fashion') bio.actions.push({id:'catalog',kind:'order',label:'Catálogo',message:'Olá! Quero conhecer as peças disponíveis.',mode:'whatsapp'})
  if (template.categoryId === 'beauty') bio.services.push(
    {id:'lashes',title:'Extensão de cílios',description:'Um olhar marcante, com cuidado profissional.',price:'A partir de R$ 120',image:bio.photos[1]},
    {id:'nails',title:'Unhas em gel',description:'Acabamento e durabilidade para sua rotina.',price:'A partir de R$ 90',image:bio.photos[2]},
  )
  // Front-load useful content; each composition keeps its own remaining section order.
  const useful = bio.sections.find(s => s.kind === (['barber','beauty','auto'].includes(template.categoryId) ? 'services' : 'products'))
  if (useful) useful.text = 'Valores demonstrativos. Consulte disponibilidade e condições.'
  const categorySection = bio.sections.find(s=>s.kind==='categories' && s.enabled)
  if (categorySection && useful && bio.sections.indexOf(categorySection)<bio.sections.indexOf(useful)) {
    bio.sections = bio.sections.filter(s=>s!==categorySection)
    bio.sections.splice(bio.sections.indexOf(useful)+1,0,categorySection)
  }
}

export interface QuickInfo { name: string; categoryId: string; phone: string; instagram: string; address: string; logo: string; cover: string; description?: string }
export function personalizeModel(template: Template, info: QuickInfo): Template {
  const result = structuredClone(template)
  const previousName = result.bio.name
  const instagram = info.instagram.trim()
  Object.assign(result.bio, { name:info.name.trim() || previousName, phone:info.phone.trim(), instagram:instagram ? (/^https?:\/\//i.test(instagram) ? instagram : /^(www\.)?instagram\.com\//i.test(instagram) ? `https://${instagram}` : `https://www.instagram.com/${instagram.replace(/^@/, '').replace(/\/$/, '')}/`) : '', address:info.address.trim() })
  if (info.logo) result.bio.logo = info.logo
  if (info.cover) result.bio.cover = info.cover
  if (info.description?.trim()) result.bio.description = info.description.trim()
  result.bio.sections = result.bio.sections.map(s => ({...s,text:s.text.replaceAll(previousName,result.bio.name)}))
  return result
}

export function createManualBio(info: QuickInfo): Bio {
  const model = templates.find(t => t.categoryId === info.categoryId) || templates[0]
  const base = createBio(personalizeModel(model, info))
  for (const kind of ['services','products'] as const) {
    if (!base.sections.some(s=>s.kind===kind)) base.sections.push(section(kind,kind==='services'?'Serviços e atendimento':'Nossa vitrine','Conteúdo demonstrativo. Personalize no editor.',{enabled:false}))
    if (!base[kind].length) base[kind].push({id:`manual-${kind}`,title:kind==='services'?'Atendimento personalizado':'Seleção especial',description:'Consulte opções e disponibilidade.',price:'Sob consulta',image:base.cover})
  }
  return { ...base, style:'clean-minimal',manual:true,color:'#586b73',appearance:{theme:'light',secondary:'#e6eef0',font:'sans',buttons:'rounded',cards:'rounded'} }
}

export function createBio(template?: Template): Bio {
  if (template) return { ...structuredClone(template.bio), id: crypto.randomUUID() }
  const base = createBio(templates.find(t => t.bio.style === 'clean-minimal')!)
  return { ...base, manual: true, name: 'Seu novo negócio', description: 'Produtos, serviços e atendimento perto de você.', appearance: { theme:'light',secondary:'#e6eef0',font:'sans',buttons:'rounded',cards:'rounded' } }
}




import {modaPremiumGold} from './modaPremiumGold'
import {bellaModa,urbanBlack,charmmeModa,lumiereBoutique,vibeStore,urbanBlackTwo,nexoModa,atelier27,lumiereModaFeminina,imperiumBarbearia,barberPro,royalBarber,bravoBarbearia,theCutBarbearia} from './officialFashionModels'
import {officialBeautyTemplates} from './officialBeautyModels'
import {beautyLoteOneTemplates} from './beautyLoteOneModels'
import {loteFiveTemplates} from './loteFiveModels'
import {loteSevenTemplates} from './loteSevenModels'
import {loteSixTemplates} from './loteSixModels'
import {loteFourTemplates} from './loteFourModels'
import {loteThreeTemplates} from './loteThreeModels'
import {loteTwoTemplates} from './loteTwoModels'
import {refreshOriginal} from './originalRefresh'
export const readyTemplates:Template[]=[modaPremiumGold(templates[0].bio),bellaModa(templates[0].bio),urbanBlack(templates[0].bio),charmmeModa(templates[0].bio),lumiereBoutique(templates[0].bio),vibeStore(templates[0].bio),urbanBlackTwo(templates[0].bio),nexoModa(templates[0].bio),atelier27(templates[0].bio),lumiereModaFeminina(templates[0].bio),imperiumBarbearia(templates[0].bio),barberPro(templates[0].bio),royalBarber(templates[0].bio),bravoBarbearia(templates[0].bio),theCutBarbearia(templates[0].bio),...officialBeautyTemplates(templates[0].bio),...beautyLoteOneTemplates(templates[0].bio),...loteTwoTemplates(templates[0].bio),...loteThreeTemplates(templates[0].bio),...loteFourTemplates(templates[0].bio),...loteFiveTemplates(templates[0].bio),...loteSixTemplates(templates[0].bio),...loteSevenTemplates(templates[0].bio),...templates.map(refreshOriginal)]


