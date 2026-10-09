import {resizeCoordinates,type CropperState,type CoreSettings,type ResizeAnchor,type MoveDirections,type ResizeOptions} from 'react-advanced-cropper'
// Keep the mature library's bounds/anchor algorithm. Free mode disables its
// optional ratio preservation and compensation, including a held Shift key.
export function resizeCropCoordinates(state:CropperState,settings:CoreSettings,anchor:ResizeAnchor,directions:MoveDirections,options:ResizeOptions={},free=false){return resizeCoordinates(state,free?{...settings,aspectRatio:{minimum:0,maximum:Infinity}}:settings,anchor,directions,free?{...options,reference:undefined,preserveAspectRatio:false,compensate:false}:options)}
