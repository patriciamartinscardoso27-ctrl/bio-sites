import {sectionLayouts} from '../../lib/designSystem'
// Shared component families. These are editable data + real renderers, never image templates.
export const blockLibrary={
 hero:{renderer:'VisualHero',variants:['cover','stacked','split','profile','overlap']},
 profile:{renderer:'VisualHero',variants:['profile','stacked','overlap']},
 actions:{renderer:'QuickActions',variants:['tiles','cards','rows'],columns:[1,2,3,4]},
 products:{renderer:'PremiumBioSite/items',variants:sectionLayouts.products},
 services:{renderer:'PremiumBioSite/items',variants:sectionLayouts.services},
 categories:{renderer:'PremiumBioSite/collections',variants:['grid','carousel'],columns:[1,2,3,4]},
 gallery:{renderer:'PremiumBioSite/gallery',variants:sectionLayouts.gallery},
 banner:{renderer:'PremiumBioSite/promotion',variants:['top','left','right','background']},
 about:{renderer:'PremiumBioSite/about',variants:['top','bottom','left','right','background']},
 benefits:{renderer:'PremiumBioSite/benefits',variants:['cards','list'],columns:[1,2,3,4]},
 testimonials:{renderer:'PremiumBioSite/reviews',variants:sectionLayouts.testimonials},
 hours:{renderer:'PremiumBioSite/hours',variants:['list']},
 location:{renderer:'PremiumBioSite/location',variants:['address','image','background']},
 cta:{renderer:'PremiumBioSite/final',variants:['solid','outline','soft','image']},
 custom:{renderer:'PremiumBioSite/custom',variants:['text','image-text','picture-text','image','cards','cta','list']},
} as const
