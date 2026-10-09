import type {Action,Bio,GenericIcon,Section,Template} from '../types/biosite'
import {entryTextKey} from '../lib/entryText'
import {demoLocationImage} from './demoLocationImage'
export const remainingOriginalIds=['fashion-boutique-gold','fashion-fashion-pink','fashion-clean-nude','barber-black-gold','barber-vintage-barber','barber-urban-street','beauty-rose-gold','beauty-nude-elegance','beauty-luxury-black','food-gourmet-dark','food-fast-food-red','food-rustic-kitchen','sweets-chocolate-premium','sweets-clean-patisserie','auto-auto-premium','auto-performance-red','business-business-premium','business-modern-blue','business-clean-minimal'] as const
// Groups become active only after the preceding group has passed its focused checks.
export const remainingRefreshIds=remainingOriginalIds.slice(0,19)
type Recipe={hero:string;catalog:string;gallery:string;order:string[];paper:string;ink:string;accent:string;panel:string;shape:string;font:'sans'|'serif'|'condensed';banner:string}
const design=(hero:string,catalog:string,gallery:string,order:string,paper:string,ink:string,accent:string,panel:string,shape:string,font:Recipe['font'],banner:string):Recipe=>({hero,catalog,gallery,order:order.split(' '),paper,ink,accent,panel,shape,font,banner})
export const refreshDesigns:Record<string,Recipe>={
 'fashion-boutique-gold':design('cinema','editorial','triptych','catalog banner categories about gallery benefits reviews','#111411','#f6f1e8','#cbb17a','#222820','soft','serif','split'),
 'fashion-fashion-pink':design('poster','feature','collage','categories catalog benefits banner gallery about reviews','#fff8fb','#442238','#af2165','#ffe5f0','round','sans','solid'),
 'fashion-clean-nude':design('framed','lookbook','diptych','about catalog categories gallery banner benefits reviews','#f7f2ea','#403b30','#766043','#ede4d7','soft','serif','split'),
 'barber-black-gold':design('portrait','menu','triptych','catalog benefits banner about gallery reviews','#111617','#f7f5ec','#c7ae74','#222a2c','square','sans','photo'),
 'barber-vintage-barber':design('masthead','rows','film','about catalog banner gallery benefits reviews','#f7eee0','#39291f','#7d412f','#edddc6','soft','serif','split'),
 'barber-urban-street':design('diagonal','feature','collage','catalog banner categories gallery benefits about reviews','#121716','#f3f6ee','#c5e064','#25302a','square','condensed','solid'),
 'beauty-rose-gold':design('overlap','grid','diptych','categories catalog about benefits banner gallery reviews','#fff6f0','#503b35','#995540','#f5e0d5','round','serif','split'),
 'beauty-nude-elegance':design('side','menu','film','about catalog benefits gallery banner reviews','#f7f4ed','#494237','#75674e','#e9e4d8','soft','serif','solid'),
 'beauty-luxury-black':design('cinema','feature','triptych','catalog categories banner benefits about gallery reviews','#151214','#fbf1e9','#d7aa8e','#2c252a','round','serif','photo'),
 'food-gourmet-dark':design('framed','editorial','film','about catalog banner benefits gallery reviews','#181915','#f3eee5','#d2b486','#2a2c22','soft','serif','split'),
 'food-fast-food-red':design('poster','grid','triptych','catalog categories banner benefits gallery about reviews','#fff6ed','#40231e','#bd2f22','#ffe1cb','round','condensed','solid'),
 'food-rustic-kitchen':design('masthead','menu','collage','catalog about benefits banner gallery reviews','#faf1e1','#493523','#875033','#ecdfc9','soft','serif','photo'),
 'sweets-chocolate-premium':design('portrait','editorial','diptych','catalog banner about gallery benefits reviews','#241911','#fff3e5','#d7ad76','#3c2b20','soft','serif','split'),
 'sweets-clean-patisserie':design('side','lookbook','triptych','about catalog categories banner gallery benefits reviews','#fffdf7','#484237','#7b6748','#f1ece0','soft','serif','solid'),
 'auto-auto-premium':design('overlap','rows','diptych','catalog categories benefits about banner gallery reviews','#edf2f5','#172b39','#365f78','#dce7ef','soft','sans','split'),
 'auto-performance-red':design('diagonal','menu','film','catalog banner benefits categories gallery about reviews','#13171b','#f4f5f5','#f3776f','#252d34','square','condensed','photo'),
 'business-business-premium':design('framed','feature','triptych','about catalog benefits banner gallery reviews','#f6f3ea','#373c32','#68704b','#e7e8d9','soft','serif','split'),
 'business-modern-blue':design('overlap','grid','collage','catalog categories benefits banner about gallery reviews','#f1f6ff','#213953','#245cb7','#dfeafb','round','sans','solid'),
 'business-clean-minimal':design('masthead','rows','diptych','about benefits catalog gallery banner reviews','#fafbf9','#343e3b','#4d6960','#edf1eb','square','sans','split'),
}
export function refreshRemainingOriginal(template:Template):Template{
 if(!remainingRefreshIds.some(id=>id===template.id))return template
 const result=structuredClone(template),b=result.bio,id=template.id,d=refreshDesigns[id],cat=template.categoryId,service=['barber','beauty','auto','business'].includes(cat),key=service?'services':'products',source=template.bio
 b.layoutPreset=id as Bio['layoutPreset'];b.color=d.accent;b.appearance={theme:d.paper.startsWith('#1')||d.paper==='#241911'?'dark':'light',background:d.paper,text:d.ink,panel:d.panel,secondary:d.panel,font:d.font,buttons:d.shape==='square'?'square':'rounded',cards:d.shape==='square'?'square':'rounded'}
 b.logo='/images/lote-seven/refresh-'+id+'.svg';b.heroVisual={overlay:35};b.textVisual={}
 if(d.hero==='side')b.textVisual.name={fontSize:24}
 b.reviewsUrl='https://www.google.com/search?q='+encodeURIComponent(b.name+' avaliações');b.mapsUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.address)
 const cta=cat==='fashion'?'Encontrar meu próximo look':cat==='barber'?'Agendar meu horário':cat==='beauty'?'Agendar meu cuidado':cat==='food'?'Fazer meu pedido':cat==='sweets'?'Consultar encomenda':cat==='auto'?'Solicitar avaliação':'Conversar com a equipe'
 const wa=(label:string,suffix=label):Action=>({id:id+'-'+suffix,kind:'whatsapp',icon:'whatsapp',label,message:'Olá! Gostaria de mais informações sobre '+label+'.'})
 const jump=(suffix:string,label:string):Action=>({id:id+'-jump-'+suffix+'-'+label,kind:'custom',icon:'external',label,message:'',destination:'section',sectionId:id+'-'+suffix})
 const s=(suffix:string,kind:Section['kind'],title:string,extra:Partial<Section>={}):Section=>({id:id+'-'+suffix,kind,title,text:'',enabled:true,...extra})
 b.actions=[wa(cta,'hero-cta'),{...jump(key,'Menu'),id:id+'-menu',icon:'menu'}]
 const shortcut=s('actions','actions','',{layout:'four',content:{actions:[wa('WhatsApp','shortcut-wa'),{id:id+'-ig',kind:'instagram',label:'Instagram',message:''},{id:id+'-review',kind:'reviews',label:'Avaliar no Google',message:''},{id:id+'-map',kind:'location',label:'Como chegar',message:''}]},visual:{columns:4}})
 const catalogue=s(key,key,source.sections.find(v=>v.kind===key)?.title||'Nossa seleção',{text:'Imagens e valores demonstrativos. Consulte disponibilidade.',layout:'three',content:{items:source[key].slice(0,cat==='beauty'?6:cat==='fashion'||cat==='food'||cat==='sweets'?6:4).map((item,i)=>({...item,id:id+'-item-'+i,action:{...wa(service?'Consultar serviço':'Consultar item','item-action-'+i),icon:service?'calendar-check':'cart'}}))}})
 const categories=s('categories','categories',cat==='fashion'?'Escolhas para seu estilo.':cat==='beauty'?'Encontre seu momento de cuidado.':cat==='barber'?'Cuidado do seu jeito.':cat==='food'?'Qual é a sua vontade?':cat==='sweets'?'Pequenos prazeres, feitos à mão.':cat==='auto'?'Cuidado de ponta a ponta.':'Possibilidades para seu projeto.',{content:{highlights:source.highlights.map((h,i)=>({...h,id:id+'-category-'+i,caption:'',action:jump(key,h.label)}))},action:jump(key,'Ver opções'),ctaLabel:'Ver opções'})
 const promo=source.sections.find(v=>v.kind==='promotion')!,banner=s('banner','promotion',promo.title,{text:promo.text,badge:promo.badge||source.tagline,image:promo.image||source.photos[1],ctaLabel:promo.ctaLabel||cta,action:wa(promo.ctaLabel||cta,'banner-action')})
 const aboutSource=source.sections.find(v=>v.kind==='about')!,about=s('about','about',aboutSource.title,{text:aboutSource.text,image:aboutSource.image||source.photos[2]})
 const benefits=s('benefits','benefits',cat==='auto'?'Clareza para decidir. Cuidado para seguir.':cat==='beauty'?'Atenção em cada detalhe.':cat==='barber'?'Mais que um atendimento.':cat==='food'?'O sabor começa no cuidado.':'Detalhes que fazem diferença.',{content:{benefits:source.benefits},entryIcons:{}})
 const icons:GenericIcon[]=cat==='barber'?['scissors','calendar','shield-check']:cat==='beauty'?['heart','beauty','flower']:cat==='food'?['food','bag','heart']:cat==='auto'?['settings','shield-check','message']:['check','heart','gift'];source.benefits.forEach((v,i)=>benefits.entryIcons![entryTextKey('benefits',v)]={id:id+'-benefit-'+i,kind:'custom',icon:icons[i%3],label:v,message:'',iconColorMode:'custom',visual:{iconColor:d.accent}})
 const gallery=s('gallery','gallery',source.sections.find(v=>v.kind==='gallery')?.title||'Um pouco do nosso universo.',{content:{photos:source.photos.slice(0,d.gallery==='diptych'?2:4)},action:{id:id+'-gallery-action',kind:'instagram',label:'Ver no Instagram',message:''},ctaLabel:'Ver no Instagram'})
 const reviews=s('reviews','testimonials',cat==='food'||cat==='sweets'?'Boas experiências à mesa.':'Quem conhece, recomenda.',{text:source.sections.find(v=>v.kind==='testimonials')?.text||'',content:{photos:['/images/lote-seven/flora-boutique-review-0.webp','/images/lote-seven/casa-estilo-review-1.webp']}})
 const hours=s('hours','hours','Horários de atendimento',{content:{hours:b.hours}}),location=s('location','location','Venha nos conhecer.',{image:demoLocationImage,content:{address:b.address,mapsUrl:b.mapsUrl},ctaLabel:'Como chegar'})
 const closing=s('closing','whatsapp',source.sections.find(v=>v.kind==='whatsapp')?.title||'Vamos conversar?',{text:cat==='food'?'Escolha seu pedido e consulte as opções de retirada.':cat==='auto'?'Conte o que seu carro precisa e combine uma avaliação.':cat==='barber'||cat==='beauty'?'Escolha seu cuidado e combine o melhor horário.':'Conte o que você procura. Nossa equipe ajuda a escolher.',action:wa(cta,'closing-action'),ctaLabel:cta})
 const identity=s('identity','about','',{block:'text'}),social=s('social','actions','',{layout:'inline',content:{actions:shortcut.content!.actions!.filter(a=>a.kind!=='reviews')}}),copyright=s('copyright','about','',{block:'text',text:'Demonstração · '+b.name+' · Conteúdo personalizável.'})
 const sections:Record<string,Section>={catalog:catalogue,categories,banner,about,benefits,gallery,reviews};b.sections=[shortcut,...d.order.map(k=>sections[k]),hours,location,closing,identity,social,copyright]
 b.products=[];b.services=[];b.highlights=[];b.photos=[];b.benefits=[]
 return result
}

