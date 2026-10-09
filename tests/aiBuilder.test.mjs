import test from 'node:test'
import assert from 'node:assert/strict'
import {createGeminiVisionProvider,createVisionService} from '../server/vision-reference.mjs'
import {validateBio} from '../server/validation.mjs'
const {composeReference,normalizeReferenceSpec,defaultReferenceSpec}=await import('../src/lib/referenceDesign.ts')
const {sectionContent}=await import('../src/lib/sections.ts')
const {cropGeometry,cropOutputSize}=await import('../src/lib/imageCrop.ts')
const {visualStyles}=await import('../src/lib/visualStyles.ts')
const preferences={name:'Loja da Ana',categoryId:'fashion',goal:'products',style:'modern',theme:'any',density:'balanced'}
const spec={...defaultReferenceSpec,hero:'full',actionTypes:['whatsapp','instagram','location','catalog'],actionSize:68,productCount:6,serviceCount:0,galleryCount:6,productLayout:'three',sections:['actions','products','gallery','location'],sectionOrder:['actions','products','gallery','location'],pageBackground:'#101719',pageText:'#ffffff',panelColor:'#182125',sectionVisuals:[{kind:'products',visual:{paddingX:12,paddingY:18,gap:8,mediaHeight:150}}]}

test('image composition preserves four large ordered actions, 3x2 showcase, palette, section order and category',()=>{
 const bio=composeReference(preferences,'image:0',spec);validateBio(bio)
 assert.deepEqual(bio.actions.map(a=>a.kind),['whatsapp','instagram','location','custom'])
 assert(bio.actions.every(a=>a.visual.iconSize===68));assert.equal(bio.appearance.background,'#101719')
 assert.deepEqual(bio.sections.filter(s=>s.enabled).map(s=>s.kind),['actions','products','gallery','location'])
 const products=bio.sections.find(s=>s.kind==='products');assert.equal(products.layout,'three');assert.equal(sectionContent(bio,products).items.length,6);assert.equal(products.visual.gap,8)
 assert.equal(bio.photos.length,6);assert.equal(bio.actions[3].sectionId,products.id);assert(!JSON.stringify(bio.products).match(/barba|corte masculino/i))
 const saved=JSON.parse(JSON.stringify(bio));validateBio(saved);assert.deepEqual(saved,JSON.parse(JSON.stringify(bio)))
})

test('new visual properties validate on server, remain optional for existing data, reject invalid dimensions',()=>{
 const bio=composeReference(preferences,'visual:0',spec),s=bio.sections[0];s.visual={paddingX:20,paddingY:24,minHeight:250,mediaHeight:160,borderWidth:2,borderStyle:'solid',gap:12}
 validateBio(bio);const style=visualStyles(s.visual);assert.equal(style.paddingInline,20);assert.equal(style.minHeight,250);assert.equal(style['--section-media-height'],'160px');assert.equal(style.borderStyle,'solid')
 s.visual.paddingX=-1;assert.throws(()=>validateBio(bio));s.visual.paddingX=101;assert.throws(()=>validateBio(bio));delete s.visual;validateBio(bio)
 const clean=normalizeReferenceSpec({...spec,actionTypes:['whatsapp','unknown','javascript:bad'],productCount:999,sectionVisuals:[{kind:'products',visual:{paddingX:999,background:'url(unsafe)',gap:8,sql:'DROP'}}]});assert.deepEqual(clean.actionTypes,['whatsapp']);assert.equal(clean.productCount,undefined);assert.deepEqual(clean.sectionVisuals[0].visual,{gap:8})
})

test('Portuguese description uses the same Gemini provider/schema and quota as image analysis',async()=>{
 let calls=0
 const provider=createGeminiVisionProvider({key:'fake-test-key',fetchImpl:async(url,options)=>{calls++;const body=JSON.parse(options.body),parts=body.contents[0].parts;assert(url.includes('gemini-3.5-flash-lite'));assert(!parts.some(p=>p.inlineData));assert.equal(options.headers['x-goog-api-key'],'fake-test-key');assert(parts[0].text.includes('preto com dourado'));assert(parts[0].text.includes('barber'));assert(body.generationConfig.responseJsonSchema.properties.actionTypes);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify({...spec,serviceCount:6,productCount:0,serviceLayout:'three',sections:['actions','services','location'],sectionOrder:['actions','services','location'],palette:{primary:'#101719',accent:'#c9a66b'}})}]}}]})}})
 const service=createVisionService({getProvider:async()=>provider}),request={description:'Barbearia premium, preto com dourado, quatro botões grandes e seis serviços.',categoryId:'barber'}
 const result=await service.analyze(request,'admin');const bio=composeReference({...preferences,categoryId:'barber',goal:'bookings'},'description:0',result.spec);validateBio(bio);assert.equal(sectionContent(bio,bio.sections.find(s=>s.kind==='services')).items.length,6)
 for(let i=0;i<2;i++)await service.analyze(request,'admin');await assert.rejects(service.analyze(request,'admin'),e=>e.status===429);assert.equal(calls,3)
 for(const invalid of [{description:'short',categoryId:'barber'},{...request,categoryId:'unknown'},{...request,description:'x'.repeat(6001)},{...request,key:'unsafe'}])await assert.rejects(service.analyze(invalid,'other'),e=>e.status===400)
})

