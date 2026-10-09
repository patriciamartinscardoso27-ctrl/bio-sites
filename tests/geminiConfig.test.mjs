import test from 'node:test'
import assert from 'node:assert/strict'
import {loadGeminiKey,createGeminiVisionProvider,createVisionService} from '../server/vision-reference.mjs'
test('Gemini configuration is server-only: environment, .env.local and legacy file precedence',async()=>{
 const calls=[],files={'.env.local':'GEMINI_API_KEY=local-test-value','.env.server.local':'GEMINI_API_KEY=legacy-test-value'},readEnvFile=async p=>{calls.push(p);return files[p]};assert.equal(await loadGeminiKey({environment:{GEMINI_API_KEY:' runtime-test-value '},readEnvFile}),'runtime-test-value');assert.equal(calls.length,0);assert.equal(await loadGeminiKey({environment:{},readEnvFile}),'local-test-value');assert.deepEqual(calls,['.env.local']);files['.env.local']='GEMINI_API_KEY=';assert.equal(await loadGeminiKey({environment:{},readEnvFile}),'legacy-test-value')
})
test('missing or blank local files gracefully disable analysis, and status never exposes credentials',async()=>{
 assert.equal(await loadGeminiKey({environment:{},readEnvFile:async()=>{throw Object.assign(new Error('missing'),{code:'ENOENT'})}}),'');const key='fixture-private-value',vision=createVisionService({getProvider:async()=>createGeminiVisionProvider({key})}),status=await vision.status();assert(status.configured);assert(!JSON.stringify(status).includes(key));assert.deepEqual(Object.keys(status).sort(),['configured','maxBytes','model']);await assert.rejects(loadGeminiKey({environment:{},readEnvFile:async()=>{throw Object.assign(new Error('sensitive-path'),{code:'EACCES'})}}),e=>e.status===503&&!e.message.includes('sensitive-path'))
})
