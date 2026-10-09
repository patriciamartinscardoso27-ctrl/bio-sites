import type {Template,Section,Action,Bio} from '../types/biosite'
import {demoLocationImage} from './demoLocationImage'
import {entryTextKey} from '../lib/entryText'
import {remainingRefreshIds,refreshRemainingOriginal} from './originalRefreshStage2'
export const originalRefreshIds=['sweets-candy-pink','auto-tech-blue',...remainingRefreshIds] as const
// Only library seeds opt into this composition. Stored customer Bios are never migrated.
export function refreshOriginal(template:Template):Template{
 if(remainingRefreshIds.some(id=>id===template.id))return refreshRemainingOriginal(template)
 if(!originalRefreshIds.some(id=>id===template.id))return template
 const result=structuredClone(template),b=result.bio,sweet=template.id==='sweets-candy-pink',id=template.id
 b.layoutPreset=id as Bio['layoutPreset'];b.color=sweet?'#9e3656':'#187ba7'
 b.appearance={theme:'light',font:sweet?'serif':'sans',buttons:sweet?'pill':'rounded',cards:'rounded',background:sweet?'#fff9f4':'#f1f5f8',panel:'#ffffff',text:sweet?'#462b2f':'#132c3c',secondary:sweet?'#f1c6b9':'#bce9f5'}
 b.headline=sweet?'Uma celebração.\nUm doce feito para você.':'Precisão no cuidado.\nConfiança no caminho.'
 b.description=sweet?'Bolos e doces artesanais para transformar encontros em boas lembranças.':'Diagnóstico, manutenção e atenção aos detalhes para cuidar do seu carro.'
 // Existing category photographs; no generated imagery.
 b.heroVisual={heroComposition:sweet?'stacked':'split',overlay:35};b.logo=sweet?'/images/lote-seven/refresh-doce-flor.svg':'/images/lote-seven/refresh-nexo-auto.svg'
 const wa=(label:string):Action=>({id:id+'-'+label,kind:'whatsapp',icon:'whatsapp',label,message:sweet?'Olá! Gostaria de consultar uma encomenda.':'Olá! Gostaria de agendar uma avaliação do meu carro.'})
 b.actions=[{...wa(sweet?'Consultar encomenda':'Agendar avaliação'),id:id+'-hero-cta'},{id:id+'-menu',kind:'custom',icon:'menu',label:'Menu',message:'',destination:'section',sectionId:id+(sweet?'-products':'-services')}]
 const sec=(suffix:string,kind:Section['kind'],title:string,extra:Partial<Section>={}):Section=>({id:id+'-'+suffix,kind,title,text:'',enabled:true,...extra})
 const shortcuts=sec('actions','actions','',{content:{actions:[wa('WhatsApp'),{id:id+'-ig',kind:'instagram',label:'Instagram',message:''},{id:id+'-review',kind:'reviews',label:'Avaliar no Google',message:''},{id:id+'-map',kind:'location',label:'Como chegar',message:''}]},visual:{columns:4}})
 b.reviewsUrl='https://www.google.com/search?q='+encodeURIComponent(b.name+' avaliações');b.mapsUrl='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(b.address)
 const items=(sweet?b.products:b.services).slice(0,sweet?4:4).map((item,i)=>({...item,id:id+'-item-'+i,action:{...wa(sweet?'Encomendar':'Consultar serviço'),id:id+'-item-action-'+i,icon:sweet?'cart' as const:'settings' as const}}))
 const showcase=sec(sweet?'products':'services',sweet?'products':'services',sweet?'Escolha o sabor do seu momento.':'O cuidado certo para cada necessidade.',{text:'Fotos e valores demonstrativos. Consulte disponibilidade.',layout:'three',content:{items},visual:{columns:sweet?2:1}})
 const categories=sec(sweet?'categories':'process','categories',sweet?'Cada ocasião merece um carinho.':'Do diagnóstico à entrega.',{content:{highlights:(sweet?['Aniversários','Presentes','Para compartilhar']:['01 · Avaliação','02 · Orçamento','03 · Serviço','04 · Entrega']).map((label,i)=>({id:id+'-highlight-'+i,label,caption:sweet?'Converse sobre sua encomenda.':['Entendemos o que seu carro precisa.','Você aprova antes do serviço.','Cuidado e atenção aos detalhes.','Orientação para seguir com confiança.'][i],image:sweet?b.photos[i%b.photos.length]:'',action:{...wa(label),id:id+'-highlight-action-'+i}}))}})
 const banner=sec('promotion','promotion',sweet?'Pequenos detalhes.\nGrandes lembranças.':'Seu carro em boas mãos.',{text:sweet?'Escolha sabores e combinações com um atendimento próximo.':'Converse com nossa equipe sobre revisão e manutenção.',badge:sweet?'FEITO PARA CELEBRAR':'MANUTENÇÃO COM TRANSPARÊNCIA',image:sweet?b.photos[1]:b.photos[1],ctaLabel:sweet?'Planejar minha encomenda':'Solicitar orçamento',action:wa(sweet?'Planejar minha encomenda':'Solicitar orçamento')})
 const about=sec('about','about',sweet?'Da nossa cozinha para a sua história.':'Técnica, clareza e atendimento próximo.',{text:template.bio.sections.find(s=>s.kind==='about')?.text||'',image:b.photos[2]})
 const benefits=sec('benefits','benefits',sweet?'O cuidado que faz diferença.':'Confiança em cada etapa.',{content:{benefits:b.benefits}})
 benefits.entryIcons=Object.fromEntries(b.benefits.map((value,i)=>[entryTextKey('benefits',value),{id:id+'-benefit-'+i,kind:'custom',icon:(['gift','shield-check','heart'] as const)[i%3],label:value,message:'',iconColorMode:'custom',visual:{iconColor:b.color}}]))
 const gallery=sec('gallery','gallery',sweet?'Um pouco do nosso atelier.':'Conheça nosso espaço.',{content:{photos:b.photos.slice(0,3)},action:{id:id+'-gallery-action',kind:'instagram',label:'Ver no Instagram',message:''},ctaLabel:'Ver no Instagram'})
 const reviews=sec('reviews','testimonials',sweet?'Boas lembranças compartilhadas.':'Quem confia, recomenda.',{text:template.bio.sections.find(s=>s.kind==='testimonials')?.text||'',content:{photos:['/images/lote-seven/flora-boutique-review-0.webp','/images/lote-seven/casa-estilo-review-1.webp']}})
 const hours=sec('hours','hours','Horários de atendimento',{content:{hours:b.hours}})
 const location=sec('location','location',sweet?'Venha nos conhecer.':'Encontre a NEXO AUTO.',{image:demoLocationImage,content:{address:b.address,mapsUrl:b.mapsUrl},ctaLabel:'Como chegar'})
 const closing=sec('closing','whatsapp',sweet?'Vamos adoçar seu próximo encontro?':'Pronto para cuidar do seu carro?',{text:sweet?'Conte a ocasião. A gente ajuda a escolher.':'Tire suas dúvidas e combine o melhor horário.',action:wa(sweet?'Conversar sobre encomenda':'Agendar atendimento'),ctaLabel:sweet?'Conversar sobre encomenda':'Agendar atendimento'})
 const identity=sec('identity','about','',{block:'text'}),social=sec('social','actions','',{layout:'inline',content:{actions:[shortcuts.content!.actions![1],shortcuts.content!.actions![0],shortcuts.content!.actions![3]]}}),copyright=sec('copyright','about','',{block:'text',text:'Demonstração · '+b.name+' · Conteúdo personalizável.'})
 b.sections=sweet?[shortcuts,showcase,categories,banner,about,benefits,gallery,reviews,hours,location,closing,identity,social,copyright]:[shortcuts,categories,showcase,benefits,banner,about,gallery,reviews,hours,location,closing,identity,social,copyright]
 b.products=[];b.services=[];b.highlights=[];b.photos=[];b.benefits=[]
 return result
}
