import test from 'node:test'
import assert from 'node:assert/strict'
import {cropSource} from '../src/lib/cropSource.ts'
test('existing raster remains byte-identical and unsupported sources reject',async()=>{
 const source=new Blob(['raster'],{type:'image/png'}),result=await cropSource(source)
 assert.equal(result.type,'image/png');assert.equal(await result.text(),'raster')
 await assert.rejects(cropSource(new Blob(['html'],{type:'text/html'})))
})
test('vector cropping rasterizes at intrinsic resolution, keeps alpha and releases temporary URL',async()=>{
 const oldImage=globalThis.Image,oldDocument=globalThis.document,create=URL.createObjectURL,revoke=URL.revokeObjectURL
 let released=false,drawn,format,canvas={getContext:()=>({drawImage:(...args)=>drawn=args}),toBlob:(callback,type)=>{format=type;callback(new Blob(['png'],{type}))}}
 URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=url=>{assert.equal(url,'blob:test');released=true}
 globalThis.Image=class{naturalWidth=320;naturalHeight=180;set src(value){assert.equal(value,'blob:test');queueMicrotask(()=>this.onload())}}
 globalThis.document={createElement:()=>canvas}
 try{const result=await cropSource(new Blob(['<svg/>'],{type:'image/svg+xml'}));assert.equal(result.type,'image/png');assert.equal(canvas.width,320);assert.equal(canvas.height,180);assert.deepEqual(drawn.slice(1),[0,0,320,180]);assert.equal(format,'image/png');assert(released)
 released=false;globalThis.Image=class{naturalWidth=10000;naturalHeight=10000;set src(value){queueMicrotask(()=>this.onload())}};await assert.rejects(cropSource(new Blob(['svg'],{type:'image/svg+xml'})));assert(released)
 }finally{globalThis.Image=oldImage;globalThis.document=oldDocument;URL.createObjectURL=create;URL.revokeObjectURL=revoke}
})
