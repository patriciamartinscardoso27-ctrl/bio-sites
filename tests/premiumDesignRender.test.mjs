import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createServer} from 'vite'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import '../server/source-modules.mjs'
const {processPremiumDesign}=await import('../server/premium-design.mjs')
const {exportPremiumDesign}=await import('../src/lib/premiumDesignPackage.ts')
const {resolveEditorTarget}=await import('../src/lib/editorTargets.ts')
const {JSDOM}=await import('jsdom')

test('Xavier reimport produces identical real renderer markup and preserves editor ownership and links',async()=>{
 const source=JSON.parse(await fs.readFile(new URL('./fixtures/xavier-premium-roundtrip.json',import.meta.url),'utf8'))
 const copy=processPremiumDesign({operation:'import',package:exportPremiumDesign(source)}).bio
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-premium-render',server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true,include:[]}})
 try{
  const {BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx')
  const original=renderToStaticMarkup(React.createElement(BioSite,{bio:source,embedded:true})),reimported=renderToStaticMarkup(React.createElement(BioSite,{bio:copy,embedded:true}))
  assert.equal(reimported,original)
  const dom=new JSDOM(reimported),doc=dom.window.document
  const photo=doc.querySelector('[data-item-id] img'),action=doc.querySelector('[data-action-id]')
  assert(photo);assert(action)
  assert.equal(resolveEditorTarget(photo,copy).kind,'item');assert.equal(resolveEditorTarget(action,copy).kind,'action')
  const gallery=copy.sections.find(s=>s.kind==='gallery')
  assert.equal(doc.querySelector(`[data-section-id="${gallery.id}"]`).querySelectorAll('[data-photo-index]').length,6)
  dom.window.close()
 }finally{await vite.close()}
})

test('actual ready premium template preserves structure and real renderer markup without mutating library',async()=>{
 const vite=await createServer({configFile:false,cacheDir:'node_modules/.vite-premium-library-render',server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true,include:[]}})
 try{
  const {readyTemplates}=await vite.ssrLoadModule('/src/data/templates.ts')
  const {BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx')
  const model=readyTemplates.find(t=>t.id==='moda-premium-gold');assert(model)
  const before=JSON.stringify(model),source={...structuredClone(model.previewBio||model.bio),id:crypto.randomUUID()}
  const pack=processPremiumDesign({operation:'export',bio:source}).package
  const copy=processPremiumDesign({operation:'import',package:JSON.parse(JSON.stringify(pack))}).bio
  assert.notEqual(copy.id,source.id)
  assert.deepEqual({...copy,id:source.id},source)
  assert.equal(pack.renderer.presetId,source.layoutPreset)
  assert.equal(renderToStaticMarkup(React.createElement(BioSite,{bio:copy,embedded:true})),renderToStaticMarkup(React.createElement(BioSite,{bio:source,embedded:true})))
  assert.equal(JSON.stringify(model),before)
 }finally{await vite.close()}
})

test('shared authoring examples render and reimport through existing preset and flexible renderers',async()=>{
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false,watch:null},optimizeDeps:{noDiscovery:true,include:[]}})
 try{
  const {BioSite}=await vite.ssrLoadModule('/src/components/BioSite.tsx')
  for(const name of ['aurora-flexivel','xavier-biblioteca']){
   const pack=JSON.parse(await fs.readFile(new URL('../docs/kit-autoria-premium/exemplos/'+name+'.biosite.json',import.meta.url),'utf8'))
   const copy=processPremiumDesign({operation:'import',package:pack}).bio
   const markup=bio=>renderToStaticMarkup(React.createElement(BioSite,{bio,embedded:true}))
   const rendered=markup(copy)
   assert.equal(rendered,markup(pack.design));assert(rendered.includes(pack.design.name))
   if(name==='aurora-flexivel')assert(rendered.includes('flexible-biosite'))
   else assert(rendered.includes('moda-premium-gold'))
  }
 }finally{await vite.close()}
})
