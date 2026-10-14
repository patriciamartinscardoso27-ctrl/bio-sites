// Lossless request transport: repeated inline photos travel only once.
export function packSaveImages(value:unknown){
 const images:string[]=[],indices=new Map<string,number>()
 const walk=(v:unknown):unknown=>{
  if(typeof v==='string'&&/^data:image\/(png|jpeg|webp);base64,/i.test(v)){
   let index=indices.get(v);if(index===undefined){index=images.length;indices.set(v,index);images.push(v)}
   return {__biositeImage:index}
  }
  if(Array.isArray(v))return v.map(walk)
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]))
  return v
 }
 const body=walk(value)
 return {transport:'biosite-images-v1',images,body}
}
export async function prepareSaveRequest(body:string):Promise<{body:string|Blob;headers:Record<string,string>}>{
 if(new TextEncoder().encode(body).byteLength<900_000)return {body,headers:{'Content-Type':'application/json'}}
 if(typeof CompressionStream==='undefined')throw new Error('Use um navegador atualizado para salvar as fotos. Sua edição permanece nesta aba.')
 const json=JSON.stringify(packSaveImages(JSON.parse(body)))
 const compressed=await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).blob()
 if(compressed.size>4_000_000)throw new Error('As fotos ainda excedem o limite de envio. Baixe uma cópia das alterações e reduza o tamanho dos arquivos de imagem. Sua edição permanece nesta aba.')
 return {body:compressed,headers:{'Content-Type':'application/octet-stream','X-Biosite-Body-Encoding':'gzip'}}
}
export function unpackSaveImages<T>(value:T):T{
 if(!value||typeof value!=='object'||!('transport' in value)||value.transport!=='biosite-images-v1')return value
 const envelope=value as {images?:unknown;body?:unknown}
 if(!Array.isArray(envelope.images)||envelope.images.some(v=>typeof v!=='string'))throw new Error('Resposta de imagens inválida.')
 const images=envelope.images as string[]
 const walk=(v:unknown):unknown=>{
  if(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&'__biositeImage' in v){const index=v.__biositeImage;if(typeof index!=='number'||!Number.isInteger(index)||index<0||index>=images.length)throw new Error('Referência de imagem inválida.');return images[index]}
  if(Array.isArray(v))return v.map(walk)
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,walk(x)]))
  return v
 }
 return walk(envelope.body) as T
}

