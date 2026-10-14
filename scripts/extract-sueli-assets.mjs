import sharp from 'sharp'
import {mkdir,writeFile} from 'node:fs/promises'
const source='C:/Users/W10/AppData/Local/Temp/codex-clipboard-4152e945-89f9-48c4-a9fb-1afac743e491.jpg'
const dir='public/images/sueli-nascimento'
await mkdir(dir,{recursive:true})
const crops={salon:[1216,460,302,164],portrait:[40,260,195,204],about:[1387,65,131,219],nails:[462,207,134,132],feet:[463,354,133,123],hair:[463,493,133,138],brows:[463,648,133,117],space:[1216,460,302,164],before:[854,203,158,173],after:[1019,203,156,173],'result-nails':[854,412,322,104],'brow-before':[854,525,158,112],'brow-after':[1020,525,155,112],'feet-before':[854,648,157,116],'feet-after':[1020,648,155,116],spa:[266,692,146,277],banner:[712,790,94,183],'result-banner':[1055,804,122,173]}
for(const [name,[left,top,width,height]] of Object.entries(crops))await sharp(source).extract({left,top,width,height}).webp({quality:95}).toFile(`${dir}/${name}.webp`)
// Exact logo pixels from the supplied reference, not a redesigned monogram.
const logo=await sharp(source).extract({left:76,top:60,width:132,height:110}).webp({quality:100}).toBuffer()
await writeFile(`${dir}/logo.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="132" height="110" viewBox="0 0 132 110"><image width="132" height="110" href="data:image/webp;base64,${logo.toString('base64')}"/></svg>`)
