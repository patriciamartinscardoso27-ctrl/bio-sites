export const maxReferenceBytes=5*1024*1024
export const maxReferenceRequestBytes=4_000_000
export class ReferenceRequestError extends Error {
 status:number;contentType:string;code:string
 constructor(message:string,status=0,contentType='',code='AI_CONNECTION'){super(message);this.name='ReferenceRequestError';this.status=status;this.contentType=contentType;this.code=code}
}
export async function prepareReferenceFile(file:File,maxDimension=1600,quality=.82):Promise<{mime:string;data:string;preview:string}>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use JPG, PNG ou WebP.')
 if(file.size>maxReferenceBytes)throw new Error('A imagem deve ter até 5 MB.')
 if(!file.size)throw new Error('Esse arquivo está vazio.')
 let bitmap:ImageBitmap
 try{bitmap=await createImageBitmap(file)}catch{throw new Error('Não foi possível ler essa imagem.')}
 try{
  if(bitmap.width*bitmap.height>24_000_000)throw new Error('A imagem tem dimensões muito grandes. Use um print menor.')
  const ratio=Math.min(1,maxDimension/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio))
  const context=canvas.getContext('2d');if(!context)throw new Error('Seu navegador não conseguiu preparar a imagem.')
  context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height)
  const preview=canvas.toDataURL('image/jpeg',quality);return {mime:'image/jpeg',data:preview.split(',')[1],preview}
 }finally{bitmap.close()}
}
type ReferenceUpload={mime:string;data:string;[key:string]:unknown}
async function compressReference(image:ReferenceUpload,dimension:number,quality:number){
 const bytes=Uint8Array.from(atob(image.data),c=>c.charCodeAt(0))
 const prepared=await prepareReferenceFile(new File([bytes], 'reference', {type:image.mime}),dimension,quality)
 return {...image,mime:prepared.mime,data:prepared.data}
}
export async function referenceBody(value:unknown,compress=compressReference):Promise<string>{
 const source=value as {images?:ReferenceUpload[];mime?:string;data?:string}
 let body=JSON.stringify(value)
 if(source?.images?.length||source?.data){
  const original=source.images||[{mime:source.mime!,data:source.data!}]
  for(const [dimension,quality] of [[1600,.82],[1200,.72],[960,.62]]){
   const images=await Promise.all(original.map(image=>compress(image,dimension,quality)))
   body=JSON.stringify(source.images?{...source,images}:{...source,mime:images[0].mime,data:images[0].data})
   if(new TextEncoder().encode(body).byteLength<=maxReferenceRequestBytes)return body
  }
 }
 if(new TextEncoder().encode(body).byteLength>maxReferenceRequestBytes)throw new ReferenceRequestError('As imagens ainda excedem o limite seguro de envio. Reduza o número de referências ou o recorte.',413,'','AI_PAYLOAD_TOO_LARGE')
 return body
}
export async function referenceRequest<T>(path:string,value?:unknown):Promise<T>{
 const started=Date.now(),body=value?await referenceBody(value):undefined,requestBytes=body?new TextEncoder().encode(body).byteLength:0
 let response:Response
 try{response=await fetch('/api/reference/'+path,{method:value?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(body?{body}:{}),signal:AbortSignal.timeout(135000)})}catch(error){const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);console.info({service:'reference-client',stage:'transport',elapsedMs:Date.now()-started,requestBytes,status:0,code:timeout?'AI_TIMEOUT':'AI_CONNECTION'});throw new ReferenceRequestError(timeout?'O tempo de espera da análise foi excedido. Tente novamente.':'Erro de conexão com o servidor. Confira sua conexão e tente novamente.',0,'',timeout?'AI_TIMEOUT':'AI_CONNECTION')}
 if(response.status===401)window.dispatchEvent(new Event('biosite-session-expired'))
 const contentType=response.headers.get('content-type')||''
 console.info({service:'reference-client',stage:'response',elapsedMs:Date.now()-started,status:response.status,requestBytes})
 let result:{error?:string;code?:string}|undefined
 try{const parsed=await response.json();if(parsed&&typeof parsed==='object'&&!Array.isArray(parsed))result=parsed}catch(error){
  if(error instanceof Error&&['TimeoutError','AbortError'].includes(error.name))throw new ReferenceRequestError(`HTTP ${response.status}: tempo excedido ao receber a resposta.`,response.status,contentType,'AI_TIMEOUT')
  if(error instanceof TypeError)throw new ReferenceRequestError(`HTTP ${response.status}: conexão interrompida ao receber a resposta.`,response.status,contentType,'AI_CONNECTION')
  // Never render a raw proxy HTML/text response.
 }
 const messages:Record<number,string>={413:'As imagens excedem o limite de envio do servidor.',429:'Limite de geração atingido. Aguarde e tente novamente.',500:'O servidor encontrou uma falha interna.',502:'O servidor de geração retornou uma resposta inválida.',504:'A hospedagem encerrou a geração por tempo excedido.'}
 if(!response.ok)throw new ReferenceRequestError(`HTTP ${response.status}: ${typeof result?.error==='string'?result.error:messages[response.status]||'A IA não conseguiu concluir a análise.'}`,response.status,contentType,typeof result?.code==='string'?result.code:'AI_HTTP')
 if(!result)throw new ReferenceRequestError(`HTTP ${response.status}: o servidor não retornou um objeto JSON válido.`,response.status,contentType,'AI_SERVER_JSON')
 return result as T
}
