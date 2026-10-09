import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/themes.css'
import './styles/editor.css'
import './styles/buttons.css'
import './styles/library.css'
import './styles/modelPicker.css'
import './styles/compactBio.css'
import './styles/premiumBio.css'
import './styles/mobileAdmin.css'
import './styles/collectionBio.css'
import './styles/actionTiles.css'
import './styles/createFlow.css'
import './styles/templateGallery.css'
import { AdminAuth } from './components/AdminAuth'
import {PublicBioSite} from './components/PublicBioSite'
import './styles/adminDemo.css'

const modernDemo = new URLSearchParams(window.location.search).get('admin-demo') === 'modern'
const classic = new URLSearchParams(window.location.search).get('admin-look') === 'classic'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {location.pathname.startsWith('/b/')?<PublicBioSite/>:!classic?<div className={modernDemo?'admin-modern admin-preview':'admin-modern'}>{modernDemo&&<div className="admin-demo-label">COMPARAÇÃO VISUAL · <a href="/admin?admin-look=classic">Ver painel anterior</a></div>}<AdminAuth/></div>:<AdminAuth/>}
  </StrictMode>,
)
