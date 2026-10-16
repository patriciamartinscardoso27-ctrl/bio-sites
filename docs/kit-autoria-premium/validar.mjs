// Run inside the Bio-Sites repository; read-only, no remote calls or persistence.
import fs from 'node:fs/promises'
import '../../server/source-modules.mjs'
const {processPremiumDesign}=await import('../../server/premium-design.mjs')
const {assertPremiumPackage,premiumPackageMaxBytes}=await import('../../src/lib/premiumDesignPackage.ts')

const files=process.argv.slice(2)
if(!files.length){console.error('Uso: node docs/kit-autoria-premium/validar.mjs caminho/arquivo.biosite.json');process.exitCode=1}
for(const file of files){
 try{
  const bytes=await fs.readFile(file)
  if(!bytes.length||bytes.length>premiumPackageMaxBytes)throw Error('Arquivo vazio ou acima de 4.000.000 bytes.')
  const pack=JSON.parse(bytes.toString('utf8'));assertPremiumPackage(pack)
  const result=processPremiumDesign({operation:'import',package:pack})
  const original=JSON.stringify(pack.design),reexported=processPremiumDesign({operation:'export',bio:{...result.bio,id:pack.design.id}}).package
  if(JSON.stringify(reexported.design)!==original)throw Error('A reimportação alterou a estrutura pública.')
  console.log(JSON.stringify({file,accepted:true,bytes:bytes.length,profile:pack.renderer.profile,sections:result.bio.sections.length,media:pack.assets.media.length,persisted:false}))
 }catch(error){console.error(JSON.stringify({file,accepted:false,error:error instanceof Error?error.message:'Falha de validação'}));process.exitCode=1}
}
