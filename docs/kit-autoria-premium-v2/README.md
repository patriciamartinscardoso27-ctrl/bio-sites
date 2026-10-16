# Kit de Autoria Premium V2

Esta versão cria composições premium com componentes genéricos, sem seleção por nome/UUID de cliente, sem Gemini e sem executar código do pacote. V1 continua aceita pelo mesmo importador e usa seus renderizadores anteriores. Um arquivo V1 não é convertido automaticamente em V2.

Compartilhe com o ChatGPT: este guia, `contrato-v2.schema.json`, `prompt-chatgpt-v2.md` e os dois JSONs em `exemplos/`. As regras de conteúdo, mídia e envelope de arquivos da V1 continuam relevantes; o guia anterior está em `../kit-autoria-premium/README.md`. A V2 aqui descrita está implementada **localmente**, sem publicação.

## Contrato e versão

```json
{
  "format":"bio-sites-premium",
  "schemaVersion":2,
  "renderer":{"id":"biosite","version":2,"profile":"premium"},
  "components":[{"id":"hero.premium","version":1},{"id":"section.catalog","version":1}],
  "assets":{"version":1,"storage":"references","media":[]},
  "editing":{"version":1,"adapter":"existing-editor"},
  "design":{}
}
```

Este trecho só ilustra o envelope, não é um arquivo completo. Use os exemplos completos validados. `design` é o Bio existente, com campos de conteúdo obrigatórios (id UUID, style, name, category, headline, tagline, description, color, cover, logo, phone, address, hours, instagram; arrays sections/actions/services/products/highlights/benefits/photos), acrescido de **`premiumV2`**. `style` e `color` permanecem para compatibilidade dos dados; o desenho V2 é definido por `premiumV2`, não por esse estilo legado.

`design.premiumV2` exige somente chaves:

- `version`: exatamente `2`.
- `page`: `{surface?,font?,maxWidth?,gap?}`. Fonte `sans|serif|condensed`, largura 320–1200px, gap 0–60px. Fallback de largura: 480px.
- `hero`: obrigatório se `heroEnabled` não for false; proibido se o hero estiver desativado.
- `sections`: objeto cuja chave é cada ID de `design.sections` (incluindo seções desativadas) e valor é a configuração visual correspondente. Não aceite IDs extras ou ausentes.

Não combine V2 com `layoutPreset`, `renderMode`, `composition`, `heroVisual`, `heroLayout`, `designVisual`, `textVisual`, `appearance` ou `identity`. Nas seções não use `visual`, `titleVisual`, `layout`, `block`, `entryIcons`, `entryTextOptions` ou `video`. Actions/items não usam `visual`, `titleVisual`, `appearanceMode`, `iconColorMode`: os estilos estão na configuração V2. Controles incompatíveis são rejeitados com caminho do campo.

O catálogo `components` tem IDs únicos de todos os componentes realmente presentes, incluindo desativados: `hero.premium` se habilitado e `section.<component>` para cada `premiumV2.sections[id].component`. Todos têm `version:1`. A ordem da lista não altera a composição; a ordem de `design.sections` continua determinando a página.

## Fundamentos seguros

**Surface:** `{color?,gradient?,borderColor?,borderWidth?,radius?,shadow?}`. Cores hex de seis dígitos; borda inteira 0–8px; raio 0–64px; sombra `none|soft|strong`. Borda zero remove a borda padrão do componente. Gradiente pode ser uma string linear no vocabulário restrito da V1, ou o objeto abaixo, que permite transparência sem aceitar CSS arbitrário:

```json
{"angle":90,"stops":[{"color":"#090807","at":0,"opacity":100},{"color":"#090807","at":100,"opacity":0}]}
```

Ângulo inteiro -360–360, 2–6 paradas em ordem crescente, `at` e `opacity` inteiros 0–100. Cor obrigatória; opacity ausente vale 100. A implementação gera o CSS a partir desses números/cores. Não há `url()`, filtros, expressões, variáveis CSS, script ou import de fonte.

