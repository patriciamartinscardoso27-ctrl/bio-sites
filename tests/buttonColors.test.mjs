import test from 'node:test'
import assert from 'node:assert/strict'
import {validateBio} from '../server/validation.mjs'
const {templates,createBio}=await import('../src/data/templates.ts')
const {buttonColors,contrast,readableInk}=await import('../src/lib/buttonColors.ts')
const {defaultAppearance}=await import('../src/lib/visualDesign.ts')
const {duplicateSection,sectionContent,setSectionContent,removeSection}=await import('../src/lib/sections.ts')
test('all 21 models support global colors, individual precedence and appearance-only reset',()=>{
 for(const template of templates){const bio=createBio(template),a=bio.actions[0],identity=structuredClone(a);bio.appearance={...defaultAppearance(bio),buttonMode:'theme',buttonBackground:'#112233',buttonText:'#ffffff',buttonIcon:'#ffff00',buttonHover:'#ff0000'};assert.equal(buttonColors(a,bio).background,'#112233');a.visual={background:'#008844',iconColor:'#ffffff',textColor:'#ffcc00',border:'#222222',radius:'pill',style:'outline',hoverColor:'#00ff00'};const paint=buttonColors(a,bio);assert.equal(paint.background,'#008844');assert.equal(paint.fill,'transparent');assert.equal(paint.text,'#ffcc00');assert.equal(paint.icon,'#ffffff');validateBio(bio);a.visual=undefined;assert.equal(buttonColors(a,bio).background,'#112233');assert.deepEqual(JSON.parse(JSON.stringify(a)),identity)}
})
test('presets preserve brand gradient and readable automatic icon colors',()=>{
 const bio=createBio(templates[0]);for(const mode of ['original','theme','mono','light','dark','custom']){bio.appearance={...defaultAppearance(bio),buttonMode:mode};for(const kind of ['whatsapp','instagram','location','reviews']){const paint=buttonColors({id:'test',label:kind,kind,message:''},bio);assert(contrast(paint.background,paint.icon)>=4.5);if(mode==='original'&&kind==='instagram')assert(paint.fill.startsWith('linear-gradient'))}}assert.equal(readableInk('#ffffff'),'#000000');assert.equal(readableInk('#000000'),'#ffffff')
})
test('duplicate sections own independent content, item IDs and appearances after source removal',()=>{
 for(const template of templates){const bio=createBio(template),original=structuredClone(bio),s=bio.sections.find(s=>s.kind==='products'||s.kind==='services'),copy=duplicateSection(bio,s.id);assert.deepEqual(bio,original);assert.notEqual(copy.copy.id,s.id);const items=sectionContent(bio,s).items;if(items?.length)assert.notEqual(copy.copy.content.items[0].id,items[0].id);let next={...bio,sections:copy.sections};const contents=sectionContent(next,copy.copy);if(contents.items?.length){next={...next,...setSectionContent(next,copy.copy,{items:contents.items.map((i,n)=>n===0?{...i,title:'Independent',visual:{background:'#332211'}}:i)})};assert.notEqual(sectionContent(next,s).items[0].title,'Independent')}next={...next,...removeSection(next,s.id)};assert(next.sections.some(x=>x.id===copy.copy.id));if(items?.length)assert.equal(sectionContent(next,next.sections.find(x=>x.id===copy.copy.id)).items.length,items.length);validateBio(next)}
})