test('structured DNA supports repeated editable blocks and uniform top actions without a template fallback',()=>{
 const rich={...spec,designVisual:{paddingX:14,maxWidth:480,radiusPx:18},heroVisual:{heroComposition:'overlap',logoSize:100,minHeight:380},buttons:['whatsapp','instagram','location','catalog'].map((type,i)=>({type,label:['WhatsApp','Instagram','Como chegar','Catálogo'][i],subtitle:'Saiba mais',visual:{iconSize:64,glyphSize:32,labelSize:12,background:['#00aa44','#cc2288','#2288cc','#8822cc'][i]}})),blocks:[{kind:'actions',visual:{columns:4,actionFormat:'tiles',buttonHeight:120},mediaRole:'none'},{kind:'products',title:'Nossa coleção',count:6,layout:'three',visual:{columns:3,gap:8,mediaHeight:150},mediaRole:'produto'},{kind:'about',title:'Sobre nós',text:'Nossa história editável',visual:{mediaPlacement:'left'},mediaRole:'ambiente'},{kind:'about',title:'Um segundo bloco',text:'Conteúdo independente',visual:{background:'#eeeeee',text:'#111111'},mediaRole:'none'}]}
 const bio=composeReference(preferences,'dna:0',rich);validateBio(bio);assert.equal(bio.renderMode,'flexible');assert.equal(bio.designVisual.paddingX,14);assert.equal(bio.heroVisual.heroComposition,'overlap');assert.equal(bio.sections.length,4);assert.equal(new Set(bio.sections.map(s=>s.id)).size,4);const actions=bio.sections[0].content.actions;assert.equal(actions.length,4);assert(actions.every(a=>a.visual.iconSize===64));assert.equal(actions[3].sectionId,bio.sections[1].id);assert.equal(bio.sections[1].content.items.length,6);assert.equal(bio.sections[2].text,'Nossa história editável');assert.equal(bio.sections[3].text,'Conteúdo independente');const saved=JSON.parse(JSON.stringify(bio));validateBio(saved);assert.equal(saved.sections[2].text,bio.sections[2].text)
})
test('crop keeps bounds under zoom, repositioning and aspect changes and scales preview',()=>{
 for(const aspect of [1,4/3,3/4,16/9,9/16])for(const zoom of [1,2,4])for(const pan of [-1,0,1]){const crop=cropGeometry(2000,1000,aspect,zoom,pan,-pan);assert(crop.x>=0&&crop.y>=0);assert(crop.x+crop.width<=2000.0001&&crop.y+crop.height<=1000.0001);assert(Math.abs(crop.width/crop.height-aspect)<.0001);const out=cropOutputSize(crop);assert(out.width<=1600&&out.height<=1600)}
 assert.deepEqual(cropGeometry(1000,500,2,1,0,0),{x:0,y:0,width:1000,height:500});assert.throws(()=>cropGeometry(0,500,1,1,0,0))
})
test('multiple references and text share authenticated service, preserve image order and reject excess',async()=>{
 const sharp=(await import('sharp')).default;const image=await sharp({create:{width:10,height:10,channels:3,background:'#123456'}}).png().toBuffer();const reference={mime:'image/png',data:image.toString('base64')};let called=0;
 const service=createVisionService({getProvider:async()=>({configured:true,analyzeReferenceImage:async(images,category,description)=>{called++;assert.equal(images.length,2);assert(images.every(i=>i.mime==='image/jpeg'));assert.equal(category,'fashion');assert.equal(description,'Use a primeira como hero e a segunda como vitrine.');return spec}})});
 await service.analyze({images:[reference,reference],description:'Use a primeira como hero e a segunda como vitrine.',categoryId:'fashion'},'test');assert.equal(called,1);
 await assert.rejects(service.analyze({images:Array(5).fill(reference),categoryId:'fashion'},'test'),e=>e.status===400);await assert.rejects(service.analyze({images:[reference],mime:'image/png',data:reference.data},'test'),e=>e.status===400)
})
