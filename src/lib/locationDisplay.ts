import {safeWebUrl} from './actionLinks'
export const locationLayouts=[['map','Mapa'],['image','Imagem'],['map-info','Mapa + informações'],['image-info','Imagem + informações']] as const
export function googleMapEmbed(address:string,mapsUrl=''):string|undefined{
 const safe=safeWebUrl(mapsUrl)
 if(safe){const url=new URL(safe);if(url.protocol==='https:'&&['google.com','www.google.com','maps.google.com','google.com.br','www.google.com.br'].includes(url.hostname)){
  if(url.pathname==='/maps/embed'&&url.searchParams.get('pb')){const pb=url.searchParams.get('pb')!;if(pb.length<=8000)return 'https://www.google.com/maps/embed?'+new URLSearchParams({pb}).toString()}
  const query=url.searchParams.get('q')||url.searchParams.get('query');if(query&&query.length<=500)return 'https://www.google.com/maps?'+new URLSearchParams({q:query,output:'embed'}).toString()
 }}
 const value=address.trim();if(value&&value.length<=1000&&!/^(informe|adicione|seu endereço|endereço a informar)/i.test(value))return 'https://www.google.com/maps?'+new URLSearchParams({q:value,output:'embed'}).toString()
 return undefined
}
