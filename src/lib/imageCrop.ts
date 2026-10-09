export interface CropGeometry {x:number;y:number;width:number;height:number}
export function cropGeometry(width:number,height:number,aspect:number,zoom:number,panX:number,panY:number):CropGeometry{
 if(![width,height,aspect,zoom,panX,panY].every(Number.isFinite)||width<=0||height<=0||aspect<=0)throw Error('Dimensões de recorte inválidas.')
 const baseWidth=Math.min(width,height*aspect),baseHeight=baseWidth/aspect,z=Math.max(1,Math.min(4,zoom)),w=baseWidth/z,h=baseHeight/z
 return {x:(width-w)*(Math.max(-1,Math.min(1,panX))+1)/2,y:(height-h)*(Math.max(-1,Math.min(1,panY))+1)/2,width:w,height:h}
}
export function cropOutputSize(crop:CropGeometry,max=1600){const scale=Math.min(1,max/Math.max(crop.width,crop.height));return {width:Math.max(1,Math.round(crop.width*scale)),height:Math.max(1,Math.round(crop.height*scale))}}
