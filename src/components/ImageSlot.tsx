import type {ImgHTMLAttributes} from 'react'
// Render-only placeholder: never stored as user content or used as a page background.
const placeholder='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#e5e7eb"/><path d="M190 380l75-100 65 70 45-55 60 85z" fill="#9ca3af"/><circle cx="375" cy="220" r="28" fill="#9ca3af"/></svg>')
export function ImageSlot({src,aspect,...props}:ImgHTMLAttributes<HTMLImageElement>&{aspect?:number}){return <img {...props} src={src||placeholder} data-image-slot="true" data-placeholder={!src||undefined} style={{...props.style,...(aspect?{aspectRatio:String(aspect/100),objectFit:'cover' as const}: {})}}/>}