**Typography:** `{family?,size?,sizeMedium?,sizeLarge?,weight?,lineHeight?,letterSpacing?,color?,align?}`. Fonte `sans|serif|condensed`; tamanhos inteiros 8–72px; peso 300–900; altura de linha 100–240 (150 = 1,5); espaçamento de letras 0–20 (10 = 1px); align `left|center|right`. Tamanhos responsivos exigem `size` base. Não há fonte manuscrita externa: a fonte cursiva da demonstração ainda exige futura ampliação/licenciamento.

**Box:** `{x,y,width,height}`, quatro inteiros em porcentagem do contêiner imediato. x/y 0–100, width/height 1–100; a caixa não pode ultrapassar o contêiner (`x+width <= 100`, `y+height <= 100`). Textos permanecem editáveis e devem caber na região; o validador não prevê o tamanho final de qualquer texto que o cliente digitar.

**Responsividade:** duas faixas fixas por **largura do componente**, não por modelo de aparelho: `medium` a partir de 390px e `large` a partir de 430px. Valores não definidos herdam a faixa anterior. Seções com grid aceitam `responsive:{medium:{columns?,gap?,padding?},large:{...}}`. Não envie breakpoints inventados ou CSS media queries.

## Hero premium

Configuração: `{version:1,height,surface?,layers?,photo?,logo?,texts,cta?,responsive?}`.

- `height`: 240–1000px. `responsive.medium/large` pode definir outra height.
- `photo` usa **design.cover**; `logo` usa **design.logo**. Cada uma tem `{box,fit?,position?,responsive?}`. Fit `cover|contain`; position `{x,y}` em 0–100; responsive contém caixas alternativas medium/large.
- `texts`: até quatro regiões distintas `{field,box,type?,responsive?}`. Field é `name|headline|tagline|description`, sem repetição. Headline é o h1. Para fidelidade, envie as regiões de conteúdo necessárias explicitamente.
- `cta`: `{actionId,box,button?}`, com actionId de **design.actions**. Continua editável pelo editor de ações existente. O contato não é inferido da imagem.
- `layers`: camadas decorativas acima da foto e abaixo de logo/textos/CTA; use para escurecimento, integração e tratamento da imagem. A surface da página/hero fica atrás.

Trocar a foto não altera seu vínculo, mas pode exigir outro ponto focal. Não há geração de recorte transparente, reconstrução de rosto/cabelo ou aumento de resolução. Fotografias reais disponíveis determinam a qualidade possível.

## Camadas e banners

Máximo seis camadas em hero/banner, na ordem de desenho declarada. Cada camada pode ter box (padrão 0/0/100/100) e opacity (0–100).

- Imagem: `{kind:"image",source,fit?,position?,box?,opacity?}`.
- Gradiente: `{kind:"gradient",value:<V2Gradient>,box?,opacity?}`.
- Sólido: `{kind:"solid",color,box?,opacity?}`.

**source é um binding de conteúdo**, nunca código/URL nova: `cover` usa design.cover; `image` usa section.image; `photo.0`, `photo.1` etc. usam fotos locais da seção ou as globais. Ausência da imagem vinculada produz erro de validação. URLs reais continuam nos campos de conteúdo e entram no inventário de mídia. Assim, editar section.image pelo painel atual atualiza a camada sem alterar o layout.

Banner usa os textos da seção, inclusive badge/ctaLabel, e `section.action` para CTA. A cópia fica sobre as camadas em fluxo, com padding interno; nesta entrega não há múltiplas regiões independentes de texto dentro de um banner, como no hero.

## Botões independentes

`button` aceita `{surface?,iconSurface?,iconColor?,iconSize?,label?,caption?,layout?,height?}`:

