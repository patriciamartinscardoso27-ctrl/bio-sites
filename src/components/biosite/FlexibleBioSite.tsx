import type {Bio} from '../../types/biosite'
import type {CSSProperties} from 'react'
import {PremiumBioSite} from '../PremiumBioSite'
import {VisualHero} from './VisualHero'
import {visualStyles} from '../../lib/visualStyles'
import '../../styles/actionTiles.css'
import '../../styles/flexibleBio.css'
export function FlexibleBioSite({bio,embedded=false}:{bio:Bio;embedded?:boolean}){
 const v=bio.designVisual,style={...visualStyles({...v,paddingX:0,paddingY:0}),maxWidth:v?.maxWidth||480,'--flex-page-inset':(v?.paddingX??16)+'px','--flex-background':v?.background||bio.appearance?.background||'#101719','--flex-text':v?.text||bio.appearance?.text||'#f7f6f0','--flex-panel':v?.panel||bio.appearance?.panel||'#1b2329','--flex-radius':(v?.radiusPx??16)+'px','--flex-font':bio.appearance?.font==='serif'?'Georgia,serif':bio.appearance?.font==='condensed'?'Impact,Arial,sans-serif':'Arial,sans-serif'} as CSSProperties
 return <article data-reference-composition={bio.sections.some(s=>s.visual?.heightPercent!==undefined)||undefined} className={'biosite flexible-biosite '+(embedded?'embedded':'')} style={style}>{bio.heroEnabled!==false&&<VisualHero bio={bio}/>}<PremiumBioSite bio={{...bio,heroEnabled:false,style:['barber','beauty','auto'].includes(bio.composition?.preferences.categoryId||'')?'black-gold':'boutique-gold'}} sourceStyle={bio.style} embedded categoryCta="Ver opções"/></article>
}
