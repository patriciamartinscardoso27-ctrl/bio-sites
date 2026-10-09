import fs from 'node:fs/promises'
const origin='https://bio-sites-sage.vercel.app'
const paths=['/admin','/api/auth/session','/api/biosites','/api/public/biosites/xavier-modas-ba8ee426-6fa8-475d-88f1-3a1f0d8e0a26','/api/public/biosites/does-not-exist','/b/xavier-modas-ba8ee426-6fa8-475d-88f1-3a1f0d8e0a26']
const results=[]
for(const path of paths){const response=await fetch(origin+path,{signal:AbortSignal.timeout(30000)});const body=await response.text();results.push({path,status:response.status,url:response.url,type:response.headers.get('content-type'),body:body.slice(0,160)});console.log(JSON.stringify(results.at(-1)))}
await fs.writeFile('artifacts/deployment/online-readonly.json',JSON.stringify({checkedAt:new Date().toISOString(),origin,requests:'GET only, no cookies',results},null,2))
