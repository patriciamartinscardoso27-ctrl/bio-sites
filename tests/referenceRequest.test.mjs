import test from 'node:test';import assert from 'node:assert/strict';const {referenceRequest}=await import('../src/lib/referenceImage.ts');
test('frontend distinguishes connection, AI errors and invalid responses without silent fallback',async()=>{const original=globalThis.fetch;try{
 globalThis.fetch=async()=>{throw new TypeError('network')};await assert.rejects(referenceRequest('analyze',{}),/Erro de conexão/);
 globalThis.fetch=async()=>Response.json({error:'O Gemini excedeu o tempo de análise. Tente novamente.',code:'AI_TIMEOUT'},{status:503});await assert.rejects(referenceRequest('analyze',{}),/Gemini excedeu/);
 globalThis.fetch=async()=>Response.json({error:'O Gemini respondeu com uma estrutura inválida ou incompleta.',code:'AI_INVALID_RESPONSE'},{status:502});await assert.rejects(referenceRequest('analyze',{}),/estrutura inválida/);
 globalThis.fetch=async()=>new Response('<html>failure</html>');await assert.rejects(referenceRequest('analyze',{}),/resposta inválida/);
 globalThis.fetch=async(_url,options)=>{assert.equal(options.credentials,'same-origin');assert.deepEqual(JSON.parse(options.body),{images:[{mime:'image/jpeg',data:'demo'}],description:'prompt'});return Response.json({spec:{visualStyle:'premium'}})};assert.deepEqual(await referenceRequest('analyze',{images:[{mime:'image/jpeg',data:'demo'}],description:'prompt'}),{spec:{visualStyle:'premium'}});
 }finally{globalThis.fetch=original}});
