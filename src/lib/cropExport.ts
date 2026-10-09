// Preview dimensions never restrict the full-resolution confirmation output.
export const cropFormats=[['original','Original'],['free','Livre'],['1:1','1:1'],['4:5','4:5'],['3:4','3:4'],['16:9','16:9'],['9:16','9:16']] as const
export type CropFormat=typeof cropFormats[number][0]
export function cropAspect(format:CropFormat,_width:number,_height:number){if(format==='free'||format==='original')return undefined;const [a,b]=format.split(':').map(Number);return a/b}
export function cropCanvasOptions(preview=false,transparent=false){return {fillColor:transparent?'transparent':'#ffffff',imageSmoothingEnabled:true,imageSmoothingQuality:'high' as const,...(preview?{maxWidth:480,maxHeight:320}:{})}}
export function encodeCropCanvas(canvas:HTMLCanvasElement,transparent=false){if(!canvas.width||!canvas.height)throw Error('O recorte está vazio.');return canvas.toDataURL(transparent?'image/png':'image/jpeg',.95)}
