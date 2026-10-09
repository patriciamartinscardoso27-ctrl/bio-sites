export function isPublicDestination(href:string,origin:string):boolean {
 if(href.startsWith('#'))return href.length>1
 if(!href)return false
 try{
  const url=new URL(href,origin)
  if(!['http:','https:','tel:','mailto:'].includes(url.protocol)||url.username||url.password)return false
  const host=url.hostname.replace(/^www\./,'')
  if(['instagram.com','facebook.com','tiktok.com','pinterest.com'].includes(host)&&url.pathname==='/')return false
  if(host==='wa.me'&&!/^\/[1-9][0-9]{7,14}$/.test(url.pathname))return false
  if(/editar no painel/i.test(url.searchParams.get('query')||''))return false
  return true
 }catch{return false}
}
