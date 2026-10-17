# HTML/CSS aceitos e limites de segurança

## HTML

HTML semântico e de apresentação: div, section, header, footer, main, nav, article, aside, h1–h6, p, span, strong, em, b, i, small, ul, ol, li, figure, figcaption, img, a, br, hr, table, thead, tbody, tr, td, th, details, summary, blockquote, address, dl, dt, dd, code, pre. `template` só é aceito como bloco de item de uma coleção declarada.

SVG inline limitado: svg, g, path, circle, ellipse, rect, line, polyline, polygon, defs, linearGradient, radialGradient, stop, clipPath, mask e title. Não há script, animação SVG, foreignObject, use externo ou namespaces executáveis. Arquivos .svg não são aceitos no ZIP nesta etapa.

Atributos: class, id, role, title, alt, width, height, loading, decoding, colspan, rowspan, scope, open, hidden, aria-*, os quatro marcadores de edição e atributos geométricos SVG listados em `politica-runtime.json`. Não há style inline. `src` fixo deve apontar para asset do ZIP. Links externos são campos declarados; href fixo só pode ser âncora local. target/rel são definidos pelo motor. A navegação local é tratada pelo script do sistema dentro do iframe.

Elementos ou atributos não suportados produzem erro com caminho no HTML. O sistema não remove um elemento perigoso e continua com um design diferente.

## CSS

CSS padrão em styles.css, validado por PostCSS e CSS Tree: Grid, Flexbox, posições relative/absolute/fixed/sticky, dimensões, proporções, espaçamentos, sobreposições, gradientes, sombras, bordas, recortes, transformações, pseudoelementos, tipografia e seletores suportados pelo parser. Propriedades desconhecidas e valores inválidos são rejeitados. A lista de propriedades reconhecidas pelo parser está em `politica-runtime.json`; ela não garante suporte idêntico em todo navegador.

Regras permitidas: @media, @supports, @container, @font-face e @layer. Breakpoints são os escritos pelo autor, sem tradução para presets. @import e demais regras são rejeitadas. @font-face aceita família, src, estilo, peso, font-display, largura e unicode-range; use WOFF2 do ZIP, sem local().

URLs só podem referenciar os assets do ZIP. Não use escapes CSS com barra invertida, delimitadores HTML, expression(), paint(), image()/image-set()/src() ou downloads externos. Animações/transições e @keyframes ainda são rejeitados para estabilizar a revisão visual. Não há execução de JavaScript, React, plugins, formulários, embeds, mapas iframe ou widgets de pagamento. Para localização, use texto e um link HTTPS de mapa; para horários, texto ou tabela HTML editável.

## Isolamento

O conteúdo é exibido em iframe com origem opaca: sandbox sem allow-same-origin. Apenas o script de diagnóstico/navegação do próprio sistema tem nonce autorizado por CSP. Não há script vindo do ZIP, acesso a cookies/DOM do Admin, rede de conexão, objetos, formulários, frames filhos ou recursos remotos arbitrários. Apenas fontes/imagens validadas do store persistente podem ser carregadas além dos recursos incorporados. Links HTTPS do usuário podem abrir outra aba; scripts do template não têm essa capacidade.

O ZIP é processado em memória. São rejeitados caminhos relativos com traversal, duplicatas, links simbólicos, ZIP64, criptografia, arquivos de código, tipos de mídia divergentes e arquivos excessivamente grandes. Não há extração no filesystem. SHA-256 identifica o conteúdo do pacote e cada asset.

Os hashes conferem integridade e identidade, não são uma assinatura de autor. Todo conteúdo continua passando pela validação de segurança ao ser salvo. Os backups/revisões do sistema precisam incluir o JSON completo, porque ele contém as mídias incorporadas.

## Limitações visuais

Não é um navegador universal nem um editor livre de HTML. Recursos não suportados são rejeitados antes de importar. Um template válido ainda pode conter mau design ou excesso de texto; a aprovação visual é obrigatória. A medição automática não comprova contraste, perfeição tipográfica, toda sobreposição ou equivalência com um mockup gerado fora do pacote.

Não se promete igualdade de pixels entre sistemas operacionais/navegadores diferentes. Para mesma versão do navegador, viewport, conteúdo e recursos, prévia e página usam o mesmo documento e motor; a publicação não recompõe o layout.

A validação também rejeita chaves JSON duplicadas. Limites estruturais: profundidade HTML 40, 5.000 nós de origem e 10.000 nós após expansão. A descompressão usa worker com prazo de três segundos e limite de memória, sem executar código do pacote.
