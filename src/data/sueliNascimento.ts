import type {Bio,Template,Action,GenericIcon} from '../types/biosite'
import {essenciaRose} from './essenciaRose'
import {section} from './officialBeautyModels'
import {entryTextKey} from '../lib/entryText'
import {sueliApprovedVisual} from './sueliApprovedVisual'
export const sueliNascimentoId='sueli-nascimento' as const
const photo=(name:string)=>'/images/sueli-nascimento/'+name+'.webp'
export function sueliNascimento(base:Bio):Template{
 const id=sueliNascimentoId
 const b=JSON.parse(JSON.stringify(essenciaRose(base).bio).replaceAll('essencia-rose-estetica',id)) as Bio
 Object.assign(b,{id,layoutPreset:id,name:'Sueli Nascimento',category:'Beleza & Estilo',logo:'/images/sueli-nascimento/logo.svg',cover:photo('salon'),headline:'Sua beleza\nem cada\ndetalhe ♡',tagline:'BELEZA & ESTILO',description:'CUIDANDO DE VOCÊ\nCOM PROFISSIONALISMO\nE RESULTADOS REAIS.',address:'Serra - ES',color:'#efad96',appearance:{theme:'dark',font:'sans',buttons:'rounded',cards:'rounded',background:'#100b07',panel:'#f0cbbb',text:'#f9e6d8',secondary:'#352018',highlight:'#efad96',border:'#c99983'},identity:{brandColors:['#100b07','#efad96','#f0cbbb','#352018']},textVisual:{name:{font:'serif',fontSize:25,weight:'regular'},headline:{font:'serif',fontSize:31,textStyle:'italic',weight:'regular'},description:{fontSize:11}},heroVisual:{imagePositionX:50,imagePositionY:50,overlay:45,contentWidth:100,logoSize:90}})
 b.category='Salão / Estética'
 b.phone='5527998566593'
 b.instagram='https://www.instagram.com/studiosuelinascimento/'
 const find=(suffix:string)=>b.sections.find(s=>s.id===id+'-'+suffix)!
 const anchor=(suffix:string,label:string):Action=>({id:id+'-link-'+suffix,kind:'custom',icon:'external',label,message:'',destination:'section',sectionId:id+'-'+suffix})
 const book=(suffix:string,label:string):Action=>({id:id+'-'+suffix,kind:'booking',icon:'external',label,message:'Olá! Gostaria de agendar um horário no SN Studio.',mode:'whatsapp'})
 find('actions').content!.actions!.forEach((a,i)=>{a.visual={background:'#211610',textColor:'#fff3e9',iconColor:'#efad96'};a.subtitle=['Fale conosco','Nos siga','Ver no mapa','horário'][i];if(i===3)a.label='Agende seu'})
 const booking=find('booking');booking.title='NOSSOS SERVIÇOS';booking.text='Conheça tudo que temos para você.';booking.action={...anchor('services','Nossos serviços'),icon:'cart'}
 const care=find('care');care.title='Spa Express\nMãos & Pés';care.text='Um momento de cuidado\nque você merece.';care.image=photo('spa');care.ctaLabel='Ver serviços';care.action=anchor('services','Ver serviços')
 const services=find('services');services.text='Beleza, cuidado e bem-estar em um só lugar.'
 const cats=[['Todos','all'],['Unhas','nails'],['Cabelos','hair'],['Spa dos Pés','feet'],['Mais','brows']]
 services.content={actions:cats.map(([label,key])=>({...anchor('services',label),id:id+'-category-'+key})),items:[['Unhas em Gel','Beleza, durabilidade\ne um acabamento impecável.','nails'],['Spa dos Pés','Um momento de cuidado\ne relaxamento para você.','feet'],['Tratamentos Capilares','Saúde, brilho e\ntransformação para\nos seus cabelos.','hair'],['Design de Sobrancelhas','Mais harmonia para\no seu olhar.','brows']].map(([title,description,key],i)=>({id:id+'-service-'+i,title,description,price:'',image:photo(key),categoryId:id+'-category-'+key,action:book('service-'+i+'-cta','Saiba mais')}))}
 const serviceBanner=section(id+'-service-banner','promotion','Cada detalhe\nfaz a diferença! ♡',{text:'Unhas, cabelos, spa dos pés e muito mais.\nTudo para realçar a sua beleza.',image:photo('banner'),ctaLabel:'Agende seu horário',action:book('services-book','Agende seu horário')})
 const results=find('results');results.title='Resultados Reais';results.text='Beleza que transforma e valoriza você.'
 const resultImages=['before','after','result-nails','brow-before','brow-after','feet-before','feet-after']
 results.content={photos:resultImages.map(photo),highlights:resultImages.map((key,i)=>({id:id+'-result-'+i,label:[ 'Antes','Depois','','','','Antes','Depois'][i],image:photo(key),caption:''})),actions:[['Todos','all'],['Cabelos','hair'],['Unhas','nails'],['Sobrancelhas','brows'],['Mais','feet']].map(([label,key])=>({...anchor('results',label),id:id+'-result-category-'+key}))}
 const resultBanner=section(id+'-result-banner','promotion','Transformação\nde verdade',{text:'Mais autoestima, beleza\ne confiança todos os dias.',image:photo('result-banner'),ctaLabel:'Ver mais resultados',action:anchor('results','Ver mais resultados')})
 const about=find('about');about.kind='about';about.title='Sobre Nós';about.subtitle='';about.text='Acreditamos que a beleza vai além da estética. Aqui é um espaço de cuidado, autoestima e bem-estar. Trabalhamos com dedicação para o seu melhor resultado, sempre com atendimento personalizado e produtos de qualidade.';about.image=photo('about');about.ctaLabel='';delete about.action
 about.visual={mediaPlacement:'right',text:'#f9e6d8'}
 find('actions').content!.actions![2].icon='pin'
 const benefits=find('about-benefits');const entries:[string,GenericIcon][]=[['Atendimento|personalizado','diamond'],['Ambiente|acolhedor','heart'],['Produtos|de qualidade','leaf'],['Sua beleza|é prioridade','users']];benefits.content={benefits:entries.map(([v])=>v)};benefits.entryIcons={};entries.forEach(([value,icon],i)=>benefits.entryIcons![entryTextKey('benefits',value)]={id:id+'-benefit-'+i,kind:'custom',icon,label:value,message:''})
 const space=find('space');space.content={photos:[photo('space'),photo('salon')]};space.action=anchor('space','Ver mais');space.ctaLabel='Ver mais'
 const location=find('location');location.image='';location.text='';const contact=find('contact');contact.title='Agende seu\nhorário agora!';contact.text='Seu momento de beleza\nte espera.';contact.image=photo('salon')
 b.sections=[find('actions'),booking,care,services,serviceBanner,results,resultBanner,about,benefits,space,find('hours'),location,contact]
 b.photos=[photo('portrait')]
 b.sections.unshift(section(id+'-portrait','gallery','Retrato da profissional',{content:{photos:[photo('portrait')]}}))
 b.sections.find(s=>s.id===id+'-contact')!.action={...book('contact-book','Agendar pelo WhatsApp'),icon:'whatsapp'}
 b.address='';b.mapsUrl=''
 find('location').enabled=true
 find('actions').content!.actions![2].enabled=true
 return {id,categoryId:'beauty',label:'Sueli Nascimento — Beleza & Estilo',subtitle:'SN Studio · Preto, rosé e pêssego. Serviços, resultados reais e nosso espaço.',icon:'✦',bio:b}
}

/** Approved visual seed; each use creates an independent editable snapshot. */
export function sueliReusable(_base:Bio):Template{
 const b=structuredClone(sueliApprovedVisual)
 const template:Template={id:sueliNascimentoId,categoryId:'beauty',label:'Beleza Premium — SN Studio',subtitle:'Referência Sueli Nascimento: salão, retrato oval, serviços rosé, resultados e espaço.',icon:'✦',bio:b}
 template.previewBio=structuredClone(b)
 template.bio=structuredClone(template.previewBio)
 return template
}
