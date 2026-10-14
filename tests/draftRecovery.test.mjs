import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}})
const {reconcileDraft,saveDraftWithRecovery,DraftConflictError}=await vite.ssrLoadModule('/src/lib/draftRecovery.ts')
const {BioSiteApiError}=await vite.ssrLoadModule('/src/lib/biositesApi.ts')
const bio={id:'same-client',name:'Paty',hours:'09-19',mapsUrl:'old-map',sections:[{id:'menu',content:{items:[{id:'galeto',description:'original'},{id:'costela',price:'28'}]}}]}
const base={id:bio.id,slug:'same-url',lockVersion:'1',draftRevision:'1',content:bio}
test('409 merges independent menu/hours/location edits and saves using latest lock',async()=>{
 const local=structuredClone(bio);local.hours='10-18';local.sections[0].content.items[1].price='30'
 const remote=structuredClone(bio);remote.mapsUrl='new-map';remote.sections[0].content.items[0].description='farofa e batata'
 const latest={...base,lockVersion:'2',draftRevision:'2',content:remote},writes=[],copies=[]
 const saved=await saveDraftWithRecovery(local,base,{get:async()=>latest,save:async(content,lock)=>{writes.push({content,lock});if(lock==='1')throw new BioSiteApiError('Conflict',409);return {...latest,lockVersion:'3',content}},create:()=>assert.fail()},(content,record)=>copies.push(structuredClone({content,record})))
 assert.equal(saved.content.hours,'10-18');assert.equal(saved.content.mapsUrl,'new-map');assert.equal(saved.content.sections[0].content.items[0].description,'farofa e batata');assert.equal(saved.content.sections[0].content.items[1].price,'30');assert.equal(writes[1].lock,'2');assert.equal(saved.slug,base.slug);assert.equal(copies.length,2);assert.equal(local.mapsUrl,'old-map')
})
test('same-field conflict never overwrites either version; choices are explicit',async()=>{
 const local={...structuredClone(bio),hours:'local'},remote={...structuredClone(bio),hours:'remote'};let writes=0
 await assert.rejects(()=>saveDraftWithRecovery(local,base,{get:async()=>({...base,lockVersion:'2',content:remote}),save:async()=>{writes++;throw new BioSiteApiError('Conflict',409)},create:()=>assert.fail()},()=>{}),e=>e instanceof DraftConflictError&&e.conflicts[0].path==='/hours')
 assert.equal(writes,1);const result=reconcileDraft(bio,local,remote,{'/hours':'local'});assert.equal(result.conflicts.length,0);assert.equal(result.content.hours,'local');assert.equal(remote.hours,'remote')
})
test('network/validation failures do not change locks or force remote writes',async()=>{
 let reads=0;await assert.rejects(()=>saveDraftWithRecovery(bio,base,{get:async()=>{reads++;return base},save:async()=>{throw new BioSiteApiError('invalid',400)},create:()=>assert.fail()},()=>{}),/invalid/);assert.equal(reads,0)
})
test('concurrent insert/delete/reorder is recoverable and preserves untouched remote entries',()=>{
 const local=structuredClone(bio),remote=structuredClone(bio);local.sections[0].content.items.reverse();remote.sections[0].content.items[0].description='updated'
 const r=reconcileDraft(bio,local,remote);assert.equal(r.conflicts.length,0);assert.equal(r.content.sections[0].content.items[1].description,'updated')
})
test('unsaved encrypted copy survives reopening and archives stay separate',async()=>{
 const storage=new Map();globalThis.localStorage={setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null,key:i=>[...storage.keys()][i],get length(){return storage.size}}
 const {keepNeonBackup,readNeonBackups,setBackupAccount}=await vite.ssrLoadModule('/src/lib/neonBackups.ts')
 const {findRecoverableDraft}=await vite.ssrLoadModule('/src/lib/localDraftRecovery.ts')
 const original={...structuredClone(bio),actions:[],products:[],services:[],photos:[],highlights:[],benefits:[]},saved={...base,content:original},local={...original,hours:'edição ainda não salva'}
 setBackupAccount('owner',false,'a'.repeat(64));keepNeonBackup(local,saved);keepNeonBackup(original,saved,true)
 const copies=readNeonBackups();assert.equal(copies.length,2);assert.equal(copies.filter(c=>c.archived).length,1)
 assert.equal(findRecoverableDraft(copies,bio.id,original).content.hours,local.hours)
 assert.equal(findRecoverableDraft(copies,bio.id,local),undefined,'already saved content must not be recovered as dirty')
 setBackupAccount('different-owner',false,'b'.repeat(64));assert.equal(readNeonBackups().length,0)
})
test.after(()=>vite.close())
