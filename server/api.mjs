import { ApiError } from './validation.mjs'
import { connectRepository } from './repository.mjs'
import { getAuth as configuredAuth } from './auth.mjs'
import {createVisionService} from './vision-reference.mjs'
import {requestOrigin} from './config.mjs'
import {validateSlug} from './publication.mjs'
import {getUsers,principalOnly,createInviteMailer,sendInvitation,generateManualInvitation} from './multiuser.mjs'
import {serverConfig} from './config.mjs'
import {createHmac} from 'node:crypto'
import {getSignupGuard} from './signup-guard.mjs'

const maxBody = 32 * 1024 * 1024
// Neon Allow Localhost accepts localhost, not the numeric loopback alias.
// Keep browser Origin and provider callback on the same real origin.
export function canonicalLocalPage(req,res,next) {
  const path=(req.url||'/').split('?')[0]
  if(!['/','/login','/forgot-password','/reset-password','/admin'].includes(path)&&!path.startsWith('/admin/'))return next()
  if(!['GET','HEAD'].includes(req.method)||!localRequest(req))return next()
  const url=new URL(req.url,`http://${req.headers.host}`)
  if(url.hostname==='localhost')return next()
  url.hostname='localhost'
  res.writeHead(302,{Location:url.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer'});res.end()
}
export function localRequest(req) {
  const address = req.socket?.remoteAddress
  if (!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address)) return false
  let url
  try { url = new URL(`http://${req.headers.host}`) } catch { return false }
  if (!['127.0.0.1','localhost','[::1]'].includes(url.hostname) || url.username || url.password) return false
  // A redirected top-level HTML navigation may cross the loopback alias.
  // This exception never applies to API requests or writes.
  const pageNavigation=['GET','HEAD'].includes(req.method)&&req.headers['sec-fetch-mode']==='navigate'&&req.headers['sec-fetch-dest']==='document'&&!(req.url||'/').startsWith('/api/')
  if (req.headers['sec-fetch-site'] === 'cross-site'&&!pageNavigation) return false
  if (req.headers.origin && req.headers.origin !== url.origin) return false
  // Browser writes must carry a matching Origin. No wildcard CORS.
  return !['POST','PUT','PATCH','DELETE'].includes(req.method) || req.headers.origin === url.origin
}
async function body(req,limit=maxBody) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) throw new ApiError(415,'Envie conteúdo JSON.')
  if (Number(req.headers['content-length']) > limit) throw new ApiError(413,'Conteúdo muito grande. Reduza as imagens.')
  const chunks=[];let size=0
  for await (const chunk of req) {
    size+=chunk.length
    if (size > limit) throw new ApiError(413,'Conteúdo muito grande. Reduza as imagens.')
    chunks.push(chunk)
  }
  try {
    const value=JSON.parse(Buffer.concat(chunks).toString('utf8'))
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error()
    return value
  } catch { throw new ApiError(400,'JSON inválido.') }
}
export function createApi({ repository, getRepository = connectRepository, getAuth = configuredAuth, vision = createVisionService(),requestAllowed=localRequest,users=getUsers,signupGuard=getSignupGuard,getMailer=async()=>{const config=await serverConfig();return createInviteMailer({key:config.RESEND_API_KEY,from:config.BIOSITE_INVITE_FROM})} } = {}) {
  let pending
  const repo = async () => {
    if (repository) return repository
    pending ??= getRepository().catch(error => {pending=undefined;throw error})
    return pending
  }
  return async (req,res,next = () => {res.statusCode=404;res.end()}) => {
    const pathname = (req.url || '/').split('?')[0]
    let stage='request'
    if (!pathname.startsWith('/api/')) return next()
    const reply = (status,value) => {
      res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'})
      res.end(JSON.stringify(value))
    }
    try {
      // Neon is a server caller: authenticate the raw signed body, never browser Origin.
      if(pathname==='/api/webhooks/neon-auth'){
        if(req.method!=='POST')throw new ApiError(405,'Método não permitido.')
        if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']||''))throw new ApiError(415,'Envie conteúdo JSON.')
        const chunks=[];let size=0
        for await(const chunk of req){size+=chunk.length;if(size>32768)throw new ApiError(413,'Evento muito grande.');chunks.push(chunk)}
        return reply(200,await(await signupGuard())(Buffer.concat(chunks),req.headers))
      }
      if (!requestAllowed(req)) throw new ApiError(403,'Acesso permitido somente na origem configurada.')
      const publicMatch=/^\/api\/public\/biosites\/([^/]+)$/.exec(pathname)
      if(publicMatch&&req.method==='GET')return reply(200,await(await repo()).getPublished(validateSlug(publicMatch[1])))
      const auth=await getAuth()
      if(pathname==='/api/auth/invite-inspect'&&req.method==='POST')return reply(200,await auth.inspectInvite(req,res,await body(req,8192)))
      if(pathname==='/api/auth/invite-accept'&&req.method==='POST')return reply(200,await auth.acceptInvite(req,res,await body(req,8192)))
      if(pathname==='/api/auth/request-password-reset'&&req.method==='POST')return reply(200,await auth.requestReset(req,res,await body(req,8192)))
      if(pathname==='/api/auth/reset-password'&&req.method==='POST')return reply(200,await auth.resetPassword(req,res,await body(req,8192)))
      if(pathname==='/api/auth/session'&&req.method==='GET')return reply(200,{authenticated:Boolean(await auth.session(req,res))})
      if(pathname==='/api/auth/login'&&req.method==='POST'){
        stage='login.body';const value=await body(req,8192)
        stage='login.auth';const result=await auth.login(req,res,value)
        stage='login.reply';return reply(200,result)
      }
      if(pathname==='/api/auth/logout'&&req.method==='POST')return reply(200,await auth.logout(req,res))
      if(pathname.startsWith('/api/auth/'))throw new ApiError(404,'Rota não encontrada.')
      const session=await auth.session(req,res)
      if(!session)throw new ApiError(401,'Entre como Admin para continuar.')
      if(pathname==='/api/account'&&req.method==='GET'){
        let backupKey
        if(session.multiuser){const config=await serverConfig();if(!config.NEON_AUTH_COOKIE_SECRET)throw new ApiError(503,'Configuração de proteção local indisponível.');backupKey=createHmac('sha256',config.NEON_AUTH_COOKIE_SECRET).update('biosite-backup-v1:'+session.id).digest('hex')}
        return reply(200,{id:session.id,name:session.name||'Administrador',email:session.email||'',role:session.role,multiuser:Boolean(session.multiuser),...(backupKey?{backupKey}:{})})
      }
      if(pathname.startsWith('/api/users')){
        principalOnly(session);if(!auth.multiuser)throw new ApiError(503,'Multiusuário aguarda ativação após a migration aprovada.')
        const accounts=await users()
        if(pathname==='/api/users'&&req.method==='GET')return reply(200,await accounts.list(session))
        if(pathname==='/api/users/invite-link'&&req.method==='POST')return reply(201,await generateManualInvitation(accounts,session,await body(req,8192),requestOrigin(req)))
        if(pathname==='/api/users/invite'&&req.method==='POST')return reply(201,await sendInvitation(accounts,session,await body(req,8192),requestOrigin(req),await getMailer()))
        const userStatus=/^\/api\/users\/([^/]+)\/status$/.exec(pathname)
        if(userStatus&&req.method==='POST'){const value=await body(req,8192);if(Object.keys(value).some(k=>k!=='status'))throw new ApiError(400,'Campos não permitidos.');return reply(200,await accounts.status(session,userStatus[1],value.status))}
        throw new ApiError(404,'Rota não encontrada.')
      }
      // Check permissions before parsing uploads or invoking any Gemini provider operation.
      if(pathname.startsWith('/api/reference/'))principalOnly(session)
      const scopedRepo=async(ownerId)=>{const db=await repo();return db.forActor?db.forActor(session,ownerId):db}
      if(pathname==='/api/publication/config'&&req.method==='GET')return reply(200,{origin:requestOrigin(req),writesEnabled:Boolean((await repo()).publicationWritesEnabled)})
      const publication=/^\/api\/biosites\/([^/]+)\/(publish|unpublish)$/.exec(pathname)
      if(publication&&req.method==='POST'){
        const value=await body(req,8192),allowed=publication[2]==='publish'?['lockVersion','draftRevision']:['lockVersion']
        if(Object.keys(value).some(k=>!allowed.includes(k)))throw new ApiError(400,'Campos não permitidos.')
        const db=await scopedRepo();return reply(200,publication[2]==='publish'?await db.publish(publication[1],value.lockVersion,value.draftRevision):await db.unpublish(publication[1],value.lockVersion))
      }
      if(pathname==='/api/reference/status'&&req.method==='GET')return reply(200,await vision.status())
      if(pathname==='/api/reference/analyze'&&req.method==='POST')return reply(200,await vision.analyze(await body(req,7*1024*1024),session.id))
      if (pathname === '/api/biosites' && req.method === 'GET') {
        const params=new URL(req.url,'http://localhost').searchParams,cursor=params.get('cursor')??undefined,ownerId=params.get('ownerId')??undefined
        if(ownerId)principalOnly(session)
        return reply(200,await (await scopedRepo(ownerId)).list(cursor))
      }
      if (pathname === '/api/biosites' && req.method === 'POST') {
        const value=await body(req)
        if (Object.keys(value).some(k=>k!=='content')) throw new ApiError(400,'Campos não permitidos.')
        return reply(201,await (await scopedRepo()).create(value.content))
      }
      const match = /^\/api\/biosites\/([^/]+)(\/draft)?$/.exec(pathname)
      if (match && !match[2] && req.method === 'GET') return reply(200,await (await scopedRepo()).get(match[1]))
      if (match?.[2] && req.method === 'PUT') {
        const value=await body(req)
        if (Object.keys(value).some(k=>!['content','lockVersion'].includes(k))) throw new ApiError(400,'Campos não permitidos.')
        return reply(200,await (await scopedRepo()).save(match[1],value.content,value.lockVersion))
      }
      throw new ApiError(404,'Rota não encontrada.')
    } catch(error) {
      if(!(error instanceof ApiError))console.error('[biosite-api-failure]',JSON.stringify({
        route:/^\/api\/auth\/(login|session|logout|request-password-reset|reset-password)$/.test(pathname)?pathname:'other',
        stage,kind:['TypeError','ReferenceError','SyntaxError','RangeError'].includes(error?.name)?error.name:'Error',
        code:/^ERR_[A-Z_]{1,60}$/.test(error?.code||'')?error.code:undefined,
        frames:(error?.stack||'').split('\n').slice(1,6).map(line=>line.match(/(?:server|api)\/[\w./-]+\.mjs:\d+:\d+/)?.[0]).filter(Boolean),
      }))
      reply(error instanceof ApiError ? error.status : 503, {error:error instanceof ApiError ? error.message : 'Serviço indisponível. Nenhum detalhe privado foi exposto.',...(error instanceof ApiError&&['AI_TIMEOUT','AI_CONNECTION','AI_PROVIDER','AI_INVALID_RESPONSE'].includes(error.code)?{code:error.code}:{})})
    }
  }
}
export function createAdminPageGuard({getAuth=configuredAuth,requestAllowed=localRequest}={}) {
  return async(req,res,next)=>{
    const path=(req.url||'/').split('?')[0]
    if(path!=='/'&&path!=='/admin'&&!path.startsWith('/admin/'))return next()
    try{
      if(requestAllowed(req)&&await (await getAuth()).session(req,res)){res.setHeader('Cache-Control','no-store');return next()}
    }catch{/* Fail closed; login will report provider/configuration failures. */}
    res.writeHead(302,{'Location':'/login','Cache-Control':'no-store'});res.end()
  }
}
