import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createServer} from 'node:http'
import {randomUUID} from 'node:crypto'
import {PGlite} from '@electric-sql/pglite'
import {createRepository} from '../server/repository.mjs'
import {createUsers,sendInvitation,hashInvite,createInviteMailer} from '../server/multiuser.mjs'
import {createApi} from '../server/api.mjs'
import {createAdminAuth} from '../server/auth.mjs'
import {NEON_AUTH_SESSION_COOKIE_NAME as cookie} from '@neondatabase/auth/server'
const {readyTemplates,createBio}=await import('../src/data/templates.ts')

function postgres(db){
 const sql=(strings,...values)=>{let text='',args=[];strings.forEach((part,i)=>{text+=part;if(i<values.length){const value=values[i];if(value?.sql){const offset=args.length;text+=value.text.replace(/\$(\d+)/g,(_,n)=>'$'+(+n+offset));args.push(...value.values)}else{args.push(value);text+='$'+args.length}}});return {sql:true,text,values:args}}
 sql.transaction=async queries=>{await db.exec('BEGIN');try{const rows=[];for(const q of queries)rows.push((await db.query(q.text,q.values)).rows);await db.exec('COMMIT');return rows}catch(e){await db.exec('ROLLBACK');throw e}};return sql
}
test('real PostgreSQL and HTTP: owners, ID attacks, publication, block, invitation and principal management',async t=>{
 const db=new PGlite();await db.exec(await fs.readFile('migrations/0001_biosite.sql','utf8'))
 const principalId=randomUUID(),buyerA=randomUUID(),buyerB=randomUUID()
 await db.exec('CREATE SCHEMA neon_auth;CREATE TABLE neon_auth."user"(id text,name text,email text)')
 await db.query('INSERT INTO neon_auth."user" VALUES($1,$2,$3)',[principalId,'Principal','root@example.invalid'])
 await db.query("SELECT set_config('biosites.principal_auth_id',$1,false)",[principalId]);await db.exec(await fs.readFile('migrations/0002_multiuser.sql','utf8'))
 await db.exec('INSERT INTO public.biosite_admin(singleton) VALUES(true)')
 await db.query("INSERT INTO public.biosite_users(auth_id,name,email,role,status) VALUES($1,'A','a@example.invalid','buyer','active'),($2,'B','b@example.invalid','buyer','active')",[buyerA,buyerB])
 const sql=postgres(db),users=createUsers(sql),repository=createRepository(sql,{multiuserEnabled:true,publicationWritesEnabled:true}),mails=[];let aiCalls=0
 const api=createApi({repository,users:async()=>users,getMailer:async()=>({configured:true,send:async value=>mails.push(value)}),getAuth:async()=>({multiuser:true,session:async req=>users.resolve(req.headers['x-fixture-user']||'')}),vision:{status:async()=>{aiCalls++;return {}},analyze:async()=>{aiCalls++;return {}}}})
 const server=createServer(api);await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port
 t.after(async()=>{await new Promise(r=>server.close(r));await db.close()})
 const call=async(path,{user=buyerA,method='GET',value,status=200}={})=>{const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json','x-fixture-user':user},body:value===undefined?undefined:JSON.stringify(value)});const data=await r.json();assert.equal(r.status,status,JSON.stringify({path,data}));return data}
 await call('/api/auth/sign-up/email',{user:'',method:'POST',value:{email:'without-invite@example.invalid',password:'INVALID FIXTURE'},status:404})
 await call('/api/biosites',{user:randomUUID(),status:401})
 const bioA=createBio(readyTemplates[0]),bioB=createBio(readyTemplates[1]);bioA.client={notes:'PRIVATE A'};bioB.client={notes:'PRIVATE B'}
 let a=await call('/api/biosites',{method:'POST',value:{content:bioA},status:201}),b=await call('/api/biosites',{user:buyerB,method:'POST',value:{content:bioB},status:201})
 assert.deepEqual((await call('/api/biosites')).items.map(x=>x.id),[a.id]);assert.equal((await call('/api/biosites',{user:principalId})).items.length,2)
 for(const method of ['GET','PUT'])await call('/api/biosites/'+b.id+(method==='PUT'?'/draft':method==='POST'?'/publish':''),{method,value:method==='GET'?undefined:method==='PUT'?{content:b.content,lockVersion:b.lockVersion}:{content:b.content,lockVersion:b.lockVersion,draftRevision:b.draftRevision},status:404})
 await call('/api/biosites/'+b.id+'/publish',{method:'POST',value:{lockVersion:b.lockVersion,draftRevision:b.draftRevision},status:404})
 await call('/api/biosites',{method:'POST',value:{content:bioB},status:409}) // collision cannot capture another owner's ID
 await call('/api/biosites',{method:'POST',value:{content:createBio(readyTemplates[0]),ownerId:buyerB},status:400})
 a=await call('/api/biosites/'+a.id+'/draft',{method:'PUT',value:{content:{...a.content,description:'A changed'},lockVersion:a.lockVersion}})
 assert.equal((await call('/api/biosites/'+b.id,{user:buyerB})).content.description,b.content.description)
 a=await call('/api/biosites/'+a.id+'/publish',{method:'POST',value:{lockVersion:a.lockVersion,draftRevision:a.draftRevision}})
 const published=await call('/api/public/biosites/'+a.slug,{user:''});assert.equal(published.content.description,'A changed');assert(!JSON.stringify(published).includes('PRIVATE A'))
 await call('/api/public/biosites/'+b.slug,{user:'',status:404})
 await call('/api/reference/status',{status:403});await call('/api/reference/analyze',{method:'POST',value:{},status:403});assert.equal(aiCalls,0)
 await call('/api/reference/status',{user:principalId});assert.equal(aiCalls,1)
 await call('/api/users',{status:403});await call('/api/users/invite',{method:'POST',value:{name:'X',email:'x@example.invalid'},status:403})
 await call('/api/users/invite-link',{method:'POST',value:{name:'Manual',email:'manual@example.invalid'},status:403})
 const manual=await call('/api/users/invite-link',{user:principalId,method:'POST',value:{name:'Manual',email:'manual@example.invalid'},status:201})
 assert.equal(mails.length,0);assert.equal(manual.validForHours,48)
 const manualToken=new URL(manual.url).hash.slice(1),manualUser=await users.inspect(manualToken)
 const renewed=await call('/api/users/invite-link',{user:principalId,method:'POST',value:{name:'Manual',email:manualUser.email,userId:manualUser.userId},status:201})
 await assert.rejects(users.inspect(manualToken),e=>e.status===400)
 const renewedToken=new URL(renewed.url).hash.slice(1)
 await users.accept(renewedToken,randomUUID(),manualUser.email);await assert.rejects(users.inspect(renewedToken),e=>e.status===400)
 const root=await users.resolve(principalId),accountA=await users.resolve(buyerA)
 await call('/api/users/'+root.userId+'/status',{user:principalId,method:'POST',value:{status:'blocked'},status:404})
 await call('/api/users/'+accountA.userId+'/status',{user:principalId,method:'POST',value:{status:'blocked'}})
 await call('/api/biosites',{status:401});await call('/api/public/biosites/'+a.slug,{user:''})
 await call('/api/users/'+accountA.userId+'/status',{user:principalId,method:'POST',value:{status:'active'}})
 assert.equal((await call('/api/biosites')).items.length,1)
 await call('/api/biosites?ownerId='+accountA.userId,{status:403})
 assert.equal((await call('/api/biosites?ownerId='+accountA.userId,{user:principalId})).items.length,1)
 await call('/api/users/invite',{user:principalId,method:'POST',value:{name:'Invited',email:'invited@example.invalid'},status:201});assert.equal(mails.length,1)
 const token=new URL(mails[0].url).hash.slice(1),target=await users.inspect(token);assert.equal(target.email,'invited@example.invalid');assert.equal(token.length,43)
 const stored=(await db.query('SELECT token_hash FROM public.biosite_invitations WHERE token_hash=$1',[hashInvite(token)])).rows[0];assert.equal(stored.token_hash,hashInvite(token));assert(!JSON.stringify(stored).includes(token))
 await users.accept(token,randomUUID(),target.email);await assert.rejects(users.inspect(token),e=>e.status===400);await assert.rejects(users.accept(token,randomUUID(),target.email),e=>e.status===400)
 await assert.rejects(sendInvitation(users,root,{name:'Missing','email':'missing@example.invalid'},base,{configured:false}),e=>e.status===503)
 const rows=(await db.query("SELECT * FROM public.biosite_users WHERE email='missing@example.invalid'")).rows;assert.equal(rows.length,0)
 // Malformed/expired/revoked invitations cannot activate any account.
 await assert.rejects(users.inspect('bad'),e=>e.status===400)
 await sendInvitation(users,root,{name:'Expired',email:'expired@example.invalid'},base,{configured:true,send:async value=>mails.push(value)})
 const expired=new URL(mails.at(-1).url).hash.slice(1);await db.query("UPDATE public.biosite_invitations SET expires_at=now()-interval '1 second' WHERE token_hash=$1",[hashInvite(expired)]);await assert.rejects(users.inspect(expired),e=>e.status===400)
 await sendInvitation(users,root,{name:'Failure',email:'failure@example.invalid'},base,{configured:true,send:async()=>{throw Error('private provider detail')}}).then(()=>assert.fail(),e=>assert(!e.message.includes('private')))
 assert.equal((await db.query("SELECT status FROM public.biosite_users WHERE email='failure@example.invalid'")).rows[0].status,'invited')
 await sendInvitation(users,root,{name:'Own password',email:'password@example.invalid'},base,{configured:true,send:async value=>mails.push(value)})
 const ownToken=new URL(mails.at(-1).url).hash.slice(1),newAuthId=randomUUID();let signups=0
 const inviteAuth=createAdminAuth({adminId:principalId,baseUrl:'https://provider.example.invalid',cookieSecret:'x'.repeat(48),invitationUsers:async()=>users,resolveAccount:id=>users.resolve(id),proxy:async({path,request})=>{assert.equal(path,'sign-up/email');const data=await request.json();assert.equal(data.password,'OWN PASSWORD FIXTURE');assert.equal(data.email,'password@example.invalid');assert(!('role'in data));signups++;return Response.json({user:{id:newAuthId,email:data.email}})}})
 const inviteReq={headers:{host:'localhost:5173'},socket:{remoteAddress:'127.0.0.1'}}
 assert.equal((await inviteAuth.inspectInvite(inviteReq,{}, {token:ownToken})).email,'password@example.invalid')
 await assert.rejects(inviteAuth.acceptInvite(inviteReq,{}, {token:ownToken,email:'other@example.invalid',password:'OWN PASSWORD FIXTURE'}),e=>e.status===400);assert.equal(signups,0)
 await assert.rejects(inviteAuth.acceptInvite(inviteReq,{}, {token:ownToken,email:'password@example.invalid',password:'OWN PASSWORD FIXTURE',role:'principal'}),e=>e.status===400);assert.equal(signups,0)
 assert.deepEqual(await inviteAuth.acceptInvite(inviteReq,{}, {token:ownToken,email:'password@example.invalid',password:'OWN PASSWORD FIXTURE'}),{ok:true});assert.equal(signups,1)
 assert.equal((await users.resolve(newAuthId)).role,'buyer')
 await assert.rejects(inviteAuth.acceptInvite(inviteReq,{}, {token:ownToken,email:'password@example.invalid',password:'OWN PASSWORD FIXTURE'}),e=>e.status===400);assert.equal(signups,1)
 assert.equal((await call('/api/biosites/'+a.id,{user:principalId})).content.description,'A changed')
 a=await call('/api/biosites/'+a.id+'/unpublish',{method:'POST',value:{lockVersion:a.lockVersion}});await call('/api/public/biosites/'+a.slug,{user:'',status:404})
 assert.equal(readyTemplates.length,76)
})
test('sessions validate membership on each request and never restore pre-block sessions',async()=>{
 const id=randomUUID(),adminId=randomUUID();let active=true,cutoff=null
 const data={user:{id},session:{userId:id,createdAt:new Date(Date.now()-60000).toISOString(),expiresAt:new Date(Date.now()+60000).toISOString()}}
 const auth=createAdminAuth({adminId,baseUrl:'https://example.invalid',cookieSecret:'x'.repeat(48),resolveAccount:async()=>active?{id,role:'buyer',status:'active',sessionValidAfter:cutoff}:null,proxy:async()=>Response.json(data)})
 const req={headers:{host:'localhost:5173',cookie:cookie+'=fixture'},socket:{remoteAddress:'127.0.0.1'}},res={getHeader:()=>[],setHeader:()=>{}}
 assert.equal((await auth.session(req,res)).role,'buyer');active=false;assert.equal(await auth.session(req,res),null)
 active=true;cutoff=new Date().toISOString();assert.equal(await auth.session(req,res),null)
 data.session.createdAt=new Date(Date.now()+1000).toISOString();assert.equal((await auth.session(req,res)).role,'buyer')
})
test('email transport uses server credentials, HTTPS and provider idempotency without logging tokens',async()=>{
 let sent;const mailer=createInviteMailer({key:'synthetic-fixture',from:'Bio Sites <test@example.invalid>',fetchImpl:async(url,options)=>{sent={url,options};return Response.json({id:'fixture'})}})
 await mailer.send({id:'invite-fixture',name:'Name',email:'recipient@example.invalid',url:'https://example.invalid/accept-invite#fixture'})
 assert.equal(sent.url,'https://api.resend.com/emails');assert.equal(sent.options.headers['Idempotency-Key'],'biosite-invite/invite-fixture');assert(!sent.options.body.includes('synthetic-fixture'))
})






