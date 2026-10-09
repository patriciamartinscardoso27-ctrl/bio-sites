import {forwardRef,useCallback} from 'react'
import {Cropper,type CropperRef,type CropperProps} from 'react-advanced-cropper'
import {resizeCropCoordinates} from '../lib/cropResize'
export default forwardRef<CropperRef,CropperProps>(function ProfessionalCropper(props,ref){
 const free=props.stencilProps?.aspectRatio===undefined
 const resize=useCallback<NonNullable<CropperProps['resizeCoordinatesAlgorithm']>>((state,settings,anchor,directions,options)=>resizeCropCoordinates(state,settings,anchor,directions,options,free),[free])
 return <Cropper {...props} ref={ref} resizeCoordinatesAlgorithm={resize}/>
})
