import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup, renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'node:stream'

// Transpile application modules in memory to exercise the real TSX renderer.
registerHooks({
  resolve(specifier, context, next) {
    if (specifier.startsWith('.') && context.parentURL) {
      for (const extension of ['.ts','.tsx']) {
        const url = new URL(specifier + extension,context.parentURL)
        if(existsSync(fileURLToPath(url))) return next(url.href,context)
      }
    }
    return next(specifier,context)
  },
  load(url, context, next) {
    if(url.endsWith(".css")) return {format:"module",shortCircuit:true,source:"export default {}"}
    if(/\.(png|svg|jpg|webp)$/.test(url)) return {format:"module",shortCircuit:true,source:`export default ${JSON.stringify(url)}`}
    if(url.endsWith('.ts') || url.endsWith('.tsx')) return { format:'module',shortCircuit:true,source:ts.transpileModule(readFileSync(fileURLToPath(url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX}}).outputText }
    return next(url,context)
  },
})
const { templates, categories, visualStyles, createBio } = await import('../src/data/templates.ts')
const { modelDesigns } = await import('../src/data/modelDesigns.ts')
const { BioSite } = await import('../src/components/BioSite.tsx')
const { actionTypes, createAction, actionDestination, moveAction, genericIcons } = await import('../src/lib/actionLinks.ts')
// Resolve shared lazy brand glyphs before synchronous SSR assertions.
await new Promise((resolve,reject)=>{const output=new PassThrough();output.resume();output.on('end',resolve);const stream=renderToPipeableStream(React.createElement(BioSite,{bio:createBio(templates[0])}),{onAllReady(){stream.pipe(output)},onError:reject})})
const {sectionLayouts}=await import('../src/lib/visualDesign.ts')
const {duplicateSection,removeSection}=await import('../src/lib/sections.ts')
test('real renderer preserves individual button colors, custom blocks and independent duplicated sections across all models',()=>{
 for(const template of templates){const bio=createBio(template),s=bio.sections.find(s=>s.kind==='products'||s.kind==='services'),duplicate=duplicateSection(bio,s.id);duplicate.copy.content.items[0].title='Independent copy';bio.sections=duplicate.sections;bio.sections=bio.sections.map(s=>({...s,enabled:true}));Object.assign(bio,removeSection(bio,s.id));bio.appearance={theme:'light',secondary:'#eeeeee',font:'sans',buttons:'rounded',cards:'rounded',buttonMode:'theme',buttonBackground:'#123456'};bio.actions[0].visual={background:'#008844',iconColor:'#ffffff',textColor:'#ffcc00',radius:'pill'};bio.textVisual={name:{titleColor:'#aa1122'}};bio.sections.push({id:'custom-block',kind:'about',block:'picture-text',title:'Suppressed heading',text:'Custom block text',image:'https://example.com/photo.webp',enabled:true,content:{}});const html=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}));assert(html.includes('Independent copy'));assert(!html.includes(`data-section-id="${s.id}"`));assert(html.includes('--button-fill:#008844'));assert(html.includes('--button-icon:#ffffff'));assert(html.includes('color:#ffcc00'));assert(html.includes('data-button-radius="pill"'));assert(html.includes('data-text-visual="true"'));assert(html.includes('Custom block text'));assert(!html.includes('<h2>Suppressed heading</h2>'));assert(html.includes('https://example.com/photo.webp'));assert(!html.includes('[object Object]'))}
})
test('visual layout metadata, additional items, subtitles and custom icon overrides render across all 21 models',()=>{
 for(const template of templates){const bio=createBio(template);bio.heroLayout='compact';for(const section of bio.sections){section.enabled=true;section.layout=sectionLayouts[section.kind]?.at(-1)}bio.products.push({id:'additional',title:'Produto acrescentado',description:'Novo conteúdo',price:'R$ 10',image:''});bio.actions[0].subtitle='Subtítulo próprio';bio.actions[0].icon='heart';const html=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}));assert(html.includes('data-hero-layout="compact"'));assert(html.includes('Produto acrescentado'));assert(html.includes('Subtítulo próprio'));assert(html.includes('data-generic-icon="heart"'));for(const section of bio.sections){assert(html.includes(`data-section-id="${section.id}"`));if(section.layout)assert(html.includes(`data-layout="${section.layout}"`))}}
})

