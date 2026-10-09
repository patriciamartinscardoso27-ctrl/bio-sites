import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import {createServer} from 'node:http'
import {createApi} from '../server/api.mjs'
import {createAppServer} from '../server/http-server.mjs'
import {isolatedRepository} from '../scripts/publication-isolated-repository.mjs'
import {validateSlug,publicContent,assertPublishable} from '../server/publication.mjs'
import {hostedRequest} from '../server/config.mjs'
import {createRepository} from '../server/repository.mjs'
const {readyTemplates,createBio}=await import('../src/data/templates.ts')
test('slug grammar, audit draft protection and public allowlist',()=>{
 for(const bad of ['../admin','Uppercase','two--parts','-start','end-','a'.repeat(101),'x?y','x/y','x%2Fy'])assert.throws(()=>validateSlug(bad))
 assert.equal(validateSlug('xavier-modas-123'),'xavier-modas-123');const bio=createBio(readyTemplates[0]);bio.client={notes:'INTERNAL PRIVATE',responsible:'PRIVATE'};bio.secret='DO NOT EXPOSE';assert(!JSON.stringify(publicContent(bio)).includes('PRIVATE'));assert(!publicContent(bio).secret)
 assert.throws(()=>assertPublishable({id:'046190c7-5a53-4354-9115-3b64fc5e042e',content:{name:'Renamed'}}));assert.throws(()=>assertPublishable({id:crypto.randomUUID(),content:{name:'TESTE AUDITORIA'}}))
})
test('configured hosted origin rejects rebinding, forged origins and unsigned mutations',()=>{const old=process.env.PUBLIC_SITE_ORIGIN;process.env.PUBLIC_SITE_ORIGIN='https://biosites.example.com';try{const request={method:'GET',headers:{host:'biosites.example.com'}};assert(hostedRequest(request));assert(!hostedRequest({...request,headers:{host:'evil.example'}}));assert(!hostedRequest({...request,method:'POST'}));assert(hostedRequest({...request,method:'POST',headers:{...request.headers,origin:'https://biosites.example.com'}}));assert(!hostedRequest({...request,method:'POST',headers:{...request.headers,origin:'https://evil.example'}}))}finally{if(old===undefined)delete process.env.PUBLIC_SITE_ORIGIN;else process.env.PUBLIC_SITE_ORIGIN=old}})
test('Neon publication SQL selects only published pointer, uses optimistic locks and keeps revisions immutable',async()=>{
 const queries=[],sql=(strings,...values)=>({text:strings.join('?'),values});let next
 sql.transaction=async rows=>{queries.push(...rows);return [next]};const db=createRepository(sql,{publicationWritesEnabled:true}),bio=createBio(readyTemplates[0]),saved={id:bio.id,content:bio,slug:'test-slug'}
 db.get=async()=>saved;next=[{slug:'test-slug',content:{...bio,client:{notes:'PRIVATE'}},revision:'1'}];assert(!(await db.getPublished('test-slug')).content.client);assert.match(queries.at(-1).text,/r.version=b.published_revision/);assert.match(queries.at(-1).text,/b.status='published'/)
 next=[{id:bio.id}];await db.publish(bio.id,'2','2');assert.match(queries.at(-1).text,/published_revision=b.draft_revision/);assert.match(queries.at(-1).text,/lock_version=/);assert.match(queries.at(-1).text,/draft_revision=/);assert(!queries.some(q=>/INSERT INTO public.biosite_revisions/.test(q.text)))
 await db.unpublish(bio.id,'3');assert.match(queries.at(-1).text,/status='unpublished'/);assert(!/published_revision=/.test(queries.at(-1).text));await assert.rejects(createRepository(sql).publish(bio.id,'1','1'),e=>e.status===403)
})
test('real isolated HTTP: create/save/publish, anonymous reading, update, conflict, unpublish and durable reopen',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'biosite-publication-')),file=path.join(directory,'state.json'),repository=await isolatedRepository(file)
 const getAuth=async()=>({session:async req=>req.headers.cookie==='test-admin=yes'?{id:'isolated-admin'}:null}),api=createApi({repository,getAuth}),server=createServer((req,res)=>void api(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true})});const base='http://127.0.0.1:'+server.address().port
 const call=async(route,{method='GET',value,auth=true,status=200,origin=base}={})=>{const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',Origin:origin,...(auth?{Cookie:'test-admin=yes'}:{})},body:value?JSON.stringify(value):undefined});assert.equal(response.status,status,route);assert.equal(response.headers.get('cache-control'),'no-store');return response.json()}
 const first=createBio(readyTemplates[0]);first.name='Demo publication';first.client={notes:'NEVER PUBLIC'};const second=createBio(readyTemplates[0]);second.name='Demo publication'
 let a=await call('/api/biosites',{method:'POST',value:{content:first},status:201}),b=await call('/api/biosites',{method:'POST',value:{content:second},status:201});assert.notEqual(a.slug,b.slug)
 await call('/api/public/biosites/'+a.slug,{auth:false,status:404});await call('/api/biosites/'+a.id,{auth:false,status:401});await call('/api/biosites/'+a.id+'/publish',{method:'POST',value:{lockVersion:a.lockVersion,draftRevision:a.draftRevision},auth:false,status:401})
 const originalSlug=a.slug;a=await call('/api/biosites/'+a.id+'/draft',{method:'PUT',value:{lockVersion:a.lockVersion,content:{...a.content,description:'PUBLISHED ONE'}}});a=await call('/api/biosites/'+a.id+'/publish',{method:'POST',value:{lockVersion:a.lockVersion,draftRevision:a.draftRevision}})
 const published=await call('/api/public/biosites/'+a.slug,{auth:false});assert.equal(published.content.description,'PUBLISHED ONE');assert(!JSON.stringify(published).includes('NEVER PUBLIC'));assert(!('lockVersion'in published));assert.equal(a.slug,originalSlug)
 a=await call('/api/biosites/'+a.id+'/draft',{method:'PUT',value:{lockVersion:a.lockVersion,content:{...a.content,description:'DRAFT TWO'}}});assert.equal((await call('/api/public/biosites/'+a.slug,{auth:false})).content.description,'PUBLISHED ONE')
 await call('/api/biosites/'+a.id+'/publish',{method:'POST',value:{lockVersion:'1',draftRevision:'1'},status:409});a=await call('/api/biosites/'+a.id+'/publish',{method:'POST',value:{lockVersion:a.lockVersion,draftRevision:a.draftRevision}});assert.equal((await call('/api/public/biosites/'+a.slug,{auth:false})).content.description,'DRAFT TWO')
 const reopened=await isolatedRepository(file);assert.deepEqual(await reopened.get(a.id),a);assert.equal((await reopened.getPublished(a.slug)).content.description,'DRAFT TWO');assert.deepEqual(await reopened.get(b.id),b)
 await call('/api/biosites/'+a.id+'/unpublish',{method:'POST',value:{lockVersion:a.lockVersion,content:first},status:400});a=await call('/api/biosites/'+a.id+'/unpublish',{method:'POST',value:{lockVersion:a.lockVersion}});assert.equal(a.slug,originalSlug);await call('/api/public/biosites/'+a.slug,{auth:false,status:404});await call('/api/public/biosites/'+b.slug,{auth:false,status:404})
})
test('public route serves real application without calling admin guard; private routes still guard',async t=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'biosite-route-'));await fs.writeFile(path.join(directory,'index.html'),'<div id="root">real application</div>');let privateChecks=0
 const server=createAppServer({dist:directory,api:(_req,_res,next)=>next(),pageGuard:(req,res,next)=>{if(req.url.startsWith('/b/'))return next();privateChecks++;res.writeHead(302,{Location:'/login'});res.end()}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(async()=>{await new Promise(resolve=>server.close(resolve));await fs.rm(directory,{recursive:true})});const base='http://127.0.0.1:'+server.address().port
 const response=await fetch(base+'/b/xavier-modas');assert.equal(response.status,200);assert.match(await response.text(),/real application/);assert.equal(privateChecks,0);assert.equal((await fetch(base+'/admin',{redirect:'manual'})).status,302)
})