- surface desenha o botão inteiro; iconSurface desenha somente a área do ícone.
- label e caption são Typography independentes; caption controla subtitle/description da action.
- iconSize 12–56px; height mínimo 32 e máximo 160px; layout `tile|row|inline`.
- O ícone é o `action.icon` do catálogo instalado, desenhado por ActionIcon. Não se aceita SVG arbitrário no pacote.
- Em `actions`, `button` é padrão; `buttons:{<actionId>:<Button>}` substitui completamente a configuração para essa ação. IDs inexistentes são rejeitados.

Destinos continuam sendo os do sistema: source business/custom, url, número, mensagem e destination section/sectionId. Estilos não alteram destinos. Nunca inclua chaves, credenciais ou dados privados no pacote. Links internos devem apontar para seções existentes e habilitadas. Para chamadas comerciais, preencha contatos autorizados antes de publicar.

## Componentes de seção V2

Todos têm `{version:1,component,surface?,heading?,text?,padding?,gap?}`. Heading/text são Typography; padding 0–80px; gap 0–48px. Propriedades específicas são estritas por componente; por exemplo `hours.columns` é rejeitado.

| component | kind existente compatível | Propriedades específicas |
| --- | --- | --- |
| `actions` | actions | columns, responsive, button, buttons |
| `banner` | promotion, about, whatsapp | layers, height (120–800px), button |
| `catalog` | products, services | columns, responsive, variant, imageAspect, imageFit, imagePosition, mediaWidth, cardSurface, itemTitle, itemText, price, details, button |
| `profiles` | products, services, categories | columns, responsive, variant, imageAspect, imageFit, imagePosition, cardSurface, itemTitle, itemText, button |
| `gallery` | gallery | columns, responsive, variant, imageAspect, images, comparison |
| `text` | about | variant, mediaWidth, imageAspect, imageFit, imagePosition, button |
| `benefits` | benefits | columns, responsive, cardSurface, itemTitle, itemText |
| `hours` | hours | cardSurface |
| `location` | location | variant, mediaWidth, imageAspect, imageFit, imagePosition, button |
| `testimonials` | testimonials | columns, responsive, cardSurface, itemTitle, itemText |

Columns é inteiro 1–4; mediaWidth é 20–80%; imageAspect é 40–300 (150 = razão largura/altura 1,5); imageFit cover/contain; imagePosition x/y 0–100. CardSurface é Surface; itemTitle/itemText/price são Typography. Não aplique configuração de grid a componentes sem grid.

`mediaWidth` exige catálogo horizontal ou text/location split. `button` em banner/text/location exige section.action; em catálogo/perfis exige ao menos uma ação de item/coleção. Hero photo/logo configurados exigem cover/logo não vazios. Esses casos são rejeitados para não aceitar estilos ou vínculos que não teriam efeito.

**Catalog:** variantes `vertical|horizontal|overlay`. Os dados são items da seção, ou products/services globais. No horizontal, mediaWidth define a coluna da imagem. `details:true` mostra a descrição inicial e abre a descrição completa num `<details>` acessível, sem navegar para outro site. Uma action explícita no item continua sendo CTA separado. Para texto inicial curto, coloque resumo e detalhes separados por `\n\n` em description.

**Profiles:** `vertical|overlay`. Reutiliza items (title = nome, price = especialidade, description = biografia, image = foto) ou highlights em categories (label/caption/image). Isso permite apresentar profissionais, parceiros ou estabelecimentos sem inventar outro cadastro. Os dados continuam editáveis como itens/coleções existentes.

**Gallery:** `grid|featured|before-after`. Cada foto continua no array photos existente. imageAspect define a proporção padrão. `images:[{index,aspect?,span?,fit?,position?}]` permite tratamento individual, com índices únicos válidos. Span exige featured, não pode exceder as colunas base/responsivas. before-after exige comparison com índices distintos `{before,after,beforeLabel?,afterLabel?}`; nessa variante não envie columns/responsive/images. O slider é nativo e acessível. Imagens escolhidas devem ser uma comparação verdadeira e autorizada; o exemplo adicional usa apenas Foto A/Foto B e não faz afirmação de resultado real.

