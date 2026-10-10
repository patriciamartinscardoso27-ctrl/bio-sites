import '../server/source-modules.mjs'
import {hostedRequest} from '../server/config.mjs'
import {applicationRequestUrl} from '../server/vercel-routing.mjs'
// Install the scoped resolver before linking the API's shared TypeScript graph.
const {createApi}=await import('../server/api.mjs')
const api=createApi({requestAllowed:hostedRequest})
export default async function handler(req,res){
 // The rewrite carries the route explicitly; Host/Origin are never taken from it.
 const applicationUrl=applicationRequestUrl(req.url)
 if(applicationUrl===null){res.statusCode=404;res.end();return}
 req.url=applicationUrl
 return api(req,res)
}
