import {packSaveImages} from '../src/lib/saveTransport.ts'
import {gunzipSync,gzipSync} from 'node:zlib'
import {ApiError} from './validation.mjs'
export function decodeSavePayload(buffer,{gzip=false,limit=32*1024*1024}={}){
 let bytes=buffer
 if(gzip)try{bytes=gunzipSync(buffer,{maxOutputLength:limit})}catch(e){throw new ApiError(e.code==='ERR_BUFFER_TOO_LARGE'?413:400,e.code==='ERR_BUFFER_TOO_LARGE'?'Conteúdo muito grande.':'Envio comprimido inválido.')}
 if(bytes.length>limit)throw new ApiError(413,'Conteúdo muito grande.')
 let value;try{value=JSON.parse(bytes.toString('utf8'))}catch{throw new ApiError(400,'JSON inválido.')}
 if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'JSON inválido.')
 if(value.transport!=='biosite-images-v1')return value
 if(!Array.isArray(value.images)||value.images.length>2000||value.images.some(v=>typeof v!=='string'||!/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=\s]+$/i.test(v)))throw new ApiError(400,'Imagens de envio inválidas.')
 const images=value.images;let expanded=0
 const walk=(v,depth=0)=>{
  if(depth>60)throw new ApiError(400,'Conteúdo inválido.')
  if(v&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===1&&Object.hasOwn(v,'__biositeImage')){
   if(!Number.isInteger(v.__biositeImage)||v.__biositeImage<0||v.__biositeImage>=images.length)throw new ApiError(400,'Referência de imagem inválida.')
   v=images[v.__biositeImage]
  }
  if(typeof v==='string'){expanded+=Buffer.byteLength(v)+2;if(expanded>limit)throw new ApiError(413,'Conteúdo muito grande.');return v}
  if(Array.isArray(v))return v.map(x=>walk(x,depth+1))
  if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>{expanded+=Buffer.byteLength(k)+4;return [k,walk(x,depth+1)]}))
  return v
 }
 const decoded=walk(value.body);if(!decoded||typeof decoded!=='object'||Array.isArray(decoded))throw new ApiError(400,'JSON inválido.');return decoded
}

export function encodeResponsePayload(value,acceptEncoding='',acceptImages=false){
 let raw=Buffer.from(JSON.stringify(value)),headers={}
 if(raw.length>=900_000&&acceptImages){raw=Buffer.from(JSON.stringify(packSaveImages(value)));headers['X-Biosite-Response-Format']='images-v1'}
 const gzip=raw.length>=900_000&&acceptEncoding.split(',').some(entry=>{const [coding,...options]=entry.split(';');return coding.trim().toLowerCase()==='gzip'&&!options.some(v=>/^\s*q\s*=\s*0(?:\.0*)?\s*$/i.test(v))})
 return gzip?{body:gzipSync(raw),headers:{...headers,'Content-Encoding':'gzip','Vary':'Accept-Encoding, X-Biosite-Accept-Transport'}}:{body:raw,headers}
}
