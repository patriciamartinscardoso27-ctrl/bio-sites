import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {JSDOM} from 'jsdom'
import React from 'react'
import {renderToString} from 'react-dom/server'
import {readFile} from 'node:fs/promises'
import '../server/catalog.mjs'
const {createBio,templates}=await import('../src/data/templates.ts')
const {selectIconPatch}=await import('../src/lib/iconSelection.ts')
const {buttonColors,setButtonAppearanceMode}=await import('../src/lib/buttonColors.ts')

test('four mixed actions keep identical icon slots and labels outside squares in every model',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false}})
 try{
  const {QuickActions}=await vite.ssrLoadModule('/src/components/QuickActions.tsx')
  for(const template of templates){
   const bio=createBio(template)
   bio.actions=['whatsapp','instagram','location','catalog'].map((icon,i)=>({id:String(i),kind:'custom',message:'',label:['WhatsApp','Instagram','Como chegar','Catálogo'][i],subtitle:'Saiba mais',url:i%2?'https://example.com':'',...selectIconPatch({id:String(i),kind:'custom',message:'',label:icon,visual:{background:'#d4af37'}},icon)}))
   const dom=new JSDOM(renderToString(React.createElement(QuickActions,{bio})))
   const actions=[...dom.window.document.querySelectorAll('[data-action-id]')]
   assert.equal(actions.length,4);const pin=actions[2].querySelector('svg.lucide-map-pin-house');assert(pin,'modern Lucide location glyph');assert.equal(pin.getAttribute('stroke-width'),'1.75');assert.equal(pin.getAttribute('width'),'32')
   for(const action of actions){assert.equal(action.firstElementChild.className,'action-icon-slot');assert.equal(action.querySelector('.action-icon-slot .action-icon-tile').children.length,1);assert(!action.querySelector('.action-icon-tile strong'));assert.equal(action.querySelector('.action-tile-label strong').textContent,bio.actions[Number(action.dataset.actionId)].label)}
   dom.window.close()
  }
 }finally{await vite.close()}
 const css=await readFile(new URL('../src/styles/brandButtons.css',import.meta.url),'utf8')
 assert(css.includes('aspect-ratio:1'));assert(css.includes('repeat(var(--action-columns,4),minmax(0,1fr))'));assert(!css.includes('nth-child'))
})
test('brand switches change paint only and theme/custom remain available',()=>{
 const bio=createBio(templates[0]),original={id:'stable',kind:'custom',label:'Contato',message:'',url:'https://example.com',visual:{background:'#d4af37',iconSize:64,radiusPx:16}}
 for(const icon of ['whatsapp','instagram','google']){const action={...original,...selectIconPatch(original,icon)},paint=buttonColors(action,bio);assert.notEqual(paint.background,'#d4af37');assert.equal(action.visual.iconSize,64);assert.equal(action.visual.radiusPx,16);assert.equal(action.id,original.id);assert.equal(action.url,original.url);if(icon==='instagram')assert(paint.fill.startsWith('linear-gradient'));assert.equal(buttonColors({...action,...setButtonAppearanceMode(action,bio,'theme')},bio).appearanceMode,'theme');assert.equal(buttonColors({...action,...setButtonAppearanceMode(action,bio,'custom')},bio).fill.replaceAll(' ',''),paint.fill.replaceAll(' ',''))}
})



