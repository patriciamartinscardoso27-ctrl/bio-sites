// Packaging smoke test: materialize only includeFiles and import the real function, without network.
import fs from 'node:fs/promises'
import {spawnSync} from 'node:child_process'
import assert from 'node:assert/strict'
const config=JSON.parse(await fs.readFile('vercel.json','utf8'))
const pattern=config.functions['api/handler.mjs'].includeFiles
const match=/^\{([^}]+)\}\/\*\*$/.exec(pattern);assert(match,'Unsupported includeFiles pattern')
await fs.mkdir('artifacts/deployment',{recursive:true})
const stage=await fs.mkdtemp('artifacts/deployment/function-smoke-')
await fs.cp('api',stage+'/api',{recursive:true})
for(const root of match[1].split(','))await fs.cp(root,stage+'/'+root,{recursive:true})
await fs.writeFile(stage+'/package.json','{"type":"module"}')
await fs.writeFile(stage+'/run.mjs',`import assert from 'node:assert/strict';globalThis.fetch=()=>{throw Error('Network prohibited in package smoke test')};const {default:handler}=await import('./api/handler.mjs');let body,status;const response={writeHead(code){status=code},end(value){body=value}};await handler({url:'/api/auth/session',method:'GET',headers:{host:'bio-sites-sage.vercel.app'},socket:{remoteAddress:'127.0.0.1'}},response);assert.equal(status,200);assert.deepEqual(JSON.parse(body),{authenticated:false});console.log('Packed API imports and anonymous session: PASS')`)
const result=spawnSync(process.execPath,['run.mjs'],{cwd:stage,encoding:'utf8',env:{PATH:process.env.PATH,SystemRoot:process.env.SystemRoot,VERCEL:'1',PUBLIC_SITE_ORIGIN:'https://bio-sites-sage.vercel.app',NEON_PROJECT_ID:'muddy-star-65783442',NEON_BRANCH_ID:'br-raspy-pine-b4i56qaa',NEON_AUTH_BASE_URL:'https://ep-cool-flower-b4g5hcwp.neonauth.c-6.us-east-2.aws.neon.tech/neondb/auth',BIOSITE_ADMIN_AUTH_ID:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',NEON_AUTH_COOKIE_SECRET:'local-package-smoke-fixture-only-000000000000000000000'}})
assert.equal(result.status,0,result.stderr);console.log(result.stdout.trim())
await fs.writeFile('artifacts/deployment/function-smoke.json',JSON.stringify({verifiedAt:new Date().toISOString(),passed:true,pattern,networkUsed:false,productionSecretsUsed:false,stage},null,2))
