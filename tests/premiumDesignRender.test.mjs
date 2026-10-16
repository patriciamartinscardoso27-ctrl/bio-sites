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
 const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}})
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
