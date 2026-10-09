/** Rasterize an existing vector only when the user explicitly starts cropping. */
export async function cropSource(blob:Blob):Promise<File>{
 if(['image/png','image/jpeg','image/webp'].includes(blob.type))return new File([blob],'imagem',{type:blob.type})
 if(blob.type!=='image/svg+xml'||blob.size>15*1024*1024)throw Error('Formato não suportado')
 const url=URL.createObjectURL(blob)
 try{
  const image=new Image()
  await new Promise<void>((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('Imagem inválida'));image.src=url})
  const width=image.naturalWidth,height=image.naturalHeight
  if(!width||!height||width*height>24_000_000)throw Error('Dimensões inválidas')
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height
  const context=canvas.getContext('2d');if(!context)throw Error('Canvas indisponível')
  context.drawImage(image,0,0,width,height)
  const raster=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Conversão inválida')),'image/png'))
  return new File([raster],'imagem.png',{type:'image/png'})
 }finally{URL.revokeObjectURL(url)}
}
