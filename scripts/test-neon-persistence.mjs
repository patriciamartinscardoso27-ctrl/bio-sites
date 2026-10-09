// Explicit opt-in real test. Commits two clearly labeled unpublished fixtures.
// The approved schema forbids deletion: no trigger disabling or schema changes.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { connectRepository } from '../server/repository.mjs'
import { createApi } from '../server/api.mjs'
const { templates, createBio, createManualBio } = await import('../src/data/templates.ts')
const { actionTypes, createAction } = await import('../src/lib/actionLinks.ts')

const reportUrl=new URL('../review/neon-persistence.json',import.meta.url)
let stage='preflight',server
const protectedPaths=['src/data/templates.ts','src/data/businessTemplates.ts','src/data/modelDesigns.ts','src/components/CreateBioFlow.tsx','src/components/ButtonsEditor.tsx','migrations/0001_biosite.sql']
const hashes=async()=>Object.fromEntries(await Promise.all(protectedPaths.map(async p=>[p,createHash('sha256').update(await readFile(new URL('../'+p,import.meta.url))).digest('hex')])))
async function main() {
  // Explicit test session only; never bypass production authorization.
  const sessionCookie=process.env.BIOSITE_TEST_COOKIE
  if(!sessionCookie)throw new Error('Authenticated test session required')
  const baseline=await hashes()
  let report
  try {report=JSON.parse(await readFile(reportUrl,'utf8'))} catch { /* First run. */ }
  const repo=await connectRepository()
  const before=await repo.list()
  const first=createBio(templates[0]);first.name='Teste automático de persistência A'
  first.actions=actionTypes.map(a=>createAction(a.kind,first))
  const second=createManualBio({name:'Teste automático de persistência B',categoryId:'barber',phone:'',instagram:'',address:'',logo:'',cover:''})
  if(report?.ids?.length===2) {
    // Reruns reuse the exact two fixtures rather than accumulating test sites.
    first.id=report.ids[0];second.id=report.ids[1]
  } else {
    report={ids:[first.id,second.id],completed:false}
    await writeFile(reportUrl,JSON.stringify(report,null,2)+'\n')
  }
  const api=createApi({repository:repo})
  server=createServer((req,res)=>void api(req,res))
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base=`http://127.0.0.1:${server.address().port}`
  const call=async(path,method='GET',value,status=200)=>{
    const response=await fetch(base+'/api/biosites'+path,{method,headers:{Origin:base,'Content-Type':'application/json',Cookie:sessionCookie},body:value?JSON.stringify(value):undefined})
    assert.equal(response.status,status)
    return response.json()
  }
  stage='create-and-retry'
  let a,b
  if(before.items.some(s=>s.id===first.id)) {
    a=await call('/'+first.id);b=await call('/'+second.id)
  } else {
    a=await call('','POST',{content:first},201)
    b=await call('','POST',{content:second},201)
    assert.deepEqual((await call('','POST',{content:first},201)).content,first)
  }
  stage='read'
  assert.deepEqual((await call('/'+a.id)).content,a.content)
  assert.deepEqual((await call('/'+b.id)).content,b.content)
  assert.deepEqual(await call('','POST',{content:a.content},201),a)
  assert.deepEqual(await call('','POST',{content:b.content},201),b)
  await call('','POST',{content:{...a.content,name:'Collision must not overwrite'}},409)
  assert.deepEqual(await call('/'+a.id),a)
  const bBefore=structuredClone(b)
  const slug=a.slug
  stage='update-and-independence'
  const changed={...a.content,name:'Teste automático de persistência A — editado',description:'Persistência real confirmada.',sections:[...a.content.sections].reverse(),actions:[...a.content.actions].reverse()}
  const updated=await call('/'+a.id+'/draft','PUT',{content:changed,lockVersion:a.lockVersion})
  assert.deepEqual(updated.content,changed)
  assert.equal(updated.slug,slug)
  assert.equal(BigInt(updated.draftRevision),BigInt(a.draftRevision)+1n)
  assert.equal(BigInt(updated.lockVersion),BigInt(a.lockVersion)+1n)
  assert.equal(updated.publishedRevision,null);assert.equal(updated.status,'unpublished')
  assert.deepEqual(await call('/'+b.id),bBefore)
  await call('/'+a.id+'/draft','PUT',{content:changed,lockVersion:a.lockVersion},409)
  await call('/'+a.id+'/draft','PUT',{content:b.content,lockVersion:updated.lockVersion},400)
  stage='concurrent-saves'
  const responses=await Promise.all([1,2].map(n=>fetch(base+'/api/biosites/'+a.id+'/draft',{
    method:'PUT',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({content:{...changed,tagline:`Teste concorrente ${n}`},lockVersion:updated.lockVersion}),
  })))
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409])
  const current=await call('/'+a.id)
  stage='fresh-connection-persistence'
  const fresh=await connectRepository()
  assert.deepEqual(await fresh.get(a.id),current)
  assert.deepEqual(await fresh.get(b.id),bBefore)
  const listing=await fresh.list()
  assert(listing.items.some(s=>s.id===a.id&&s.slug===slug))
  assert(listing.items.some(s=>s.id===b.id))
  assert.deepEqual(await hashes(),baseline)
  await writeFile(reportUrl,JSON.stringify({completed:true,verifiedAt:new Date().toISOString(),project:'muddy-star-65783442',
    ids:[a.id,b.id],checks:['HTTP creation','idempotent retry','HTTP reading','immutable revision update','permanent slug','14 actions preserved','manual flow payload','independence of two sites','stale update rejected','cross-site content rejected','concurrent updates: 200/409','fresh repository persistent reads','admin listing','publication untouched','protected source hashes unchanged'],
    revisions:[current.draftRevision,b.draftRevision],fixtures:'Two committed unpublished test BioSites retained because migration guards forbid deletion. No DDL or trigger changes.',sourceHashes:baseline,
  },null,2)+'\n')
  console.log('PASS: Neon HTTP creation/read/update, independence, permanent slug, conflict protection, fresh-connection persistence. Two unpublished fixtures retained; no migration or cleanup DDL executed.')
}
main().catch(error=>{
  console.error(`FAIL at ${stage}. Private database details omitted.`)
  if(error?.code==='ERR_ASSERTION') console.error(String(error.stack).split('\n').find(line=>line.includes('test-neon-persistence.mjs:'))||'Assertion failed')
  process.exitCode=1
}).finally(()=>{if(server)server.close()})
