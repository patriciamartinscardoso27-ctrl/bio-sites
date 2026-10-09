import type {Action} from '../types/biosite'
const subtitles:Record<string,string>={whatsapp:'Fale agora',instagram:'Nos siga',facebook:'Acompanhe',tiktok:'Veja os vídeos',reviews:'Sua opinião',location:'Ver no mapa',phone:'Ligue agora',email:'Envie uma mensagem',website:'Conheça mais',menu:'Ver opções',booking:'Seu horário',quote:'Peça seu orçamento',order:'Escolha e peça',custom:'Saiba mais'}
export function actionSubtitle(action:Action){return action.subtitle??subtitles[action.kind||'whatsapp']}
