import fs from 'node:fs/promises'
import '../server/source-modules.mjs'
const {v2SectionProperties}=await import('../src/lib/premiumVisualV2.ts')
const base=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium/contrato.schema.json',import.meta.url),'utf8'))
const ref=k=>({$ref:'#/$defs/'+k}),num=(minimum,maximum)=>({type:'integer',minimum,maximum}),en=values=>({enum:values}),str={type:'string',maxLength:200},obj=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false}),arr=(items,maxItems)=>({type:'array',items,maxItems})
const color={type:'string',pattern:'^#[0-9a-fA-F]{6}$'},box=obj({x:num(0,100),y:num(0,100),width:num(1,100),height:num(1,100)},['x','y','width','height'])
const position=obj({x:num(0,100),y:num(0,100)},['x','y']),responsiveBox=obj({medium:ref('v2Box'),large:ref('v2Box')})
const type=obj({family:en(['sans','serif','condensed','modern']),size:num(8,72),sizeMedium:num(8,72),sizeLarge:num(8,72),weight:num(300,900),lineHeight:num(100,240),letterSpacing:num(0,20),color,align:en(['left','center','right'])})
const gradient={oneOf:[{type:'string',maxLength:240,description:'Same constrained linear-gradient grammar as V1; runtime validation required.'},obj({angle:num(-360,360),stops:{...arr(obj({color,at:num(0,100),opacity:num(0,100)},['color','at']),6),minItems:2}},['angle','stops'])]}
const surface=obj({color,gradient:ref('v2Gradient'),borderColor:color,borderWidth:num(0,8),radius:num(0,64),shadow:en(['none','soft','strong'])})
const button=obj({surface:ref('v2Surface'),iconSurface:ref('v2Surface'),iconColor:color,iconSize:num(12,56),label:ref('v2Type'),caption:ref('v2Type'),layout:en(['tile','row','inline']),height:num(32,160),padding:num(0,24),gap:num(0,24),showIcon:{type:'boolean'}})
const layer={oneOf:[obj({kind:{const:'image'},source:{type:'string',pattern:'^(cover|image|photo\\.[0-9]+)$'},fit:en(['cover','contain']),position,box:ref('v2Box'),opacity:num(0,100)},['kind','source']),obj({kind:{const:'gradient'},value:ref('v2Gradient'),box:ref('v2Box'),opacity:num(0,100)},['kind','value']),obj({kind:{const:'solid'},color,box:ref('v2Box'),opacity:num(0,100)},['kind','color'])]}
const media=obj({box:ref('v2Box'),fit:en(['cover','contain']),position,responsive:responsiveBox},['box'])
const textRegion=obj({field:en(['name','headline','tagline','description']),box:ref('v2Box'),type:ref('v2Type'),responsive:responsiveBox},['field','box'])
const hero=obj({version:{const:1},height:num(240,1000),surface:ref('v2Surface'),layers:arr(ref('v2Layer'),6),photo:ref('v2Media'),logo:ref('v2Media'),texts:arr(ref('v2TextRegion'),4),cta:obj({actionId:str,box:ref('v2Box'),button:ref('v2Button')},['actionId','box']),responsive:obj({medium:obj({height:num(240,1000)},['height']),large:obj({height:num(240,1000)},['height'])})},['version','height','texts'])
const props={cardPadding:num(0,32),cardGap:num(0,24),icons:arr(en(['flame','food','delivery','heart','star','check','leaf','shield-check']),100),iconSize:num(12,56),iconColor:color,dividerColor:color,surface:ref('v2Surface'),heading:ref('v2Type'),text:ref('v2Type'),padding:num(0,80),gap:num(0,48),columns:num(1,4),responsive:obj({medium:obj({columns:num(1,4),gap:num(0,48),padding:num(0,80)}),large:obj({columns:num(1,4),gap:num(0,48),padding:num(0,80)})}),button:ref('v2Button'),buttons:{type:'object',additionalProperties:ref('v2Button')},layers:arr(ref('v2Layer'),6),height:num(120,800),mediaWidth:num(20,80),imageAspect:num(40,300),imageFit:en(['cover','contain']),imagePosition:position,cardSurface:ref('v2Surface'),itemTitle:ref('v2Type'),itemText:ref('v2Type'),price:ref('v2Type'),details:{type:'boolean'},images:arr(obj({index:num(0,499),aspect:num(40,300),span:num(1,4),fit:en(['cover','contain']),position},['index']),100),comparison:obj({before:num(0,499),after:num(0,499),beforeLabel:{type:'string',maxLength:40},afterLabel:{type:'string',maxLength:40}},['before','after'])}
const defs={v2Box:box,v2Type:type,v2Gradient:gradient,v2Surface:surface,v2Button:button,v2Layer:layer,v2Media:media,v2TextRegion:textRegion,v2Hero:hero}
const variants={catalog:['vertical','horizontal','overlay','compact'],gallery:['grid','featured','before-after'],profiles:['vertical','overlay','compact'],text:['split','stacked'],location:['split','stacked']}
for(const [component,keys] of Object.entries(v2SectionProperties)){
 const properties={version:{const:1},component:{const:component},...Object.fromEntries(['surface','heading','text','padding','gap',...keys].map(k=>[k,k==='variant'?en(variants[component]):props[k]]))}
 defs['v2Section_'+component]=obj(properties,['version','component'])
}
defs.v2Section={oneOf:Object.keys(v2SectionProperties).map(k=>ref('v2Section_'+k))}
defs.premiumV2=obj({version:{const:2},page:obj({surface:ref('v2Surface'),font:en(['sans','serif','condensed','modern']),maxWidth:num(320,1200),gap:num(0,60),padding:num(0,40),wordWrap:en(['words'])}),hero:ref('v2Hero'),sections:{type:'object',maxProperties:500,additionalProperties:ref('v2Section')}},['version','page','sections'])
for(const name of ['layoutPreset','renderMode','composition','heroVisual','heroLayout','designVisual','textVisual','appearance','identity'])delete base.$defs.design.properties[name]
base.$defs.design.properties.premiumV2=ref('premiumV2');base.$defs.design.required.push('premiumV2')
for(const name of ['section','item','action'])for(const k of ['visual','titleVisual','layout','block','entryIcons','entryTextOptions','video','appearanceMode','iconColorMode'])delete base.$defs[name].properties[k]
delete base.$defs.section.allOf
const allowedTextVisual=['text','fontSize','font','weight','align','lineHeight','letterSpacing','fontWeight','textStyle']
defs.v2EditableVisual=obj(Object.fromEntries(allowedTextVisual.map(k=>[k,base.$defs.visual.properties[k]])))
for(const value of Object.values(base.$defs.textOptions.properties))value.properties.visual=ref('v2EditableVisual')
Object.assign(base.$defs,defs)
base.title='Bio-Sites Premium V2 — structural authoring schema'
base.properties.schemaVersion={const:2}
base.properties.renderer=obj({id:{const:'biosite'},version:{const:2},profile:{const:'premium'}},['id','version','profile'])
base.properties.components=arr(obj({id:en(['hero.premium',...Object.keys(v2SectionProperties).map(k=>'section.'+k)]),version:{const:1}},['id','version']),11)
base.$comment='Cross-field checks (bindings, component-kind, visual property applicability, box boundaries, sorted stops, inventories, UUID, links) require the real runtime validator. No arbitrary code.'
const dir=new URL('../docs/kit-autoria-premium-v2/',import.meta.url)
await fs.mkdir(dir,{recursive:true});await fs.writeFile(new URL('contrato-v2.schema.json',dir),JSON.stringify(base,null,2)+'\n')
console.log('V2 schema generated; apply the real importer for semantic validation.')
