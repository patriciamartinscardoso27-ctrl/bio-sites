import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createServer} from 'node:http'
import {randomUUID} from 'node:crypto'
import {PGlite} from '@electric-sql/pglite'
import {createRepository} from '../server/repository.mjs'
import {createUsers} from '../server/multiuser.mjs'
import {createApi} from '../server/api.mjs'
import {parseSaleAmount,saleToday} from '../src/lib/sales.ts'
const {readyTemplates,createBio}=await import('../src/data/templates.ts')
function postgres(db){
 const sql=(strings,...values)=>{let text='',args=[];strings.forEach((part,i)=>{text+=part;if(i<values.length){const v=values[i];if(v?.sql){const offset=args.length;text+=v.text.replace(/\$(\d+)/g,(_,n)=>'$'+(+n+offset));args.push(...v.values)}else{args.push(v);text+='$'+args.length}}});return {sql:true,text,values:args}}
 sql.transaction=async queries=>{await db.exec('BEGIN');try{const result=[];for(const q of queries)result.push((await db.query(q.text,q.values)).rows);await db.exec('COMMIT');return result}catch(e){await db.exec('ROLLBACK');throw e}};return sql
}
test('BRL parsing is exact in cents and rejects ambiguous/invalid values',()=>{
 for(const [s,n] of [['0,01',1],['350,00',35000],['10,5',1050],['1200',120000],['R$ 2,99',299]])assert.equal(parseSaleAmount(s),n)
 for(const s of ['0','-1','1,001','NaN','1e3','10.50','1.000,00','999999999999999999'])assert.equal(parseSaleAmount(s),null)
})
test('isolated additive migration/rollback and real HTTP/RLS sales lifecycle, totals and ownership',async t=>{
 const db=new PGlite();await db.exec(await fs.readFile('migrations/0001_biosite.sql','utf8'))
 const root=randomUUID(),a=randomUUID(),b=randomUUID()
 await db.exec('CREATE SCHEMA neon_auth;CREATE TABLE neon_auth."user"(id text,name text,email text)')
 await db.query('INSERT INTO neon_auth."user" VALUES($1,$2,$3)',[root,'Principal','root@example.invalid'])
 await db.query("SELECT set_config('biosites.principal_auth_id',$1,false)",[root]);await db.exec(await fs.readFile('migrations/0002_multiuser.sql','utf8'))
 await db.exec('INSERT INTO public.biosite_admin(singleton) VALUES(true)')
 await db.query("INSERT INTO public.biosite_users(auth_id,name,email,role,status) VALUES($1,'A','a@example.invalid','buyer','active'),($2,'B','b@example.invalid','buyer','active')",[a,b])
 const sql=postgres(db),users=createUsers(sql),repo=createRepository(sql,{multiuserEnabled:true,publicationWritesEnabled:true})
 const actorA=await users.resolve(a),actorB=await users.resolve(b),actorRoot=await users.resolve(root)
 const bios=[];for(const [user,index] of [[actorA,0],[actorB,1],[actorRoot,2]])bios.push(await repo.forActor(user).create(createBio(readyTemplates[index])))
 const fingerprints=async()=>JSON.stringify((await db.query("SELECT 'sites' k,md5(string_agg(row_to_json(t)::text,'' ORDER BY id)) h FROM biosites t UNION ALL SELECT 'revisions',md5(string_agg(row_to_json(t)::text,'' ORDER BY biosite_id,version)) FROM biosite_revisions t UNION ALL SELECT 'users',md5(string_agg(row_to_json(t)::text,'' ORDER BY id)) FROM biosite_users t")).rows)
 const before=await fingerprints(),triggers=(await db.query("SELECT tgname,tgenabled FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname")).rows
 const migration=await fs.readFile('migrations/0003_sales.sql','utf8'),rollback=await fs.readFile('migrations/0003_sales.rollback.sql','utf8')
 await db.exec(migration);assert.equal(await fingerprints(),before)
 await db.exec(rollback);assert.equal(await fingerprints(),before)
 assert.deepEqual((await db.query("SELECT tgname,tgenabled FROM pg_trigger WHERE NOT tgisinternal ORDER BY tgname")).rows,triggers)
 await db.exec(migration)
 const api=createApi({repository:repo,getAuth:async()=>({multiuser:true,session:async req=>users.resolve(req.headers['x-fixture-user']||'')}),users:async()=>users})
 const server=createServer(api);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port
 t.after(async()=>{await new Promise(r=>server.close(r));await db.close()})
 const call=async(path,{user=a,method='GET',value,status=200}={})=>{const res=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json','x-fixture-user':user},body:value===undefined?undefined:JSON.stringify(value)});const data=await res.json();assert.equal(res.status,status,JSON.stringify({path,data}));return data}
 const fields={amountCents:10050,soldOn:saleToday(),paymentMethod:'pix',paymentStatus:'pending',notes:'LOCAL A'}
 await call('/api/sales',{user:'',status:401})
 let saleA=await call('/api/sales',{method:'POST',value:{...fields,biositeId:bios[0].id},status:201})
 const saleB=await call('/api/sales',{user:b,method:'POST',value:{...fields,amountCents:20000,paymentStatus:'paid',paymentMethod:'card',biositeId:bios[1].id},status:201})
 const saleRoot=await call('/api/sales',{user:root,method:'POST',value:{...fields,amountCents:5000,soldOn:'2020-01-01',biositeId:bios[2].id},status:201})
 assert.equal(saleA.ownerId,actorA.userId);assert.equal(saleB.ownerId,actorB.userId)
 assert.equal((await call('/api/sales')).items.length,1)
 let all=await call('/api/sales',{user:root});assert.equal(all.items.length,3);assert.equal(all.totals.totalCents,35050);assert.equal(all.totals.receivedCents,20000);assert.equal(all.totals.pendingCents,15050);assert.equal(all.totals.todayCount,2);assert.equal(all.totals.monthCount,2);assert.equal(all.totals.todayCents,30050)
 assert.equal(all.chart.reduce((sum,x)=>sum+x.amountCents,0),35050)
 for(const path of ['/api/sales/'+saleB.id,'/api/sales/by-biosite/'+bios[1].id])await call(path,{status:404})
 await call('/api/sales/'+saleB.id,{method:'PUT',value:{...fields,lockVersion:saleB.lockVersion},status:404})
 await call('/api/sales/'+saleB.id,{method:'DELETE',status:404})
 await call('/api/sales',{method:'POST',value:{...fields,biositeId:bios[1].id},status:404})
 await call('/api/sales?ownerId='+actorB.userId,{status:403})
 await call('/api/sales',{method:'POST',value:{...fields,biositeId:bios[0].id,ownerId:actorB.userId},status:400})
 await call('/api/sales',{method:'POST',value:{...fields,biositeId:bios[0].id},status:409})
 const stale=saleA.lockVersion
 saleA=await call('/api/sales/'+saleA.id,{method:'PUT',value:{...fields,paymentStatus:'paid',lockVersion:stale}})
 assert.notEqual(saleA.lockVersion,stale);assert.equal(saleA.paymentStatus,'paid')
 await call('/api/sales/'+saleA.id,{method:'PUT',value:{...fields,lockVersion:stale},status:409})
 assert.equal((await call('/api/sales/by-biosite/'+bios[0].id)).sale.paymentStatus,'paid')
 assert.equal((await call('/api/sales?status=paid&method=pix')).totals.totalCents,10050)
 assert.equal((await call('/api/sales?from=2019-01-01&to=2020-12-31',{user:root})).items[0].id,saleRoot.id)
 assert.equal((await call('/api/sales?ownerId='+actorB.userId,{user:root})).totals.totalCents,20000)
 for(const query of ['from=2026-02-30','from=2026-02-01&to=2020-01-01','status=x','ownerId=invalid','method=pix&method=card'])await call('/api/sales?'+query,{user:root,status:400})
 for(const invalid of [{amountCents:1.1},{amountCents:0},{amountCents:-1},{amountCents:1e12},{soldOn:'2026-02-30'},{paymentMethod:'gemini'},{paymentStatus:'x'},{notes:'x'.repeat(5001)}])await call('/api/sales/'+saleA.id,{method:'PUT',value:{...fields,lockVersion:saleA.lockVersion,...invalid},status:400})
 await db.exec('BEGIN;SET LOCAL ROLE biosites_app_runtime');await db.query("SELECT set_config('biosites.auth_id',$1,true)",[a])
 assert.deepEqual((await db.query('SELECT id FROM biosite_sales')).rows.map(x=>x.id),[saleA.id])
 assert.equal((await db.query("UPDATE biosite_sales SET notes='attack' WHERE id=$1 RETURNING id",[saleB.id])).rows.length,0)
 await assert.rejects(db.query('DELETE FROM biosite_sales WHERE id=$1',[saleA.id]));await db.exec('ROLLBACK')
 await db.exec('BEGIN;SET LOCAL ROLE biosites_app_runtime');await db.query("SELECT set_config('biosites.auth_id',$1,true)",[a])
 await assert.rejects(db.query('UPDATE biosite_sales SET owner_id=$1 WHERE id=$2',[actorB.userId,saleA.id]));await db.exec('ROLLBACK')
 const pub=await repo.forActor(actorA).publish(bios[0].id,bios[0].lockVersion,bios[0].draftRevision)
 await repo.forActor(actorA).publish(pub.id,pub.lockVersion,pub.draftRevision)
 assert.equal((await call('/api/sales')).items.length,1)
 assert(!JSON.stringify(await repo.getPublished(pub.slug)).includes('LOCAL A'))
 await users.status(actorRoot,actorA.userId,'blocked');await call('/api/sales',{status:401})
 await db.exec('BEGIN;SET LOCAL ROLE biosites_app_runtime');await db.query("SELECT set_config('biosites.auth_id',$1,true)",[a]);assert.equal((await db.query('SELECT id FROM biosite_sales')).rows.length,0);await db.exec('ROLLBACK')
 await assert.rejects(db.exec(rollback));await db.exec('ROLLBACK');assert.equal((await db.query('SELECT count(*)::int n FROM biosite_sales')).rows[0].n,3)
 all=await call('/api/sales',{user:root});assert.equal(all.totals.receivedCents,30050);assert.equal(all.totals.pendingCents,5000)
 assert.equal(readyTemplates.length,76)
})
