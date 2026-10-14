import type {Bio,Template} from '../types/biosite'
import {essenciaRose} from './essenciaRose'
import {entryTextKey} from '../lib/entryText'
export const jocastryaOriginalId='jocastrya-estetica-original' as const
const photo=(name:string)=>'/images/official-batch-2/jocastrya-'+name+'.webp'
export function jocastryaOriginal(base:Bio):Template{
 const original=essenciaRose(base),id=jocastryaOriginalId
 // Independently scoped records; editing this template cannot mutate Essência Rosé.
 const b=JSON.parse(JSON.stringify(original.bio).replaceAll('essencia-rose-estetica',id)) as Bio
 b.id=id;b.layoutPreset=id;b.name='Jocastrya';b.logo=photo('logo');b.cover=photo('portrait')
 b.headline='Sua beleza\ncom mais\nautenticidade';b.tagline='ESTETICISTA | DESIGNER\nMICROPIGMENTADORA';b.description='Design de Sobrancelhas\ne Micropigmentação'
 delete b.textVisual!.headline!.font
 b.heroVisual={imagePositionX:50,imagePositionY:50,contentWidth:50,overlay:0,logoSize:57}
 b.address='Jacaraípe, Serra - ES';b.phone='';b.instagram='';b.mapsUrl=''
 b.appearance={...b.appearance!,background:'#f3e5dc',panel:'#eeded2',text:'#2e211a',secondary:'#805c47',highlight:'#b57368'};b.color='#b57368'
 const find=(suffix:string)=>b.sections.find(s=>s.id===id+'-'+suffix)!
 find('care').image=photo('care');find('care').visual={...find('care').visual,mediaAspect:168}
 const rows=find('services').content!.items!
 const images=['brows','lamination','lips','pigment','facial','evaluation']
 rows.forEach((item,i)=>item.image=photo(images[i]))
 rows[0].description='Harmonia para o seu olhar, respeitando seu formato natural.'
 rows[2].description='Cor, contorno e mais harmonia para o seu sorriso.'
 rows[3].description='Mais definição, simetria e naturalidade.'
 rows[4].description='Pele mais saudável, luminosa e rejuvenescida.'
 rows[5].title='Avaliação para Botox';rows[5].description='Análise personalizada para o seu rosto.'
 const results=find('results');results.title='Resultados\nque falam por si';results.text='Antes e depois reais\ndas minhas clientes.'
 results.content!.photos=[photo('before'),photo('after')];results.content!.highlights!.forEach((h,i)=>{h.image=photo(i?'after':'before');h.caption='';})
 const about=find('about');about.title='Dra Franciely\nMedeiros';about.text='Sou esteticista, designer de sobrancelhas e micropigmentadora. Meu propósito é realçar a beleza real de cada pessoa, com técnica, cuidado e resultados naturais, sempre valorizando o que você tem de mais bonito.';about.image=photo('portrait');about.visual={...about.visual,contentWidth:53,mediaAspect:110}
 const space=find('space');space.content={photos:[photo('space')]};space.ctaLabel='Ver mais';space.action={id:id+'-space-link',kind:'custom',icon:'external',label:'Ver mais',message:'',destination:'section',sectionId:space.id}
 const contact=find('contact');contact.image=photo('contact')
 for(const suffix of ['benefits','about-benefits']){const s=find(suffix);const old=s.content!.benefits!;const values=suffix==='benefits'?['Resultados|reais','Técnicas|atualizadas','Ambiente|acolhedor','Mais de 3 mil|clientes atendidas']:['Atendimento|personalizado','Técnicas|atualizadas','Ambiente|acolhedor','+ de 3 mil|clientes atendidas'];const entries=s.entryIcons!;s.entryIcons={};values.forEach((v,i)=>s.entryIcons![entryTextKey('benefits',v)]={...entries[entryTextKey('benefits',old[i])],icon:i===0?(suffix==='benefits'?'diamond':'heart'):i===1?(suffix==='benefits'?'shield-check':'diamond'):i===2?'flower':'users',label:v.replace('|','\n')});s.content!.benefits=values}
 find('actions').content!.actions![2].icon='pin'
 b.sections=b.sections.filter(s=>!s.id.endsWith('-footer'))
 return {id,categoryId:'beauty',label:'Jocastrya — Estética Original',subtitle:'Referência original: retrato real, serviços com fotos, resultados e espaço em rosé e nude.',icon:'✦',bio:b}
}
