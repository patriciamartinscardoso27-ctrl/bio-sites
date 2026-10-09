import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
import {validateBio} from '../server/validation.mjs'
const vite=await createServer({configFile:false,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false}})
try{
 const {readyTemplates,createBio}=await vite.ssrLoadModule('/src/data/templates.ts'),{actionDestination}=await vite.ssrLoadModule('/src/lib/actionLinks.ts')
 const before=JSON.parse(await fs.readFile('artifacts/official-models/refresh-stage2-before.json','utf8')),checkpoint=JSON.parse(await fs.readFile('artifacts/official-models/refresh-stage2-checkpoint.json','utf8'))
 assert.equal(readyTemplates.length,76);assert.equal(new Set(readyTemplates.map(x=>x.id)).size,76)
 for(const model of readyTemplates){const expected=checkpoint.find(x=>x.id===model.id)||before.models.find(x=>x.id===model.id);assert(JSON.stringify(model)===JSON.stringify(expected),model.id+' changed since approved refresh')}
 let actions=0;const invalid=[]
 const walk=(value,bio,path)=>{if(!value||typeof value!=='object')return;if(typeof value.label==='string'&&typeof value.message==='string'&&typeof value.kind==='string'&&value.enabled!==false){actions++;const destination=actionDestination(value,bio);if(destination.error)invalid.push({model:bio.layoutPreset,path,label:value.label,error:destination.error})}for(const [key,item]of Object.entries(value))if(key!=='entryIcons'&&item&&typeof item==='object')walk(item,bio,path+'.'+key)}
 for(const model of readyTemplates){const bio=createBio(model);assert.equal(validateBio(bio,bio.id),model.id);walk(bio,bio,'bio')}
 const report={models:76,idsUnique:true,approvedDefinitionsUnchanged:true,serverPayloadsValid:true,actionsChecked:actions,invalidActions:invalid,externalDeliveryTested:false,remoteWrites:false}
 await fs.writeFile('artifacts/functional-audit/catalogue-links.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,invalidActions:invalid.length}))
}finally{await vite.close()}
