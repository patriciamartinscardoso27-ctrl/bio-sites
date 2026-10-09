import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { registerHooks } from 'node:module'
import fs from 'node:fs/promises'

const root=resolve('.vercel/output/functions/api/handler.func')
const config=JSON.parse(await fs.readFile(root+'/.vc-config.json','utf8'))
assert.equal(config.runtime,'nodejs24.x')
Object.assign(process.env,{VERCEL:'1',PUBLIC_SITE_ORIGIN:'https://bio-sites-sage.vercel.app',
 NEON_PROJECT_ID:'muddy-star-65783442',NEON_BRANCH_ID:'br-raspy-pine-b4i56qaa',
 NEON_AUTH_BASE_URL:'https://ep-cool-flower-b4g5hcwp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth',
 BIOSITE_ADMIN_AUTH_ID:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 NEON_AUTH_COOKIE_SECRET:'local-package-smoke-fixture-only-000000000000000000000',
 DATABASE_URL:'postgresql://fixture:fixture@example.invalid/fixture?sslmode=require',
 BIOSITE_MULTIUSER:'enabled',BIOSITE_SIGNUP_GUARD:'disabled'})
globalThis.fetch=()=>{throw Error('Network prohibited in packed API test')}
const loaded=new Set()
registerHooks({load(url,context,next){if(url.startsWith(pathToFileURL(root+'/').href))loaded.add(url);return next(url,context)}})
const {default:handler}=await import(pathToFileURL(root+'/'+config.handler).href)
const {catalog}=await import(pathToFileURL(root+'/server/catalog.mjs').href)
const {readyModelIds}=await import(pathToFileURL(root+'/src/data/readyModelIds.js').href)
assert.equal(catalog.models.length,21)
assert.equal(readyModelIds.length,76)
assert.equal(new Set(readyModelIds).size,76)
let status,body
const response={writeHead(code){status=code},end(value){body=value}}
async function request(url,method,headers={},payload='{}') {
 await handler({url,method,headers:{host:'bio-sites-sage.vercel.app',...headers},
  socket:{remoteAddress:'127.0.0.1'},async *[Symbol.asyncIterator](){yield Buffer.from(payload)}},response)
 return {status,body:body?JSON.parse(body):undefined}
}
assert.deepEqual(await request('/api/auth/session','GET'),{status:200,body:{authenticated:false}})
assert.equal((await request('/api/webhooks/neon-auth','GET')).status,405)
assert.equal((await request('/api/handler?route=/api/webhooks/neon-auth','POST',{'content-type':'application/json'})).status,403)
assert.equal((await request('/api/webhooks/neon-auth','POST',{'content-type':'application/json',
 'x-neon-signature':'forged','x-neon-timestamp':String(Date.now())})).status,403)
assert.equal((await request('/api/auth/invite-accept','POST',{'content-type':'application/json',origin:process.env.PUBLIC_SITE_ORIGIN})).status,503)
assert.equal([...loaded].filter(url=>url.includes('/src/')&&url.endsWith('.ts')).length,0)
const result={verifiedAt:new Date().toISOString(),passed:true,actualVercelOutput:true,
 loadedModules:loaded.size,models:readyModelIds.length,baseStyles:catalog.models.length,networkUsed:false,productionWrites:0,
 anonymousSession:true,unsignedAndForgedWebhookRejected:true,invitesClosed:true}
await fs.writeFile('artifacts/multiuser/packed-api-verification.json',JSON.stringify(result,null,2))
console.log(JSON.stringify(result,null,2))
