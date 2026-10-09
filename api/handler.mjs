import {createApi} from '../server/api.mjs'
import {hostedRequest} from '../server/config.mjs'
const api=createApi({requestAllowed:hostedRequest})
export default async function handler(req,res){
 // The rewrite carries the route explicitly; Host/Origin are never taken from it.
 const url=new URL(req.url,'https://placeholder.invalid'),route=url.searchParams.get('route')
 if(route){if(!route.startsWith('/api/')||route.includes('?')||route.includes('..')){res.statusCode=404;res.end();return}url.searchParams.delete('route');req.url=route+(url.searchParams.size?'?'+url.searchParams:'')}
 return api(req,res)
}
