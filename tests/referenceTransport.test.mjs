import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import '../server/source-modules.mjs'
const {referenceRequest,referenceBody,maxReferenceRequestBytes}=await import('../src/lib/referenceImage.ts')
const {createGeminiVisionProvider}=await import('../server/vision-reference.mjs')
const {defaultReferenceSpec}=await import('../src/lib/referenceDesign.ts')
const {createApi}=await import('../server/api.mjs')
const {ApiError}=await import('../server/validation.mjs')

test('HTTP failures preserve status, content type and safe JSON errors, including non-JSON proxies',async()=>{
 const original=globalThis.fetch
 try{
  for(const status of [413,429,500,502,504])for(const json of [false,true]){
   globalThis.fetch=async()=>json?Response.json({error:'Mensagem segura',code:'AI_TIMEOUT'},{status}):new Response('<html>private proxy detail</html>',{status,headers:{'content-type':'text/html'}})
   await assert.rejects(referenceRequest('analyze',{description:'Texto'}),e=>e.status===status&&e.contentType.includes(json?'application/json':'text/html')&&e.message.includes('HTTP '+status)&&!e.message.includes('private')&&(!json||e.code==='AI_TIMEOUT'))
  }
  for(const body of ['invalid','null','[]']){
   globalThis.fetch=async()=>new Response(body,{headers:{'content-type':'application/json'}})
   await assert.rejects(referenceRequest('status'),e=>e.code==='AI_SERVER_JSON'&&e.status===200)
  }
  for(const name of ['TimeoutError','TypeError']){
   globalThis.fetch=async()=>{throw Object.assign(Error('secret'),{name})}
   await assert.rejects(referenceRequest('status'),e=>e.code===(name==='TimeoutError'?'AI_TIMEOUT':'AI_CONNECTION')&&!e.message.includes('secret'))
  }
 }finally{globalThis.fetch=original}
})

test('image payload is compressed before sending, budget includes UTF-8 prompt and metadata, input untouched',async()=>{
 const value={description:'á'.repeat(6000),images:[{mime:'image/png',data:'A'.repeat(4_200_000),role:'reference',name:'Ref'}]},snapshot=JSON.stringify(value),calls=[]
 const body=await referenceBody(value,async(image,dimension)=>{calls.push(dimension);return {...image,mime:'image/jpeg',data:'A'.repeat(dimension===1600?4_100_000:1000)}})
 assert.deepEqual(calls,[1600,1200]);assert(new TextEncoder().encode(body).length<maxReferenceRequestBytes);assert.equal(JSON.stringify(value),snapshot);assert.equal(JSON.parse(body).images[0].role,'reference')
 await assert.rejects(referenceBody(value,async i=>i),e=>e.status===413)
 assert.equal(await referenceBody({description:'Apenas texto'}),'{"description":"Apenas texto"}')
})

test('provider distinguishes truncation, malformed envelope, malformed content and validation',async()=>{
 for(const [payload,code] of [[{candidates:[{finishReason:'MAX_TOKENS'}]},'AI_TRUNCATED'],[{candidates:[{finishReason:'STOP',content:{parts:[{text:'{"partial":'}]}}]},'AI_JSON_PARSE'],[{candidates:[{finishReason:'STOP',content:{parts:[{text:'{}'}]}}]},'AI_VALIDATION']]){
  await assert.rejects(createGeminiVisionProvider({key:'fake',fetchImpl:async()=>Response.json(payload)}).analyzeReferenceImage(null,'beauty','Teste'),e=>e.code===code)
 }
 await assert.rejects(createGeminiVisionProvider({key:'fake',fetchImpl:async()=>new Response('{')}).analyzeReferenceImage(null),e=>e.code==='AI_JSON_PARSE')
})

test('text generation asks for a complete creative design and sends no image parts',async()=>{
 let sent
 const p=createGeminiVisionProvider({key:'fake',fetchImpl:async(_,opts)=>{sent=JSON.parse(opts.body);return Response.json({candidates:[{finishReason:'STOP',content:{parts:[{text:JSON.stringify(defaultReferenceSpec)}]}}]})}})
 const spec=await p.analyzeReferenceImage(null,'beauty','Texto de teste',{creationMode:'creative'})
 assert(spec.palette);assert(!sent.contents[0].parts.some(p=>p.inlineData));assert(sent.contents[0].parts.at(-1).text.includes('Create the complete editable design'))
 assert(!JSON.stringify(sent.generationConfig.responseJsonSchema).includes('"enum"'))
})

test('actual image preparation resizes before request and diagnostics omit prompts and bytes',async()=>{
 const {prepareReferenceFile}=await import('../src/lib/referenceImage.ts')
 const previous={bitmap:globalThis.createImageBitmap,document:globalThis.document,fetch:globalThis.fetch,info:console.info}
 const events=[];let canvas,closed=false
 try{
  globalThis.createImageBitmap=async()=>({width:3200,height:1600,close(){closed=true}})
  globalThis.document={createElement(){canvas={width:0,height:0,getContext(){return {fillRect(){},drawImage(){}}},toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.82);return 'data:image/jpeg;base64,YWJjZA=='}};return canvas}}
  const result=await prepareReferenceFile(new File(['demo'],'ref.png',{type:'image/png'}))
  assert.equal(canvas.width,1600);assert.equal(canvas.height,800);assert(closed);assert.equal(result.mime,'image/jpeg')
  console.info=v=>events.push(v)
  globalThis.fetch=async()=>Response.json({spec:{}})
  await referenceRequest('analyze',{description:'PRIVATE_PROMPT'})
  assert(!JSON.stringify(events).includes('PRIVATE_PROMPT'));assert.equal(events[0].status,200);assert.equal(typeof events[0].requestBytes,'number')
 }finally{globalThis.createImageBitmap=previous.bitmap;globalThis.document=previous.document;globalThis.fetch=previous.fetch;console.info=previous.info}
})

test('shared API returns specific errors and payload limit before generation without repository access',async()=>{
 let code='AI_TRUNCATED',calls=0
 const api=createApi({requestAllowed:()=>true,getAuth:async()=>({session:async()=>({id:'test',role:'principal'})}),getRepository:async()=>{throw Error('Must never access DB')},vision:{analyze:async()=>{calls++;throw Object.assign(new ApiError(502,'Mensagem segura'),{code})}}})
 const server=createServer(api);await new Promise(r=>server.listen(0,'127.0.0.1',r))
 const origin='http://127.0.0.1:'+server.address().port
 try{
  for(code of ['AI_TRUNCATED','AI_JSON_PARSE','AI_VALIDATION','AI_TIMEOUT','AI_CONNECTION','AI_FIDELITY','AI_REFERENCE_AMBIGUOUS']){
   const r=await fetch(origin+'/api/reference/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:'Teste sem persistência'})})
   assert.equal(r.status,502);assert.equal((await r.json()).code,code)
  }
  const before=calls,r=await fetch(origin+'/api/reference/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({description:'x'.repeat(maxReferenceRequestBytes)})})
  assert.equal(r.status,413);assert.equal(calls,before)
 }finally{await new Promise(r=>server.close(r))}
})
