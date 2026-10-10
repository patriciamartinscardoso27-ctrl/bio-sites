// Strip only Vercel rewrite metadata before application query validation.
export function applicationRequestUrl(requestUrl){
 const url=new URL(requestUrl,'https://placeholder.invalid'),route=url.searchParams.get('route')
 if(!route)return requestUrl
 if(url.searchParams.getAll('route').length!==1||!route.startsWith('/api/')||route.includes('?')||route.includes('..'))return null
 const paths=url.searchParams.getAll('path')
 if(paths.length&&(paths.length!==1||paths[0]!==route.slice('/api/'.length)))return null
 url.searchParams.delete('route');url.searchParams.delete('path')
 return route+(url.searchParams.size?'?'+url.searchParams:'')
}