const expected = [
  ['Boutique Gold','Fashion Pink','Clean Nude','Urban Black','Social Trend'],
  ['Black Gold','Vintage Barber','Urban Street','Clean Gentleman','Luxury Dark'],
  ['Rose Gold','Nude Elegance','Luxury Black','Clean Spa','Beauty Glam'],
  ['Gourmet Dark','Fast Food Red','Rustic Kitchen','Clean Menu','Street Food'],
  ['Candy Pink','Chocolate Premium','Clean Patisserie','Color Fun','Luxury Sweet'],
  ['Auto Premium','Performance Red','Tech Blue','Industrial','Clean Professional'],
  ['Business Premium','Modern Blue','Clean Minimal','Vibrant Sales','Elegant Corporate'],
]
test('exactly 21 named models, seven categories, three models in each',()=>{
  assert.equal(templates.length,21);assert.equal(categories.length,7)
  assert.equal(new Set(templates.map(t=>t.id)).size,21)
  assert.equal(new Set(visualStyles.map(t=>t.id)).size,21)
  categories.forEach((c,i)=>assert.deepEqual(templates.filter(t=>t.categoryId===c.id).map(t=>t.label),expected[i].slice(0,3)))
})
test('three structural recipes per category differ without using color as a discriminator',()=>{
  for(const category of categories){
    const models=templates.filter(t=>t.categoryId===category.id)
    assert.equal(new Set(models.map(t=>modelDesigns[t.bio.style].hero)).size,3,category.label)
    assert.equal(new Set(models.map(t=>{const d=modelDesigns[t.bio.style];return [d.hero,d.actions,d.catalog,d.services,d.gallery,d.final].join('|')})).size,3)
    assert.ok(new Set(models.map(t=>modelDesigns[t.bio.style].gallery)).size>=3)
    assert.ok(new Set(models.map(t=>modelDesigns[t.bio.style].final)).size>=3)
  }
})
test('every model is complete, has a small six-item showcase and appropriate active sections',()=>{
  for(const {bio,categoryId} of templates){
    for(const field of ['name','category','headline','description','cover','phone','address','hours','instagram']) assert.ok(bio[field],`${bio.style} ${field}`)
    assert.equal(bio.products.length,6)
    assert.equal(new Set(bio.sections.map(s=>s.id)).size,bio.sections.length)
    assert.ok(bio.photos.length>=4)
    for(const kind of ['actions','promotion','gallery','about','benefits','hours','location','whatsapp']) assert.ok(bio.sections.some(s=>s.kind===kind&&s.enabled),`${bio.style} ${kind}`)
    const serviceFirst=['barber','beauty','auto'].includes(categoryId)
    assert.ok(bio.sections.some(s=>s.kind===(serviceFirst?'services':'products')&&s.enabled))
    if(serviceFirst) assert.equal(bio.sections.find(s=>s.kind==='products').enabled,false)
    assert.ok(bio.actions.every(a=>actionDestination(a,bio).href))
  }
})
test('all 21 retain six initial products and render additional content added in the visual editor',()=>{
  for(const template of templates){
    const bio=createBio(template)
    bio.sections=bio.sections.map(s=>({...s,enabled:true}))
    assert.equal(bio.products.length,6)
    bio.products.push({...bio.products[0],id:'seventh',title:'Produto adicional do editor'})
    const markup=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}))
    assert.ok(markup.includes(`data-style="${bio.style}"`))
    assert.ok(markup.includes(bio.name.replaceAll('&','&amp;')))
    assert.ok(markup.includes('Produto adicional do editor'))
    assert.equal((markup.match(/<h1/g)||[]).length,1)
  }
})
test('all 14 button kinds retain generated links and automatic icons across all 21 layouts',()=>{
  for(const template of templates){
    const bio=createBio(template)
    bio.actions=actionTypes.map(({kind})=>({...createAction(kind,bio),source:'custom',number:'5511988887777',email:'contato@example.com',url:`https://example.com/${kind}`,message:'Olá! Quero saber mais.'}))
    const markup=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}))
    for(const action of bio.actions){
      const href=actionDestination(action,bio).href
      assert.ok(href)
      assert.ok(markup.includes(`href="${href.replaceAll('&','&amp;')}"`),`${bio.style} ${action.kind} href`)
      assert.ok((markup.includes(`data-action-icon="${action.kind}"`) || markup.includes(`data-generic-icon="${action.kind==='reviews'?'google-reviews':action.kind}"`)),`${bio.style} ${action.kind} icon`)
    }
    const reordered=moveAction(bio.actions,0,1)
    assert.equal(reordered[0].kind,'instagram')
    bio.actions=reordered.map(a=>a.kind==='tiktok'?{...a,enabled:false}:a)
    const hidden=renderToStaticMarkup(React.createElement(BioSite,{bio}))
    assert.ok(!hidden.includes('data-action-kind="tiktok"'))
  }
})
test('custom icons, flexible destinations and contact reuse survive choosing any model',()=>{
  for(const template of templates){
    const bio=createBio(template)
    for(const kind of ['booking','quote','order']){
      const action={...createAction(kind,bio),mode:'url',source:'custom',url:'https://example.com/reservar'}
      assert.equal(actionDestination(action,bio).href,'https://example.com/reservar')
      action.mode='whatsapp';action.source='business'
      bio.phone='5521988887777'
      assert.ok(actionDestination(action,bio).href.startsWith('https://wa.me/5521988887777'))
    }
    for(const icon of genericIcons){
      bio.actions=[{...createAction('custom',bio),url:'https://example.com',icon:icon.id}]
      const html=renderToStaticMarkup(React.createElement(BioSite,{bio}));assert.ok(icon.id==='stars'?html.includes('aria-label="5 estrelas"'):html.includes(`data-generic-icon="${icon.id}"`),icon.id)
    }
  }
})
test('choosing templates deep-clones content; businesses never share editable arrays',()=>{
  for(const template of templates){
    const first=createBio(template), second=createBio(template)
    assert.notEqual(first.id,second.id)
    first.actions[0].label='Only this business';first.sections[0].enabled=false;first.products[0].title='Changed'
    assert.notEqual(second.actions[0].label,first.actions[0].label)
    assert.notEqual(template.bio.products[0].title,first.products[0].title)
    assert.equal(second.sections[0].enabled,true)
  }
})
test('manual creation starts complete and remains compatible with sections and buttons',()=>{
  const bio=createBio()
  assert.ok(bio.manual);assert.ok(bio.sections.length>0);assert.ok(bio.actions.length>=3);assert.equal(bio.products.length,6)
  assert.ok(bio.cover);assert.ok(bio.appearance)
  bio.phone='5511988887777';bio.sections=[{id:'actions',kind:'actions',title:'Contato',text:'',enabled:true}];bio.actions=[createAction('whatsapp',bio)]
  assert.ok(renderToStaticMarkup(React.createElement(BioSite,{bio})).includes('data-action-kind="whatsapp"'))
})

