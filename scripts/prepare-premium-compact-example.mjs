import fs from 'node:fs/promises'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const source=process.argv[2];if(!source)throw Error('Informe o pacote original; somente uma cópia será escrita.')
const original=JSON.parse(await fs.readFile(source,'utf8')),bio=structuredClone(original.design),v=bio.premiumV2
v.page={...v.page,font:'modern',padding:8,wordWrap:'words'}
v.hero.height=420;v.hero.responsive={medium:{height:440},large:{height:460}}
v.hero.photo.box={x:0,y:0,width:100,height:100}
v.hero.logo.box={x:5,y:4,width:34,height:32}
v.hero.texts.find(t=>t.field==='headline').box={x:5,y:45,width:90,height:30}
v.hero.texts.find(t=>t.field==='description').box={x:5,y:78,width:90,height:18}
for(const t of v.hero.texts)if(t.field==='headline')t.type={...t.type,size:36,sizeMedium:39,sizeLarge:42}
const contacts=v.sections.contacts;contacts.button={...contacts.button,padding:4,gap:3,height:94,iconSize:30};for(const b of Object.values(contacts.buttons||{}))Object.assign(b,{padding:4,gap:3,height:94,iconSize:30})
Object.assign(v.sections.values,{cardPadding:5,cardGap:4,icons:['flame','food','delivery','heart'],iconSize:26,iconColor:'#ff8200'})
const menu=bio.sections.find(s=>s.id==='services'),featured=bio.sections.find(s=>s.id==='team')
featured.content.items.push({...structuredClone(menu.content.items[0]),id:'featured-galeto'})
const contact=bio.actions.find(a=>a.id==='hero-contact')
for(const s of [menu,featured]){
 const c=v.sections[s.id];Object.assign(c,{component:'catalog',variant:'compact',columns:3,cardPadding:6,cardGap:5,details:false,imageAspect:125,price:{size:12,sizeMedium:13,sizeLarge:14,weight:700,color:'#ff8200'},button:{layout:'row',height:32,padding:3,gap:2,showIcon:false,surface:{color:'#b44b00',radius:7},label:{size:10,weight:700,color:'#ffffff'}}})
 c.itemTitle={...c.itemTitle,family:'modern',size:11,sizeMedium:12,sizeLarge:13,lineHeight:120};c.itemText={...c.itemText,size:10,lineHeight:130}
 for(const item of s.content.items)item.action={...contact,id:'order-'+s.id+'-'+item.id,label:'Pedir',message:'',url:contact.url+'?text='+encodeURIComponent('Olá! Quero pedir '+item.title)}
}
v.sections.hours.dividerColor='#80400e'
const pack=processPremiumDesign({operation:'export',bio}).package
const dir='docs/kit-autoria-premium-v2/exemplos';await fs.writeFile(dir+'/restaurante-compacto-v2.biosite.json',JSON.stringify(pack,null,2)+'\n')
console.log(JSON.stringify({sourceUntouched:true,sections:bio.sections.length,menuItems:menu.content.items.length,featuredItems:featured.content.items.length,persisted:false}))
