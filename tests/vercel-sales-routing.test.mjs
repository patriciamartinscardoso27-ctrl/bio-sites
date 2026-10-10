import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {applicationRequestUrl} from '../server/vercel-routing.mjs'
import {salesFilters} from '../server/sales.mjs'
import {createApi} from '../server/api.mjs'

test('Vercel rewrite removes its path metadata and preserves valid sales filters',()=>{
 for(const query of ['', '&from=2026-10-01&to=2026-10-09','&status=paid','&method=pix','&from=2026-10-01&status=pending&method=card']){
  const url=applicationRequestUrl('/api/handler?route=%2Fapi%2Fsales&path=sales'+query)
  const params=new URL(url,'https://test.invalid').searchParams
  assert.deepEqual(salesFilters(params,{role:'buyer'}),Object.fromEntries(new URLSearchParams(query)))
 }
 assert.equal(applicationRequestUrl('/api/sales?status=paid'),'/api/sales?status=paid')
})
test('invalid routing and unknown, duplicate, or unauthorized filters remain rejected',()=>{
 for(const url of ['/api/handler?route=/api/sales&path=users','/api/handler?route=/api/sales&path=sales&path=sales','/api/handler?route=/api/sales&route=/api/users','/api/handler?route=/api/../users'])assert.equal(applicationRequestUrl(url),null)
 for(const q of ['evil=true','status=paid&status=pending','method=invalid','ownerId=11111111-1111-4111-8111-111111111111'])assert.throws(()=>salesFilters(new URLSearchParams(q),{role:'buyer'}))
})
test('real HTTP API receives cleaned filters while authentication and buyer permissions remain enforced',async t=>{
 let calls=0
 const api=createApi({requestAllowed:()=>true,getAuth:async()=>({session:async req=>req.headers['x-fixture']?{id:'buyer-fixture',role:'buyer',status:'active'}:null}),repository:{forActor:actor=>({sales:{list:async params=>{assert.equal(actor.id,'buyer-fixture');calls++;return {filters:salesFilters(params,actor),items:[]}}}})}})
 const server=createServer((req,res)=>{const url=applicationRequestUrl(req.url);if(url===null){res.statusCode=404;return res.end()}req.url=url;return api(req,res)})
 await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>server.close(r)))
 const base='http://127.0.0.1:'+server.address().port+'/api/handler?route=/api/sales&path=sales'
 for(const filters of ['', '&from=2026-10-01&to=2026-10-09','&status=paid','&method=pix']){const r=await fetch(base+filters,{headers:{'x-fixture':'buyer'}});assert.equal(r.status,200);assert.deepEqual((await r.json()).filters,Object.fromEntries(new URLSearchParams(filters)))}
 assert.equal((await fetch(base)).status,401)
 assert.equal((await fetch(base+'&ownerId=11111111-1111-4111-8111-111111111111',{headers:{'x-fixture':'buyer'}})).status,403)
 assert.equal((await fetch(base+'&unknown=1',{headers:{'x-fixture':'buyer'}})).status,400)
 assert.equal(calls,6)
})
