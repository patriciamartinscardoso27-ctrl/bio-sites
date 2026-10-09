export const maxReferenceBytes=5*1024*1024
export async function prepareReferenceFile(file:File):Promise<{mime:string;data:string;preview:string}>{
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('Use JPG, PNG ou WebP.')
 if(file.size>maxReferenceBytes)throw new Error('A imagem deve ter até 5 MB.')
 if(!file.size)throw new Error('Esse arquivo está vazio.')
 let bitmap:ImageBitmap
 try{bitmap=await createImageBitmap(file)}catch{throw new Error('Não foi possível ler essa imagem.')}
 try{
  if(bitmap.width*bitmap.height>24_000_000)throw new Error('A imagem tem dimensões muito grandes. Use um print menor.')
  const ratio=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio))
  const context=canvas.getContext('2d');if(!context)throw new Error('Seu navegador não conseguiu preparar a imagem.')
  context.fillStyle='#ffffff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height)
  const preview=canvas.toDataURL('image/jpeg',.82);return {mime:'image/jpeg',data:preview.split(',')[1],preview}
 }finally{bitmap.close()}
}
export async function referenceRequest<T>(path:string,value?:unknown):Promise<T>{
 let response:Response
 try{response=await fetch('/api/reference/'+path,{method:value?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json'},...(value?{body:JSON.stringify(value)}:{}),signal:AbortSignal.timeout(135000)})}catch(error){throw new Error(error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'O tempo de espera da análise foi excedido. Tente novamente.':'Erro de conexão com o servidor. Confira sua conexão e tente novamente.')}
 if(response.status===401)window.dispatchEvent(new Event('biosite-session-expired'))
 let result:{error?:string;code?:string}
 try{result=await response.json()}catch{throw new Error('O servidor retornou uma resposta inválida. Tente novamente.')}
 if(!response.ok)throw new Error(result.error||'A IA não conseguiu concluir a análise. Tente novamente.')
 return result as T
}
