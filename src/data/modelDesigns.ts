import type { VisualStyle } from '../types/biosite'

export type HeroLayout = 'cinematic' | 'arch' | 'split' | 'editorial' | 'profile' | 'mosaic' | 'framed' | 'spotlight' | 'panorama' | 'diagonal'
export interface ModelDesign {
  hero: HeroLayout; actions: 'rail' | 'grid' | 'pills' | 'stack' | 'dock';
  catalog: 'tiles' | 'feature' | 'rows' | 'strip' | 'bento';
  services: 'photos' | 'numbered' | 'menu' | 'feature' | 'compact';
  gallery: 'mosaic' | 'film' | 'grid' | 'offset' | 'polaroid';
  final: 'photo' | 'ticket' | 'minimal' | 'split' | 'poster';
  paper: string; ink: string; muted: string; heading: string; radius: string;
  description: string;
}
const serif = 'Georgia, "Times New Roman", serif'
const sans = 'Arial, Helvetica, sans-serif'
const condensed = 'Impact, "Arial Narrow", sans-serif'
const mono = '"Courier New", monospace'
const design = (hero: HeroLayout, actions: ModelDesign['actions'], catalog: ModelDesign['catalog'], services: ModelDesign['services'], gallery: ModelDesign['gallery'], final: ModelDesign['final'], paper: string, ink: string, muted: string, heading: string, radius: string, description: string): ModelDesign => ({ hero, actions, catalog, services, gallery, final, paper, ink, muted, heading, radius, description })

