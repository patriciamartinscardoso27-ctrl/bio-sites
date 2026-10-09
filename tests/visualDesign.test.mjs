import test from 'node:test'
import assert from 'node:assert/strict'
import {validateBio} from '../server/validation.mjs'
const {templates,createBio}=await import('../src/data/templates.ts')
const {appearancePreset,sectionLayouts,changeActionType,moveSection}=await import('../src/lib/visualDesign.ts')
const {actionDestination,actionTypes}=await import('../src/lib/actionLinks.ts')
test('visual presets and compatible layouts preserve 21 recipes, valid JSONB and independent drafts',()=>{
 for(const template of templates){const original=structuredClone(template.bio),bio=createBio(template);for(const preset of ['Mais escuro','Mais claro','Elegante','Vibrante']){const draft={...structuredClone(bio),...appearancePreset(bio,preset)};for(const section of draft.sections){for(const layout of sectionLayouts[section.kind]||[]){section.layout=layout;validateBio(draft)}}assert.deepEqual(appearancePreset(draft,'Original').appearance,bio.appearance)}assert.deepEqual(template.bio,original)}
})
test('changing any of 14 action types clears stale destination and icon without replacing identity',()=>{
 const bio=createBio(templates[0]),old={id:'stable',kind:'location',label:'Mapa',message:'old',source:'custom',url:'https://maps.example.com',icon:'heart',enabled:false}
 for(const type of actionTypes){const action=changeActionType(old,type.kind,bio);assert.equal(action.id,old.id);assert.equal(action.kind,type.kind);assert.equal(action.enabled,false);assert.equal(action.icon,undefined);assert.notEqual(action.url,old.url);if(type.kind==='reviews'){const configured={...action,source:'custom',url:'https://g.page/r/example/review'};assert.equal(actionDestination(configured,bio).href,configured.url)}}
 assert.equal(old.icon,'heart')
})
test('section order is immutable, bounded and survives serialization; unsafe layouts and colors rejected',()=>{
 const bio=createBio(templates[0]),id=bio.sections[1].id,before=structuredClone(bio.sections);const moved=moveSection(bio,id,-1);assert.equal(moved[0].id,id);assert.deepEqual(bio.sections,before);assert.deepEqual(moveSection({...bio,sections:moved},id,-1),moved);validateBio({...bio,sections:JSON.parse(JSON.stringify(moved))})
 const bad=structuredClone(bio);bad.sections.find(s=>s.kind==='about').layout='carousel';assert.throws(()=>validateBio(bad));bad.sections=before;bad.appearance={theme:'dark',secondary:'#ffffff',font:'sans',buttons:'rounded',cards:'rounded',muted:'url(secret)'};assert.throws(()=>validateBio(bad))
})
