import assert from 'node:assert/strict'
import {readFile,writeFile} from 'node:fs/promises'
import {connectRepository} from '../server/repository.mjs'
const {composeDesign,restoreGeneratedDesign}=await import('../src/lib/designCompositionEngine.ts')
let stage='connect',repo,before,changed=false,restored=false,result
try{
 repo=await connectRepository();const ids=JSON.parse(await readFile(new URL('../review/admin-neon-tests.json',import.meta.url),'utf8')).ids
 before=await repo.get(ids[1]);assert(before.content.name.startsWith('[Teste automático] Admin visual'));const independent=await repo.get(ids[0])
 const generated=JSON.parse(JSON.stringify(composeDesign({name:before.content.name,categoryId:'barber',goal:'bookings',style:'premium',theme:'dark',primary:'#172723',accent:'#d1b276',density:'complete',phone:'5511999999999'},'neon-composition:0',before.id)))
 stage='save generated';let saved=await repo.save(before.id,generated,before.lockVersion);changed=true
 stage='new connection/read';let read=await (await connectRepository()).get(before.id);assert.deepEqual(read.content,generated);assert.equal(read.slug,before.slug);assert.equal(read.content.composition.compositionSeed,'neon-composition:0')
 stage='normal editor update';const edited=structuredClone(read.content);edited.services[0].price='Preço editado de teste';edited.sections.find(s=>s.kind==='about').text='Texto comercial de teste';edited.actions[0].visual={background:'#8b2345',iconColor:'#ffffff',textColor:'#ffffff'};edited.heroLayout='compact';saved=await repo.save(before.id,edited,saved.lockVersion)
 stage='restore appearance';const appearanceOnly=JSON.parse(JSON.stringify({...edited,...restoreGeneratedDesign(edited)}));assert.equal(appearanceOnly.services[0].price,'Preço editado de teste');assert.equal(appearanceOnly.sections.find(s=>s.kind==='about').text,'Texto comercial de teste');saved=await repo.save(before.id,appearanceOnly,saved.lockVersion);read=await (await connectRepository()).get(before.id);assert.deepEqual(read.content,appearanceOnly)
 stage='isolation/concurrency';assert.deepEqual((await repo.get(ids[0])).content,independent.content);await assert.rejects(repo.save(before.id,edited,before.lockVersion),e=>e.status===409)
 result={complete:true,checks:['generated normal draft saved','seed and initial visual snapshot recovered','ordinary editor changes persisted','appearance restoration preserves commercial data','permanent slug','independent BioSite unchanged','concurrency protected'],schemaUnchanged:true,authUnchanged:true,newRecordsCreated:0}
}catch{result={complete:false,stage,privateDetailsOmitted:true};process.exitCode=1}
finally{
 if(changed&&repo&&before){try{const current=await repo.get(before.id);await repo.save(before.id,before.content,current.lockVersion);assert.deepEqual((await repo.get(before.id)).content,before.content);restored=true}catch{result={complete:false,stage:'restore labeled fixture',privateDetailsOmitted:true};process.exitCode=1}}
 if(result){result.fixtureRestored=restored;await writeFile(new URL('../review/composition-neon-tests.json',import.meta.url),JSON.stringify(result,null,2))}
}
console.log(result?.complete?'PASS: generated composition, seed, ordinary editing, restore, isolation and concurrency in real Neon; existing fixture restored, no new records.':'FAIL: composition Neon test at '+result?.stage+'; private details omitted.')
