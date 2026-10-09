import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import {publicContent} from '../server/publication.mjs'
const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true})
for(const k of ['window','document','HTMLElement','Element','Node','Event'])globalThis[k]=dom.window[k]
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});globalThis.IS_REACT_ACT_ENVIRONMENT=true
const React=await import('react'),{renderToStaticMarkup}=await import('react-dom/server'),{createRoot}=await import('react-dom/client')
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},cacheDir:'node_modules/.vite-tests-public-renderer',server:{middlewareMode:true,hmr:false},plugins:[(await import('@vitejs/plugin-react')).default()]})
const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx'),{PublishedRenderer}=await vite.ssrLoadModule('/src/components/PublicBioSite.tsx')
const {isPublicDestination}=await vite.ssrLoadModule('/src/lib/publicDestinations.ts')
test('public destination validation rejects placeholders, unsafe URLs and empty fragments',()=>{
 for(const href of ['','#','javascript:alert(1)','https://user:secret@example.com','https://instagram.com/','https://facebook.com/','https://wa.me/','https://google.com/maps/search/?query=Endere%C3%A7o+completo+(editar+no+painel)'])assert.equal(isPublicDestination(href,'http://localhost'),false,href)
 for(const href of ['#products','https://example.com/','https://instagram.com/mybusiness','https://wa.me/5511987654321'])assert.equal(isPublicDestination(href,'http://localhost'),true,href)
})
test('all 76 public snapshots preserve the exact real renderer markup and exclude internal client data',()=>{
 assert.equal(readyTemplates.length,76)
 for(const template of readyTemplates){const bio=createBio(template);bio.client={notes:'PRIVATE-NOTE',responsible:'PRIVATE-NAME'};const projected=publicContent(bio)
  assert.equal(renderToStaticMarkup(React.createElement(BioSite,{bio:projected})),renderToStaticMarkup(React.createElement(BioSite,{bio})),template.id)
  assert(!JSON.stringify(projected).includes('PRIVATE-'))
 }
})
test('actual rendered links lacking a valid destination become inert without removing cards or sections',async()=>{
 const root=createRoot(document.getElementById('root'))
 for(const template of readyTemplates){const bio=createBio(template);bio.phone='';bio.instagram='';bio.mapsUrl='';bio.reviewsUrl='';const before=bio.sections.length
  await React.act(async()=>root.render(React.createElement(PublishedRenderer,{bio})))
  for(const link of document.querySelectorAll('a')){if(link.closest('.gold-filter-bar,.gold-gallery-controls'))continue
   if(!link.hasAttribute('href')){assert.equal(link.getAttribute('aria-disabled'),'true');assert.equal(link.tabIndex,-1)}
  }
  assert.equal(bio.sections.length,before)
 }
 await React.act(async()=>root.unmount())
})
test('cleanup',async()=>{await vite.close();dom.window.close()})
