import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes} from 'node:crypto'
import {gzipSync,gunzipSync} from 'node:zlib'
import {createServer} from 'vite'
import {decodeSavePayload,encodeResponsePayload} from '../server/body-transport.mjs'
const vite=await createServer({configFile:false,server:{middlewareMode:true,hmr:false},optimizeDeps:{noDiscovery:true,include:[]}})
const {prepareSaveRequest,packSaveImages,unpackSaveImages}=await vite.ssrLoadModule('/src/lib/saveTransport.ts')
test('large save preserves every original image byte while fitting beneath platform request limit',async()=>{
 const image='data:image/jpeg;base64,'+randomBytes(1_500_000).toString('base64'),value={content:{id:'existing-client',logo:image,photos:[image,image,image],hours:'novos horários'},lockVersion:'27'}
 assert(Buffer.byteLength(JSON.stringify(value))>4_500_000)
 const request=await prepareSaveRequest(JSON.stringify(value));assert.equal(request.headers['X-Biosite-Body-Encoding'],'gzip');const bytes=Buffer.from(await request.body.arrayBuffer());assert(bytes.length<4_000_000)
 assert.deepEqual(decodeSavePayload(bytes,{gzip:true}),value)
 assert.equal(packSaveImages(value).images.length,1)
 const response=encodeResponsePayload(value,'gzip',true);assert(response.body.length<4_000_000);assert.deepEqual(unpackSaveImages(JSON.parse(gunzipSync(response.body))),value)
})
test('large responses decompress to the identical saved/public content; small JSON remains compatible',()=>{
 const value={content:{photos:['data:image/jpeg;base64,'+'a'.repeat(1_000_000)]}};const encoded=encodeResponsePayload(value,'br, gzip, deflate');assert.equal(encoded.headers['Content-Encoding'],'gzip');assert.deepEqual(JSON.parse(gunzipSync(encoded.body).toString()),value)
 assert.equal(encodeResponsePayload(value,'gzip;q=0').headers['Content-Encoding'],undefined);assert.deepEqual(decodeSavePayload(Buffer.from('{"lockVersion":"1"}')),{lockVersion:'1'})
})
test('compressed bombs, malformed envelopes and image reference expansion remain bounded',()=>{
 assert.throws(()=>decodeSavePayload(gzipSync(Buffer.alloc(5000)),{gzip:true,limit:1000}),e=>e.status===413)
 assert.throws(()=>decodeSavePayload(Buffer.from(JSON.stringify({transport:'biosite-images-v1',images:[],body:{image:{__biositeImage:2}}}))),e=>e.status===400)
 assert.throws(()=>decodeSavePayload(Buffer.from('invalid')) ,e=>e.status===400)
})
test('real HTTP save and reopen negotiate lossless image transport',async t=>{
 const {createServer}=await import('node:http'),{createApi}=await import('../server/api.mjs')
 const image='data:image/jpeg;base64,'+randomBytes(1_200_000).toString('base64'),id='11111111-1111-4111-8111-111111111111',content={id,name:'Isolated test',photos:[image,image,image,image]}
 let saved
 const api=createApi({repository:{save:async(recordId,value,lock)=>{assert.equal(recordId,id);assert.equal(lock,'27');saved=value;return {id,slug:'same-existing-url',content:value}},get:async()=>({id,slug:'same-existing-url',content:saved})},getAuth:async()=>({session:async()=>({id:'test-user'})})})
 const server=createServer((req,res)=>void api(req,res));await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)))
 const base='http://127.0.0.1:'+server.address().port,request=await prepareSaveRequest(JSON.stringify({content,lockVersion:'27'}))
 const response=await fetch(base+'/api/biosites/'+id+'/draft',{method:'PUT',headers:{Origin:base,...request.headers,'X-Biosite-Accept-Transport':'images-v1'},body:request.body})
 assert.equal(response.status,200);assert.equal(response.headers.get('x-biosite-response-format'),'images-v1');assert.deepEqual(unpackSaveImages(await response.json()).content,content)
 const reopened=await fetch(base+'/api/biosites/'+id,{headers:{'X-Biosite-Accept-Transport':'images-v1'}});assert.equal(reopened.status,200);assert.deepEqual(unpackSaveImages(await reopened.json()).content,content)
})
test.after(()=>vite.close())