test('premium models reflect editable data, prices, contacts and optional sections',()=>{
  for(const style of ['boutique-gold','black-gold']) {
    const bio=createBio(templates.find(t=>t.bio.style===style))
    bio.name='Empresa editada';bio.phone='5521988887777';bio.address='Avenida editada, 42';bio.hours='Sábado: 08:00 – 12:00'
    const kind=style==='boutique-gold'?'products':'services'
    bio[kind][0].title='Item editado';bio[kind][0].price='R$ 123,45'
    bio.sections.find(s=>s.kind==='testimonials').text='Cliente real|Comentário editado'
    const markup=renderToStaticMarkup(React.createElement(BioSite,{bio}))
    for(const text of ['Empresa editada','Item editado','R$ 123,45','Avenida editada, 42','08:00 – 12:00','Comentário editado','wa.me/5521988887777']) assert.ok(markup.includes(text),text)
    bio.heroEnabled=false;bio.sections=bio.sections.filter(s=>s.kind===kind).map(s=>({...s,enabled:false}))
    const hidden=renderToStaticMarkup(React.createElement(BioSite,{bio}))
    assert.ok(!hidden.includes('<h1'));assert.ok(!hidden.includes('Item editado'))
  }
})

test('premium service cards preserve external booking destinations and section order',()=>{
  const bio=createBio(templates.find(t=>t.bio.style==='black-gold'))
  bio.actions.find(a=>a.kind==='booking').mode='url'
  Object.assign(bio.actions.find(a=>a.kind==='booking'),{source:'custom',url:'https://example.com/agenda'})
  bio.sections=[bio.sections.find(s=>s.kind==='hours'),bio.sections.find(s=>s.kind==='services')]
  const markup=renderToStaticMarkup(React.createElement(BioSite,{bio}))
  assert.ok(markup.includes('href="https://example.com/agenda"'))
  assert.ok(markup.indexOf('Horário de funcionamento')<markup.indexOf('Nossos serviços'))
})


const {composeDesign}=await import('../src/lib/designCompositionEngine.ts');
const {compositionStyles}=await import('../src/lib/designSystem.ts');
test('generated compositions render using the real normal editor renderer in all seven categories and six rule profiles',()=>{for(const category of categories)for(const style of compositionStyles.filter(s=>s!=='surprise')){const bio=composeDesign({name:'Renderer fixture',categoryId:category.id,goal:'messages',style,theme:'dark',density:'complete'},'renderer:'+style+':1','renderer-fixture');const html=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}));assert(!html.includes('[object Object]'));assert(html.includes('Renderer fixture'));assert(html.includes('data-hero-layout="'+bio.heroLayout+'"'));for(const section of bio.sections.filter(s=>s.enabled))assert(html.includes('data-section-id="'+section.id+'"'));}});

test('all 21 renderers expose scoped reorder markers for gallery, reviews, benefits, categories and cards',()=>{for(const template of templates){const bio=createBio(template);bio.sections=bio.sections.map(s=>({...s,enabled:true}));const html=renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}));for(const s of bio.sections){if(s.kind==='gallery'&&bio.photos.some(Boolean))assert(html.includes('data-photo-index='));if(s.kind==='benefits'&&bio.benefits.length)assert(html.includes('data-benefit-index='));if(s.kind==='testimonials'&&s.text.trim())assert(html.includes('data-review-index='));if(s.kind==='categories'&&bio.highlights.length)assert(html.includes('data-highlight-id='));}assert(!html.includes('studio-drag-handle'));}})