// Composition is independent of business content and button behavior. No model owns an editor.
export const modelDesigns: Record<VisualStyle, ModelDesign> = {
  'boutique-gold': design('cinematic','grid','tiles','menu','grid','photo','#11110f','#eee7d9','#b3aa9a',serif,'0px','Hero cinematográfico, coleção elegante e galeria editorial.'),
  'fashion-pink': design('mosaic','pills','bento','photos','offset','ticket','#fff3f8','#3e1930','#90657b',sans,'20px','Colagem fashion, formas arredondadas e lançamentos em destaque.'),
  'clean-nude': design('panorama','rail','strip','compact','film','minimal','#faf7f1','#4c4037','#837971',serif,'0px','Fotografia ampla, coleção leve e tipografia delicada.'),
  'urban-black': design('editorial','stack','rows','numbered','mosaic','poster','#171717','#f3f3ef','#aaa',condensed,'0px','Manchetes fortes, cortes geométricos e vitrine editorial.'),
  'social-trend': design('profile','grid','tiles','compact','grid','split','#fff','#282536','#7b7489',sans,'16px','Perfil compacto, destaques circulares e feed integrado.'),

  'black-gold': design('cinematic','rail','tiles','photos','mosaic','photo','#141414','#f5eee1','#b6aea2',serif,'8px','Foto imersiva, assinatura dourada, serviços fotográficos e mosaico de cortes.'),
  'vintage-barber': design('framed','pills','rows','menu','polaroid','ticket','#f1e6ce','#422c20','#786756',serif,'2px','Moldura de barbearia clássica, tabela de serviços e fotos como lembranças.'),
  'urban-street': design('editorial','stack','bento','numbered','offset','poster','#151515','#f1f1e8','#a5a59e',condensed,'0px','Tipografia de rua, retrato lateral, serviços numerados e galeria assimétrica.'),
  'clean-gentleman': design('split','pills','strip','compact','film','minimal','#fafaf6','#21362f','#69746e',serif,'4px','Retrato recortado, navegação discreta e lista limpa de cuidados.'),
  'luxury-dark': design('spotlight','dock','feature','feature','film','split','#101820','#f2eee8','#a9b2b8',serif,'16px','Retrato em arco, marca central e serviço assinatura em grande destaque.'),

  'rose-gold': design('arch','pills','tiles','photos','offset','photo','#fff5ef','#583b35','#8b716a',serif,'24px','Fotografia em arco, ações delicadas e tratamentos em cartões fotográficos.'),
  'nude-elegance': design('split','rail','strip','menu','film','minimal','#f7f0e8','#5c4d40','#8c7c6f',serif,'0px','Hero dividido, respiro editorial e tratamentos organizados como um menu.'),
  'luxury-black': design('cinematic','dock','feature','feature','mosaic','split','#151215','#f8edef','#b6a2ad',serif,'10px','Capa de impacto, ações flutuantes e tratamento principal com imagem ampla.'),
  'clean-spa': design('panorama','grid','rows','compact','grid','ticket','#f5faf5','#294a3e','#71877c',sans,'18px','Paisagem tranquila, apresentação abaixo da foto e cuidados em linhas suaves.'),
  'beauty-glam': design('mosaic','stack','bento','numbered','polaroid','poster','#ffeff8','#54263f','#93647d',sans,'28px','Colagem de beleza, chamada expressiva e galeria com molduras divertidas.'),

  'gourmet-dark': design('cinematic','rail','feature','menu','mosaic','photo','#171714','#f8eedb','#b7ad99',serif,'4px','Gastronomia em tela cheia, prato protagonista e cardápio de inspiração.'),
  'fast-food-red': design('diagonal','grid','bento','compact','grid','ticket','#fff5e8','#381f1a','#8d695d',condensed,'20px','Produto recortado, faixa diagonal, combos em bento e pedido direto.'),
  'rustic-kitchen': design('framed','pills','rows','menu','polaroid','split','#f1eadc','#4c3b28','#8b7b65',serif,'3px','Mesa acolhedora, moldura artesanal e pratos em lista de casa.'),
  'clean-menu': design('profile','rail','tiles','compact','film','minimal','#fafcf8','#2a4433','#71816e',sans,'12px','Perfil gastronômico, categorias fáceis e fotos limpas dos pratos.'),
  'street-food': design('editorial','stack','strip','numbered','offset','poster','#171e22','#faf5e6','#b2b5ae',condensed,'0px','Cartaz urbano, pratos em faixa e galeria de rua com recortes.'),

  'candy-pink': design('mosaic','pills','tiles','compact','polaroid','ticket','#fff2f7','#6b3450','#a4778d',serif,'26px','Composição doce em colagem, cartões macios e detalhes de confeitaria.'),
  'chocolate-premium': design('cinematic','rail','feature','menu','film','photo','#241811','#f8e9d2','#bfaa93',serif,'5px','Chocolate em destaque, vitrine assinatura e galeria de texturas.'),
  'clean-patisserie': design('split','pills','strip','menu','offset','minimal','#fffdf7','#574a3b','#8d8274',serif,'0px','Composição de ateliê, fotografia grande e vitrine com respiro.'),
  'color-fun': design('diagonal','grid','bento','photos','grid','poster','#fff9e8','#443353','#95829d',sans,'30px','Formas coloridas, doces em bento e um final de festa.'),
  'luxury-sweet': design('spotlight','dock','rows','feature','mosaic','split','#f9f3ea','#554139','#9b8578',serif,'16px','Bolo em pedestal visual, monograma e seleção em linhas refinadas.'),

  'auto-premium': design('cinematic','dock','feature','photos','mosaic','photo','#151b22','#edf3f7','#a2afbb',sans,'12px','Oficina em foto imersiva, ações diretas e serviços com imagem.'),
  'performance-red': design('diagonal','stack','strip','numbered','offset','poster','#17191c','#f5f3ef','#b1b3b9',condensed,'0px','Cortes diagonais, ritmo esportivo e serviços numerados.'),
  'tech-blue': design('mosaic','grid','bento','feature','grid','ticket','#eff7ff','#203e59','#698399',sans,'18px','Composição técnica com fotos complementares e diagnóstico em destaque.'),
  'industrial': design('editorial','rail','rows','menu','film','split','#eae8e2','#343c3a','#727b77',mono,'0px','Grade técnica, títulos monoespaçados e lista de serviços industrial.'),
  'clean-professional': design('split','pills','tiles','compact','offset','minimal','#f8fafb','#284650','#758b90',sans,'8px','Identidade clara, foto lateral e serviços fáceis de consultar.'),

  'business-premium': design('spotlight','dock','feature','feature','mosaic','photo','#10231e','#f4eee3','#a9bab0',serif,'12px','Marca central, fotografia em moldura e solução principal em destaque.'),
  'modern-blue': design('mosaic','grid','tiles','photos','grid','ticket','#eff5ff','#263b60','#7183a0',sans,'20px','Blocos modernos, fotografia dupla e soluções em cartões visuais.'),
  'clean-minimal': design('panorama','rail','strip','compact','film','minimal','#fff','#353b40','#7b858b',sans,'0px','Foto panorâmica, hierarquia limpa e seleção em faixa.'),
  'vibrant-sales': design('diagonal','stack','bento','numbered','polaroid','poster','#fff9ee','#453053','#907998',sans,'24px','Composição energética, destaque comercial e vitrine em bento.'),
  'elegant-corporate': design('framed','pills','rows','menu','offset','split','#f3f2ed','#31434b','#7a898b',serif,'3px','Marca editorial, enquadramento sóbrio e soluções em linhas.'),
}
