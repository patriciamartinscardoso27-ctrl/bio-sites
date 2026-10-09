import fs from 'node:fs/promises'
import '../server/validation.mjs'
const {readyTemplates,createBio}=await import('../src/data/templates.ts')
const origin='http://localhost:5181'
const call=async(path,method='GET',body)=>{const response=await fetch(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});const value=await response.json();if(!response.ok)throw Error(value.error);return value}
const list=await call('/api/biosites')
let record
const existing=list.items.find(x=>x.name==='DEMO LOCAL — Xavier')
if(existing)record=await call('/api/biosites/'+existing.id)
else{const content=createBio(readyTemplates.find(x=>x.id==='moda-premium-gold'));content.name='DEMO LOCAL — Xavier';content.phone='';content.instagram='';content.reviewsUrl='';content.mapsUrl='';content.client={notes:'Exclusivamente JSON local. Nenhuma gravação no Neon.'};record=await call('/api/biosites','POST',{content})}
await fs.writeFile('artifacts/publication/demo-record.json',JSON.stringify({id:record.id,slug:record.slug,origin,storage:'JSON local isolado'},null,2))
console.log(JSON.stringify({id:record.id,slug:record.slug,status:record.status,storage:'JSON local isolado'}))
