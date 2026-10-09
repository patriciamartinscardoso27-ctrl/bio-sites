import type { Bio, Item, Section, SectionKind, Template, VisualStyle } from '../types/biosite'

const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`
export const additionalCategories = [
  { id: 'barber', label: 'Barbearia', subtitle: 'Do clássico ao urbano. Estilo em cada detalhe.', icon: '✂' },
  { id: 'beauty', label: 'Salão / Estética', subtitle: 'Beleza, cuidado e uma experiência acolhedora.', icon: '✦' },
  { id: 'food', label: 'Restaurante / Lanchonete', subtitle: 'Fotos que abrem o apetite. Pedidos sem complicação.', icon: '◉' },
  { id: 'sweets', label: 'Doceria / Padaria', subtitle: 'Doçura, celebração e encomendas especiais.', icon: '♡' },
  { id: 'auto', label: 'Oficina / Serviços', subtitle: 'Confiança e soluções para seguir em frente.', icon: '⚙' },
  { id: 'business', label: 'Comercial Geral', subtitle: 'Uma apresentação profissional para seu negócio.', icon: '↗' },
]

interface ModelSeed {
  style: VisualStyle; label: string; name: string; headline: string; color: string;
  heroPhoto: number; tagline: string; promotion: string;
}
interface CategorySeed {
  id: string; description: string; photos: string[]; models: ModelSeed[];
  highlights: string[]; products: [string, string, string][]; services: [string, string, string][];
  about: string; benefits: string[]; heroCta: string; message: string;
  productsTitle: string; servicesTitle: string; galleryTitle: string; finalTitle: string;
}

const seeds: CategorySeed[] = [
  {
    id: 'barber', description: 'Corte, barba e cuidado masculino. Agende seu próximo horário.',
    photos: ['photo-1503951914875-452162b0f3f1','photo-1621605815971-fbc98d665033','photo-1599351431202-1e0f0137899a','photo-1622287162716-f311baa1a2b8'],
    models: [
      { style:'black-gold', label:'Black Gold', name:'DOM BARBER', headline:'Seu estilo.\nNossa assinatura.', color:'#d0ad70', heroPhoto:0, tagline:'BARBEARIA & ESTILO', promotion:'Corte + barba.\nO seu ritual completo.' },
      { style:'vintage-barber', label:'Vintage Barber', name:'Seu Antônio', headline:'O bom corte\nnão sai de moda.', color:'#8d4931', heroPhoto:1, tagline:'TRADIÇÃO EM CADA CORTE', promotion:'O clássico\nfeito para você.' },
      { style:'urban-street', label:'Urban Street', name:'RUA 13', headline:'CORTE NOVO.\nMESMA ATITUDE.', color:'#c5e064', heroPhoto:2, tagline:'BARBER / CULTURA DE RUA', promotion:'SEU VISUAL.\nSEM PADRÃO.' },
      { style:'clean-gentleman', label:'Clean Gentleman', name:'Gentleman Studio', headline:'Precisão que\nfaz a diferença.', color:'#547363', heroPhoto:3, tagline:'CUIDADO MASCULINO', promotion:'Um cuidado a mais\nno seu dia.' },
      { style:'luxury-dark', label:'Luxury Dark', name:'THE CLUB', headline:'Um ritual\nà sua altura.', color:'#c9b18d', heroPhoto:1, tagline:'BARBER EXPERIENCE', promotion:'Conheça o nosso\nserviço assinatura.' },
    ],
    highlights:['Cortes','Barba','Cuidados','Combos'],
    products:[['Pomada Matte','Fixação com acabamento natural.','R$ 49'],['Óleo para barba','Cuidado diário para sua barba.','R$ 39'],['Shampoo masculino','Limpeza e frescor.','R$ 35'],['Balm para barba','Maciez sem pesar.','R$ 45'],['Pente de madeira','Um essencial no seu cuidado.','R$ 25'],['Kit de cuidados','Sua rotina completa.','R$ 99']],
    services:[['Corte masculino','Consulta de estilo e acabamento preciso.','R$ 45'],['Barba completa','Modelagem, toalha quente e finalização.','R$ 35'],['Corte + barba','O cuidado completo em uma visita.','R$ 70'],['Acabamento','Detalhes que renovam seu visual.','R$ 20']],
    about:'Acreditamos que um bom corte começa com uma boa conversa. Aqui você encontra atenção aos detalhes, atendimento próximo e profissionais que respeitam seu estilo.',
    benefits:['Atendimento com hora marcada|Mais tempo para você.','Cuidado nos detalhes|Do primeiro corte ao acabamento.','Seu estilo em primeiro lugar|Uma escolha feita junto com você.'],
    heroCta:'Agendar meu horário', message:'Olá! Gostaria de agendar corte e barba.', productsTitle:'Cuidados para levar.', servicesTitle:'Escolha seu próximo cuidado.', galleryTitle:'Cortes que falam por si.', finalTitle:'Seu próximo corte\ncomeça aqui.',
  },
  {
    id:'beauty', description:'Cabelo, pele e unhas. Um cuidado pensado para você.',
    photos:['photo-1562322140-8baeececf3df','photo-1516975080664-ed2fc6a32937','photo-1544161515-4ab6ce6db874','photo-1522335789203-aabd1fc54bc9'],
    models:[
      {style:'rose-gold',label:'Rose Gold',name:'Aurora Beauty',headline:'Sua beleza,\nem uma nova luz.',color:'#b87965',heroPhoto:0,tagline:'BELEZA COM INTENÇÃO',promotion:'Um momento\nsó para você.'},
      {style:'nude-elegance',label:'Nude Elegance',name:'essenza studio',headline:'Naturalmente\nvocê.',color:'#9c8068',heroPhoto:1,tagline:'BELEZA & BEM-ESTAR',promotion:'Leveza, cuidado\ne uma pausa.'},
      {style:'luxury-black',label:'Luxury Black',name:'ÉCLAT',headline:'Beleza que\nmarca presença.',color:'#cca487',heroPhoto:0,tagline:'BEAUTY EXPERIENCE',promotion:'Seu novo visual.\nUma experiência completa.'},
      {style:'clean-spa',label:'Clean Spa',name:'Serena Spa',headline:'Respire.\nO cuidado começa aqui.',color:'#638974',heroPhoto:2,tagline:'TEMPO PARA VOCÊ',promotion:'Desacelere.\nSinta a diferença.'},
      {style:'beauty-glam',label:'Beauty Glam',name:'GLOW LAB',headline:'Seu brilho.\nSeu momento.',color:'#c53386',heroPhoto:3,tagline:'BEAUTY, YOUR WAY',promotion:'Seu próximo\nglow up.'},
    ],
    highlights:['Cabelo','Pele','Unhas','Bem-estar'],
    products:[['Sérum de cuidado','Um toque de cuidado diário.','R$ 79'],['Máscara capilar','Maciez para sua rotina.','R$ 59'],['Óleo nutritivo','Brilho e proteção.','R$ 45'],['Creme de mãos','Cuidado em qualquer momento.','R$ 29'],['Kit essencial','Sua rotina de beleza.','R$ 119'],['Voucher presente','Presenteie com uma experiência.','A partir de R$ 80']],
    services:[['Corte e finalização','Um visual pensado para você.','A partir de R$ 80'],['Design de sobrancelhas','Equilíbrio e expressão no olhar.','R$ 45'],['Limpeza de pele','Um cuidado profissional para sua pele.','R$ 140'],['Manicure','Detalhes que fazem você se sentir bem.','R$ 35']],
    about:'Somos um espaço de escuta e cuidado. Nossa equipe combina técnica e sensibilidade para criar uma experiência de beleza que respeita suas escolhas e valoriza quem você é.',
    benefits:['Cuidado personalizado|Cada pessoa, uma experiência.','Equipe atenciosa|Converse sobre o que você procura.','Ambiente acolhedor|Uma pausa para se sentir bem.'],
    heroCta:'Agendar meu cuidado',message:'Olá! Gostaria de consultar horários e serviços.',productsTitle:'Beleza no seu dia a dia.',servicesTitle:'Seu cuidado, sua escolha.',galleryTitle:'Um pouco do nosso universo.',finalTitle:'Reserve um momento\npara você.',
  },
  {
    id:'food',description:'Sabores da casa, feitos na hora. Escolha e peça pelo WhatsApp.',
    photos:['photo-1414235077428-338989a2e8c0','photo-1568901346375-23c9450c58cd','photo-1555939594-58d7cb561ad1','photo-1512621776951-a57141f2eefd','photo-1565299624946-b28f40a0ae38','photo-1540189549336-e6e99c3679fe'],
    models:[
      {style:'gourmet-dark',label:'Gourmet Dark',name:'BRASA & MESA',headline:'Sabor que\nmerece seu tempo.',color:'#c7a677',heroPhoto:0,tagline:'COZINHA & ENCONTROS',promotion:'Uma boa mesa.\nUma noite especial.'},
      {style:'fast-food-red',label:'Fast Food Red',name:'BURGER HOUSE',headline:'FOME DE\nCOISA BOA?',color:'#e63d2d',heroPhoto:1,tagline:'FEITO NA HORA. DO SEU JEITO.',promotion:'Seu combo\nfavorito te espera.'},
      {style:'rustic-kitchen',label:'Rustic Kitchen',name:'Casa do Sabor',headline:'Tem gosto\nde casa.',color:'#9a5935',heroPhoto:2,tagline:'COZINHA COM AFETO',promotion:'O almoço de hoje\nvem com carinho.'},
      {style:'clean-menu',label:'Clean Menu',name:'verde & grão',headline:'Fresco. Leve.\nCheio de sabor.',color:'#5a7c40',heroPhoto:3,tagline:'COMIDA DE VERDADE',promotion:'Sua pausa\nmais gostosa.'},
      {style:'street-food',label:'Street Food',name:'BITE STATION',headline:'SABOR DE RUA.\nATITUDE DE SOBRA.',color:'#f2b440',heroPhoto:1,tagline:'STREET KITCHEN',promotion:'PASSE AQUI.\nPEÇA SEM PRESSA.'},
    ],
    highlights:['Favoritos','Combos','Leves','Para dividir'],
    products:[['Burger da casa','Pão macio, carne e molho especial.','R$ 32'],['Combo completo','Burger, batata e bebida.','R$ 45'],['Prato do dia','Uma seleção do nosso chef.','R$ 38'],['Salada especial','Folhas, grãos e ingredientes frescos.','R$ 29'],['Pizza artesanal','Massa leve e cobertura caprichada.','R$ 49'],['Para compartilhar','Uma boa escolha para a mesa.','R$ 55']],
    services:[],about:'Nossa cozinha reúne bons ingredientes e o prazer de receber. Cada prato é preparado para transformar uma refeição simples em um bom momento. Venha à mesa ou converse com a gente para pedir.',
    benefits:['Preparo caprichado|Sabor em cada detalhe.','Retirada no local|Combine seu pedido pelo WhatsApp.','Feito para compartilhar|Uma boa mesa reúne pessoas.'],
    heroCta:'Fazer meu pedido',message:'Olá! Gostaria de consultar o cardápio e fazer um pedido.',productsTitle:'Escolha seu próximo sabor.',servicesTitle:'Experiências à mesa.',galleryTitle:'Dá vontade de provar.',finalTitle:'Deu vontade?\nA gente prepara.',
  },
  {
    id:'sweets',description:'Bolos, doces e presentes artesanais. Encomende seu momento especial.',
    photos:['photo-1578985545062-69928b1d9587','photo-1488477181946-6428a0291777','photo-1509440159596-0249088772ff','photo-1519869325930-281384150729','photo-1483695028939-5bb13f8648b0','photo-1499636136210-6f4ee915583e'],
    models:[
      {style:'candy-pink',label:'Candy Pink',name:'Doce Flor',headline:'Um carinho\nem forma de doce.',color:'#c46f93',heroPhoto:0,tagline:'FEITO COM CARINHO',promotion:'Pequenos doces.\nGrandes momentos.'},
      {style:'chocolate-premium',label:'Chocolate Premium',name:'CACAU ATELIER',headline:'O lado mais\nintenso do doce.',color:'#c59762',heroPhoto:1,tagline:'CHOCOLATE & AFETO',promotion:'Sua pausa\npede chocolate.'},
      {style:'clean-patisserie',label:'Clean Patisserie',name:'petit atelier',headline:'A beleza\ndos pequenos prazeres.',color:'#ac8b65',heroPhoto:2,tagline:'PÂTISSERIE ARTESANAL',promotion:'Da nossa cozinha\npara a sua mesa.'},
      {style:'color-fun',label:'Color Fun',name:'DOCE FESTA',headline:'MAIS COR.\nMAIS DOÇURA.',color:'#9c4bcc',heroPhoto:3,tagline:'CELEBRE DO SEU JEITO',promotion:'Sua festa\ncomeça aqui!'},
      {style:'luxury-sweet',label:'Luxury Sweet',name:'Belle Sucré',headline:'Para momentos\nextraordinários.',color:'#aa8056',heroPhoto:0,tagline:'CONFEITARIA DE AUTOR',promotion:'Um doce detalhe\npara sua celebração.'},
    ],
    highlights:['Bolos','Docinhos','Presentes','Encomendas'],
    products:[['Bolo de celebração','Uma criação para o seu momento.','A partir de R$ 120'],['Taça de chocolate','Texturas e sabor em cada colher.','R$ 25'],['Croissant artesanal','Delicado, leve e feito com cuidado.','R$ 15'],['Cupcakes','Pequenas porções de alegria.','R$ 12'],['Caixa presente','Uma seleção para surpreender.','R$ 55'],['Cookies da casa','A pausa mais gostosa do dia.','R$ 10']],
    services:[],about:'Nossa confeitaria nasceu do desejo de adoçar os encontros. Preparamos cada receita com atenção aos sabores e aos detalhes, para que seu pedido tenha o carinho de uma criação feita especialmente para você.',
    benefits:['Produção artesanal|Cuidado do preparo ao acabamento.','Encomendas especiais|Converse sobre seu próximo evento.','Presente com carinho|Uma seleção para surpreender.'],
    heroCta:'Fazer minha encomenda',message:'Olá! Gostaria de consultar sabores e fazer uma encomenda.',productsTitle:'Escolha seu doce momento.',servicesTitle:'Encomendas especiais.',galleryTitle:'Detalhes para se apaixonar.',finalTitle:'Qual momento\nvamos adoçar?',
  },
  {
    id:'auto',description:'Revisão e manutenção automotiva. Solicite uma avaliação.',
    photos:['photo-1486262715619-67b85e0b08d3','photo-1580273916550-e323be2ae537','photo-1492144534655-ae79c964c9d7','photo-1503376780353-7e6692767b70'],
    models:[
      {style:'auto-premium',label:'Auto Premium',name:'PRIME AUTO',headline:'Seu carro\nem boas mãos.',color:'#a4bbcb',heroPhoto:0,tagline:'CUIDADO AUTOMOTIVO',promotion:'Uma revisão hoje.\nMais tranquilidade amanhã.'},
      {style:'performance-red',label:'Performance Red',name:'TORQUE LAB',headline:'PRONTO PARA\nO PRÓXIMO NÍVEL.',color:'#ee4b44',heroPhoto:2,tagline:'PERFORMANCE & MANUTENÇÃO',promotion:'SEU MOTOR.\nNOSSA ATENÇÃO.'},
      {style:'tech-blue',label:'Tech Blue',name:'NEXO AUTO',headline:'Precisão no diagnóstico.\nClareza na solução.',color:'#2677c8',heroPhoto:1,tagline:'TECNOLOGIA A SERVIÇO DO SEU CARRO',promotion:'Entenda seu carro.\nEscolha com confiança.'},
      {style:'industrial',label:'Industrial',name:'BASE MECÂNICA',headline:'SERVIÇO DIRETO.\nTRABALHO BEM FEITO.',color:'#bf702d',heroPhoto:0,tagline:'OFICINA / MANUTENÇÃO',promotion:'REVISÃO PREVENTIVA.\nCUIDADO ESSENCIAL.'},
      {style:'clean-professional',label:'Clean Professional',name:'Confia Serviços',headline:'Mais cuidado.\nMenos preocupação.',color:'#378395',heroPhoto:3,tagline:'SOLUÇÕES PARA SEU DIA',promotion:'A manutenção\nque você precisa.'},
    ],
    highlights:['Revisão','Diagnóstico','Manutenção','Cuidados'],
    products:[['Óleo de motor','Consulte especificações para seu veículo.','Sob consulta'],['Filtro de óleo','Compatibilidade avaliada pela equipe.','Sob consulta'],['Filtro de ar','Um cuidado com o desempenho.','Sob consulta'],['Palhetas','Visibilidade para seus trajetos.','Sob consulta'],['Kit de revisão','Itens de manutenção essenciais.','Sob consulta'],['Produtos de cuidado','Uma seleção para seu carro.','Sob consulta']],
    services:[['Revisão preventiva','Avaliação dos principais pontos do veículo.','Sob consulta'],['Diagnóstico eletrônico','Análise para orientar a manutenção.','Sob consulta'],['Troca de óleo e filtros','Consulte a especificação adequada.','Sob consulta'],['Freios e suspensão','Avaliação de componentes e desgaste.','Sob consulta']],
    about:'Trabalhamos com atenção, informação clara e respeito ao seu tempo. Nossa equipe avalia seu veículo e explica os próximos passos antes de qualquer serviço. Um atendimento próximo para você seguir com tranquilidade.',
    benefits:['Orçamento transparente|Você entende antes de decidir.','Avaliação cuidadosa|Atenção aos pontos de manutenção.','Atendimento direto|Fale com quem cuida do seu carro.'],
    heroCta:'Solicitar avaliação',message:'Olá! Gostaria de solicitar uma avaliação e orçamento.',productsTitle:'Essenciais para seu veículo.',servicesTitle:'Como podemos ajudar.',galleryTitle:'Conheça nosso trabalho.',finalTitle:'Vamos cuidar\ndo seu próximo trajeto.',
  },
  {
    id:'business',description:'Produtos e soluções para seu dia. Consulte nossa seleção.',
    photos:['photo-1497366754035-f200968a6e72','photo-1524758631624-e2822e304c36','photo-1497366811353-6870744d04b2','photo-1497215728101-856f4ea42174'],
    models:[
      {style:'business-premium',label:'Business Premium',name:'ESSENCIAL STORE',headline:'Uma boa escolha\npara o seu dia.',color:'#c2b38c',heroPhoto:0,tagline:'CURADORIA & ATENDIMENTO',promotion:'Nossa seleção\nmerece seu olhar.'},
      {style:'modern-blue',label:'Modern Blue',name:'nexo store',headline:'Novidades que\ncombinam com você.',color:'#376ce0',heroPhoto:1,tagline:'ESCOLHAS PARA SEU DIA',promotion:'Encontre seu\npróximo favorito.'},
      {style:'clean-minimal',label:'Clean Minimal',name:'claro.',headline:'Simples de entender.\nFácil de escolher.',color:'#586b73',heroPhoto:2,tagline:'O ESSENCIAL, BEM FEITO',promotion:'Menos complicação.\nMais possibilidades.'},
      {style:'vibrant-sales',label:'Vibrant Sales',name:'PONTO MAIS',headline:'SEU PRÓXIMO\nBOM NEGÓCIO.',color:'#ac3dc6',heroPhoto:3,tagline:'ESCOLHAS QUE COMBINAM COM VOCÊ',promotion:'Novas escolhas.\nBoas oportunidades.'},
      {style:'elegant-corporate',label:'Elegant Corporate',name:'Atlas & Co.',headline:'Uma parceria\npara ir mais longe.',color:'#637e8b',heroPhoto:0,tagline:'ATENDIMENTO & SOLUÇÕES',promotion:'Um atendimento\nà altura do seu projeto.'},
    ],
    highlights:['Soluções','Novidades','Projetos','Atendimento'],
    products:[['Seleção essencial','Uma opção para sua necessidade.','Sob consulta'],['Linha profissional','Converse sobre as possibilidades.','Sob consulta'],['Kit personalizado','Uma seleção pensada para você.','Sob consulta'],['Novidade da semana','Conheça os detalhes pelo WhatsApp.','Sob consulta'],['Solução completa','Mais facilidade no seu projeto.','Sob consulta'],['Seleção especial','Consulte opções e disponibilidade.','Sob consulta']],
    services:[['Atendimento personalizado','Conte o que você precisa.','Sob consulta'],['Consultoria inicial','Vamos entender suas possibilidades.','Sob consulta'],['Projeto sob medida','Uma proposta para seu objetivo.','Sob consulta'],['Suporte e orientação','Acompanhamento com atenção.','Sob consulta']],
    about:'Acreditamos em relações construídas com atenção e confiança. Escutamos o que você precisa e apresentamos alternativas com clareza, para que cada escolha faça sentido para seu momento.',
    benefits:['Atendimento próximo|Sua necessidade vem primeiro.','Propostas claras|Escolha com informação.','Soluções sob medida|Possibilidades para seu projeto.'],
    heroCta:'Conversar com a equipe',message:'Olá! Gostaria de conhecer suas soluções.',productsTitle:'Uma seleção de possibilidades.',servicesTitle:'Soluções para você.',galleryTitle:'Nosso espaço, nossas ideias.',finalTitle:'Seu próximo passo\ncomeça com uma conversa.',
  },
]

const serviceOrders: SectionKind[][] = [
  ['actions','promotion','services','gallery','about','benefits','hours','location','whatsapp'],
  ['actions','services','promotion','about','gallery','benefits','hours','location','whatsapp'],
  ['actions','services','promotion','gallery','benefits','about','location','hours','whatsapp'],
  ['actions','services','benefits','gallery','about','promotion','hours','location','whatsapp'],
  ['actions','promotion','services','about','gallery','benefits','location','hours','whatsapp'],
]
const productOrders: SectionKind[][] = [
  ['actions','promotion','products','categories','gallery','about','benefits','hours','location','whatsapp'],
  ['actions','categories','products','promotion','gallery','benefits','about','hours','location','whatsapp'],
  ['actions','products','categories','promotion','about','gallery','benefits','hours','location','whatsapp'],
  ['actions','promotion','products','categories','gallery','benefits','about','location','hours','whatsapp'],
  ['actions','categories','products','promotion','gallery','about','benefits','hours','location','whatsapp'],
]
function items(rows: [string, string, string][], photos: string[], highlights: string[]): Item[] {
  return rows.map(([title, description, price], i) => ({ id:`item-${i}`,title,description,price,image:photos[i % photos.length],categoryId:`category-${i % highlights.length}` }))
}
export const additionalTemplates: Template[] = seeds.flatMap(seed => seed.models.slice(0, 3).map((model, index) => {
  const category = additionalCategories.find(c => c.id === seed.id)!
  const photos = seed.photos.map(photo)
  const cover = photos[model.heroPhoto]
  const hasServices = seed.services.length > 0 && seed.id !== 'business'
  const makeSection = (kind: SectionKind, title: string, text = '', extra: Partial<Section> = {}): Section => ({ id:kind,kind,title,text,enabled:true,...extra })
  const all: Record<SectionKind, Section> = {
    testimonials:makeSection('testimonials','Depoimentos'),
    actions:makeSection('actions','A um toque de você.'),
    categories:makeSection('categories',seed.id === 'food' ? 'O que combina com sua fome?' : 'Encontre sua escolha.'),
    promotion:makeSection('promotion',model.promotion,seed.id === 'food' ? 'Seu próximo favorito está aqui. Faça seu pedido.' : seed.id === 'sweets' ? 'Escolha seus sabores e encomende pelo WhatsApp.' : seed.id === 'business' ? 'Confira nossa seleção. Tire suas dúvidas pelo WhatsApp.' : 'Converse com nossa equipe e escolha seu próximo cuidado.',{ image:photos[(model.heroPhoto+1)%photos.length],badge:seed.id === 'food'?'SELEÇÃO DA CASA':seed.id === 'sweets'?'FEITO PARA CELEBRAR':'NOSSO DESTAQUE',ctaLabel:seed.heroCta }),
    services:makeSection('services',seed.servicesTitle),
    products:makeSection('products',seed.productsTitle),
    gallery:makeSection('gallery',seed.galleryTitle),
    about:makeSection('about','Sobre nós',seed.about.split('. ').slice(0,2).join('. ').replace(/\.+$/, '')+'.',{image:photos[(model.heroPhoto+2)%photos.length]}),
    benefits:makeSection('benefits',seed.id === 'auto'?'Confiança em cada etapa.':'O cuidado faz a diferença.'),
    hours:makeSection('hours','Quando nos encontrar.'),
    location:makeSection('location','Venha conhecer de perto.'),
    whatsapp:makeSection('whatsapp',seed.finalTitle,'Conte o que você procura. A gente cuida do próximo passo.',{ctaLabel:seed.heroCta}),
  }
  const bio: Bio = {
    id:`${seed.id}-${model.style}`,style:model.style,name:model.name,category:category.label,
    headline:model.headline,tagline:model.tagline,description:seed.description,color:model.color,cover,logo:'',
    phone:'5511999990000',instagram:'https://www.instagram.com/',
    address:'Rua Exemplo, 128 · Centro\nSão Paulo, SP',
    hours:seed.id === 'food' ? 'Ter a dom: 11h às 22h\nSegunda: fechado' : 'Seg a sex: 9h às 19h\nSábado: 9h às 16h\nDomingo: fechado',
    highlights:seed.highlights.map((label,i)=>({id:`category-${i}`,label,image:photos[i%photos.length]})),
    benefits:seed.benefits,photos:[cover,...photos.filter(p=>p!==cover)].slice(0,4),
    services:items(seed.services,photos,seed.highlights),products:items(seed.products,photos,seed.highlights),
    sections:(hasServices?serviceOrders[index]:productOrders[index]).map(kind=>all[kind]),
    actions:[
      {id:'wa',kind:'whatsapp',label:'WhatsApp',message:seed.message},
      {id:'ig',kind:'instagram',label:'Instagram',message:''},
      {id:'map',kind:'location',label:'Como chegar',message:''},
      {id:'primary',kind:seed.id==='food'||seed.id==='sweets'?'order':seed.id==='auto'||seed.id==='business'?'quote':'booking',label:seed.id==='food'?'Fazer pedido':seed.id==='sweets'?'Encomendar':seed.id==='auto'||seed.id==='business'?'Orçamento':'Agendar',message:seed.message,mode:'whatsapp'},
    ],
  }
  // Optional small showcases are prepared, but do not crowd service-first demos.
  if (hasServices) bio.sections.push({ ...all.products, enabled:false }, { ...all.categories, enabled:false })
  else if (seed.services.length) bio.sections.push({ ...all.services, enabled:false })
  return {id:bio.id,categoryId:seed.id,label:model.label,subtitle:seed.description,icon:category.icon,bio}
}))




