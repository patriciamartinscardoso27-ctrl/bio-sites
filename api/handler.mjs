import '../server/source-modules.mjs'
import {hostedRequest} from '../server/config.mjs'
// Install the scoped resolver before linking the API's shared TypeScript graph.
const {createApi}=await import('../server/api.mjs')
const api=createApi({requestAllowed:hostedRequest})
export default async function handler(req,res){
 // The rewrite carries the route explicitly; Host/Origin are never taken from it.
 const url=new URL(req.url,'https://placeholder.invalid'),route=url.searchParams.get('route')
 if(route){if(!route.startsWith('/api/')||route.includes('?')||route.includes('..')){res.statusCode=404;res.end();return}url.searchParams.delete('route');req.url=route+(url.searchParams.size?'?'+url.searchParams:'')}
 return api(req,res)
}
