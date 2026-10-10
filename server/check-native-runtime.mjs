// Vercel builds must run on its Linux worker, never from Windows --prebuilt output.
import assert from 'node:assert/strict'
assert.equal(process.platform,'linux','Build this deployment remotely on Vercel Linux; do not upload Windows prebuilt output.')
const {default:sharp}=await import('sharp')
const png=await sharp({create:{width:1,height:1,channels:4,background:'#ffffff'}}).png().toBuffer()
const metadata=await sharp(png).metadata()
assert.equal(metadata.width,1);assert.equal(metadata.height,1);assert.equal(metadata.format,'png')
console.log(JSON.stringify({nativeRuntimeVerified:true,platform:process.platform,architecture:process.arch,sharpLoaded:true,pngRoundTrip:true}))
