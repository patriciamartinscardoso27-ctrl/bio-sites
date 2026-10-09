import {createHash,randomBytes} from 'node:crypto'
import {neon} from '@neondatabase/serverless'
import {ApiError,isUuid} from './validation.mjs'
import {serverConfig} from './config.mjs'

export function principalOnly(actor){if(actor?.role!=='principal')throw new ApiError(403,'Recurso exclusivo do Administrador principal.')}
export const hashInvite=token=>createHash('sha256').update(token).digest('hex')
export function inviteToken(value){if(typeof value!=='string'||! /^[A-Za-z0-9_-]{43}$/.test(value))throw new ApiError(400,'Convite inválido ou expirado.');return value}
const view='id,name,email,role,status,created_at AS "createdAt"'
let pending
export async function getUsers(){pending??=(async()=>{const config=await serverConfig();return createUsers(neon(config.DATABASE_URL))})().catch(e=>{pending=undefined;throw e});return pending}
export function createUsers(sql){
 const tx=queries=>sql.transaction(queries,{fetchOptions:{signal:AbortSignal.timeout(20000)}})
 const execute=async query=>(await tx([query]))[0]
 const safe=async fn=>{try{return await fn()}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(503,'Não foi possível acessar as contas. Tente novamente.')}}
 const inspectHash=hash=>safe(async()=>{if(typeof hash!=='string'||!/^[a-f0-9]{64}$/.test(hash))throw new ApiError(400,'Convite inválido.');const rows=await execute(sql`SELECT u.id AS "userId",u.name,u.email FROM public.biosite_invitations i JOIN public.biosite_users u ON u.id=i.user_id WHERE i.token_hash=${hash} AND i.expires_at>now() AND i.consumed_at IS NULL AND i.revoked_at IS NULL AND i.delivery_status='sent' AND u.status='invited' AND u.role='buyer'`);if(!rows[0])throw new ApiError(400,'Convite inválido ou expirado.');return rows[0]})
 return {
  resolve:authId=>safe(async()=>{const rows=await execute(sql`SELECT id AS "userId",auth_id AS id,name,email,role,status,session_valid_after AS "sessionValidAfter" FROM public.biosite_users WHERE auth_id=${authId}`);return rows[0]?.status==='active'?rows[0]:null}),
  canRecover:email=>safe(async()=>Boolean((await execute(sql`SELECT 1 FROM public.biosite_users WHERE email=${email.toLowerCase()} AND status='active' AND auth_id IS NOT NULL`)).length)),
  list:actor=>safe(async()=>{principalOnly(actor);return {items:await execute(sql`SELECT id,name,email,role,status,created_at AS "createdAt",(SELECT count(*)::int FROM public.biosite_ownership o WHERE o.user_id=u.id) AS "siteCount" FROM public.biosite_users u ORDER BY created_at DESC`)}}),
  status: (actor,id,status)=>safe(async()=>{
   principalOnly(actor);if(!isUuid(id)||!['active','blocked'].includes(status))throw new ApiError(400,'Status inválido.')
   const [rows]=await tx([sql`WITH changed AS (UPDATE public.biosite_users SET status=${status},session_valid_after=CASE WHEN ${status}='blocked' THEN now() ELSE session_valid_after END WHERE id=${id}::uuid AND role='buyer' AND auth_id IS NOT NULL RETURNING id,name,email,role,status,created_at AS "createdAt"),event AS (INSERT INTO public.biosite_user_events(actor_id,user_id,action) SELECT ${actor.userId}::uuid,id,${status==='blocked'?'block':'reactivate'} FROM changed) SELECT * FROM changed`]);if(!rows.length)throw new ApiError(404,'Usuário não encontrado ou ainda não ativado.');return rows[0]
  }),
  prepare: (actor,{name,email,userId},token)=>safe(async()=>{
   principalOnly(actor);if(typeof name!=='string'||!name.trim()||name.length>150||typeof email!=='string'||email.length>256||!/^\S+@\S+\.\S+$/.test(email.trim())||(userId!==undefined&&!isUuid(userId)))throw new ApiError(400,'Informe nome e e-mail válidos.')
   email=email.trim().toLowerCase();name=name.trim();const hash=hashInvite(token)
   const existing=(await execute(sql`SELECT id,role,status FROM public.biosite_users WHERE email=${email}`))[0]
   if(existing&&(existing.role!=='buyer'||existing.status!=='invited'||userId!==existing.id))throw new ApiError(409,'Este e-mail já possui uma conta ou convite. Use Reenviar quando disponível.')
   if(userId&&!existing)throw new ApiError(404,'Convite não encontrado.')
   const [rows]=await tx([sql`WITH target AS (INSERT INTO public.biosite_users(name,email,role,status) VALUES(${name},${email},'buyer','invited') ON CONFLICT(email) DO UPDATE SET name=EXCLUDED.name WHERE biosite_users.role='buyer' AND biosite_users.status='invited' RETURNING id),revoked AS (UPDATE public.biosite_invitations SET revoked_at=now() WHERE user_id IN (SELECT id FROM target) AND consumed_at IS NULL AND revoked_at IS NULL),invitation AS (INSERT INTO public.biosite_invitations(user_id,token_hash,expires_at) SELECT id,${hash},now()+interval '48 hours' FROM target RETURNING id,user_id),event AS (INSERT INTO public.biosite_user_events(actor_id,user_id,action) SELECT ${actor.userId}::uuid,user_id,${existing?'resend':'invite'} FROM invitation) SELECT id,user_id AS "userId" FROM invitation`]);if(!rows[0])throw new ApiError(409,'A conta mudou. Recarregue.');return {...rows[0],name,email}
  }),
  delivery:(id,sent)=>safe(()=>execute(sql`UPDATE public.biosite_invitations SET delivery_status=${sent?'sent':'failed'} WHERE id=${id}::uuid`)),
  inspectHash,
  inspect:token=>safe(()=>inspectHash(hashInvite(inviteToken(token)))),
  accept:(token,authId,email)=>safe(async()=>{const [rows]=await tx([sql`WITH used AS (UPDATE public.biosite_invitations i SET consumed_at=now() FROM public.biosite_users u WHERE i.user_id=u.id AND i.token_hash=${hashInvite(inviteToken(token))} AND i.expires_at>now() AND i.consumed_at IS NULL AND i.revoked_at IS NULL AND i.delivery_status='sent' AND u.status='invited' AND u.role='buyer' AND u.email=${email.toLowerCase()} RETURNING i.user_id),activated AS (UPDATE public.biosite_users SET auth_id=${authId},status='active' WHERE id IN (SELECT user_id FROM used) AND role='buyer' AND status='invited' RETURNING id),event AS (INSERT INTO public.biosite_user_events(actor_id,user_id,action) SELECT id,id,'accept' FROM activated) SELECT id FROM activated`]);if(!rows.length)throw new ApiError(400,'Convite inválido ou já utilizado.');return {ok:true}}),
 }
}
export function createInviteMailer({key,from,fetchImpl=fetch}={}){
 return {configured:Boolean(key&&from),async send({email,name,url,id}){
  if(!key||!from)throw new ApiError(503,'Configure o serviço de e-mail antes de enviar convites.')
  const response=await fetchImpl('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json','Idempotency-Key':'biosite-invite/'+id},body:JSON.stringify({from,to:[email],subject:'Seu convite para o Bio Sites',text:`Olá, ${name}. Você recebeu acesso ao Bio Sites. Defina sua senha pelo link abaixo, válido por 48 horas:\n${url}\nSe não esperava este convite, ignore esta mensagem.`}),signal:AbortSignal.timeout(20000)})
  if(!response.ok)throw new ApiError(503,'Não foi possível enviar o convite. Confira o serviço de e-mail e tente reenviar.')
 }}
}
export async function sendInvitation(users,actor,value,origin,mailer){
 principalOnly(actor);if(!mailer.configured)throw new ApiError(503,'Configure o serviço de e-mail antes de enviar convites.')
 if(!value||Object.keys(value).some(k=>!['name','email','userId'].includes(k)))throw new ApiError(400,'Campos não permitidos.')
 const token=randomBytes(32).toString('base64url'),invite=await users.prepare(actor,value,token)
 try{await mailer.send({...invite,url:origin+'/accept-invite#'+token});await users.delivery(invite.id,true)}catch{await users.delivery(invite.id,false);throw new ApiError(503,'Convite não entregue. Você pode reenviar sem liberar acesso.')}
 return {ok:true,id:invite.id}
}
export async function generateManualInvitation(users,actor,value,origin){
 principalOnly(actor)
 if(!value||Object.keys(value).some(k=>!['name','email','userId'].includes(k)))throw new ApiError(400,'Campos não permitidos.')
 const token=randomBytes(32).toString('base64url'),invite=await users.prepare(actor,value,token)
 // Existing 'sent' state means released to the recipient; manual distribution needs no email provider.
 await users.delivery(invite.id,true)
 return {ok:true,id:invite.id,url:origin+'/accept-invite#'+token,validForHours:48,email:invite.email}
}