**Text/location:** `split|stacked`. Imagem em section.image, conteúdo em text/endereço. A localização usa endereço/mapa locais ou globais, ou section.action explícita. Não executa iframe arbitrário nem simula mapa real. Hours usa o texto de horários do sistema (`Dia: Horário` por linha).

Benefits continuam no formato `Título|Texto`; testimonials em `section.text`, `Nome|Depoimento` por linha. Esta entrega não adiciona fotos/avaliações verificadas para depoimentos.

## Mídia, tamanho e edição

Persistência continua usando o objeto Bio existente com uma propriedade adicional, sem migração SQL. O endpoint de importação/exportação valida em memória e não chama Neon nem Gemini. Não houve gravação de clientes nesta implementação.

Permanecem limite de 4.000.000 bytes do pacote, versões/IDs/componentes estritos, inventário exato, URLs seguras, listas/profundidade limitadas e proibição de chaves de poluição de protótipo. Os arquivos de imagem não são hospedados pelo importador. Para novos clientes externos use HTTPS público estável, autorizado e direto; o exemplo usa caminhos de imagens que já existem nesta instalação, sem embuti-las no ZIP do kit.

Edite fotos/textos/preços/links/serviços no painel existente. Os componentes declaram os mesmos proprietários `data-bio-field`, `data-section-id`, `data-item-id`, `data-action-id`, `data-photo-index`. Foram testadas alterações por componentes reais do editor. O layout V2 fica no contrato JSON: controles antigos que produzam propriedades V1 não são um editor visual V2 e serão rejeitados na validação, em vez de ignorados. Adicionar/remover seções exige manter o mapa de configuração; remover fotos destacadas pode exigir atualizar índices. Isso não altera o editor nem o comportamento dos clientes V1.

## Validação e uso

1. Peça ao ChatGPT o arquivo inteiro usando o prompt anexado, schema e exemplos. Não envie somente a imagem de demonstração.
2. No painel com a implementação V2, abra Importar Design Premium e selecione o `.biosite.json`. O importador detecta a versão, valida e mostra o renderer real.
3. Confira a prévia antes de aprovar. Nenhuma gravação ocorre até clicar em criar rascunho; publicação é uma ação separada.
4. Capture a demonstração de três celulares da própria página/pacote validado. Uma imagem gerada separadamente não garante equivalência visual.

Validação técnica opcional, no repositório com dependências instaladas:

```powershell
node docs/kit-autoria-premium/validar.mjs docs/kit-autoria-premium-v2/exemplos/beleza-premium-v2.biosite.json docs/kit-autoria-premium-v2/exemplos/comparacao-v2.biosite.json
```

O schema é auxílio estrutural; regras cruzadas (kind/component, inventário, binds, caixas, variantes e paradas do gradiente) dependem do validador real. Apenas passar num validador externo de JSON Schema não comprova aceitação ou fidelidade.

## Limites e próximas ampliações

Já existem fundamentos para hero, botões, camadas, banners, cards, galerias, comparação, profissionais, horários, localização e tipografia responsiva. Ainda faltam fontes personalizadas/manuscritas, máscaras livres, vídeos genéricos V2, filtros/abas de catálogo, efeitos de movimento, regiões independentes de texto em banners, editor visual da composição V2 e ZIP autocontido com upload de mídia. Não há execução de código arbitrário.

O exemplo de beleza é uma prova de composição com fotos reais existentes, não uma promessa de reprodução 100% idêntica da imagem aprovada. A foto da segunda profissional não foi fornecida: o card mostra a especialidade com imagem de unhas e deixa essa necessidade explícita. Endereço e contatos comerciais também precisam de confirmação; CTAs demonstrativos usam example.com, sem gerar contatos automáticos. A proporção de destaque prioriza cabelos e mantém uma galeria menor de unhas.
