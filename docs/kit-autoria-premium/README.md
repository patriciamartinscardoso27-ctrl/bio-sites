# Kit de Autoria Premium — Bio-Sites v1

Para novos componentes visuais, veja também `../kit-autoria-premium-v2/README.md`. V1 continua documentada aqui e não é migrada automaticamente.

Este kit permite orientar o ChatGPT a produzir um **arquivo JSON declarativo**, sem geração Gemini no Bio-Sites e sem código executável. Ele documenta o importador existente; não adiciona componentes nem altera o editor. A imagem de três celulares, isoladamente, não é importável. A referência visual confiável deve ser capturada da página renderizada pelo próprio pacote.

## Arquivos para compartilhar com o ChatGPT

1. Este `README.md` e `prompt-chatgpt.md`.
2. `contrato.schema.json`: estrutura, campos, enums e limites para autoria.
3. `catalogo.json`: valores reais extraídos do código local, incluindo estilos, ícones, seções, layouts e números máximos.
4. `exemplos/aurora-flexivel.biosite.json`: composição fictícia, **sem layoutPreset**, com cores por seção, produtos, banner, galeria e botões.
5. `exemplos/xavier-biblioteca.biosite.json`: exportação do Modelo Pronto `moda-premium-gold` (Xavier Modas), com UUID transitório; não é um cliente cadastrado.

`referencia-runtime/` contém cópias textuais dos validadores e tipos usados nesta revisão para esclarecer detalhes avançados. Não contém credenciais nem dados de clientes. Os scripts `.mjs` deste kit são ferramentas locais de documentação/validação para desenvolvedores; **não fazem parte de um pacote importável** e não são executados pelo importador.

O contrato completo é a composição de `assertPremiumPackage`, `processPremiumDesign` e `validateBio`. JSON Schema sozinho não expressa inventário de mídia, coerência do renderizador, segurança de URLs, limites em bytes/nós e igualdade dos componentes. O schema fornecido é uma referência estrutural conservadora, não uma promessa de equivalência matemática ao validador. Use o procedimento de validação abaixo para confirmar aceitação real.

## 1. Envelope exato e versões

Todas as sete propriedades abaixo são obrigatórias. Não acrescente `$schema`, `html`, `css`, `code`, `scripts`, `metadata` ou campos inventados ao arquivo importável.

```json
{
  "format": "bio-sites-premium",
  "schemaVersion": 1,
  "renderer": {"id":"biosite","version":1,"profile":"flexible"},
  "components": [{"id":"hero","version":1},{"id":"section.products","version":1}],
  "assets": {"version":1,"storage":"references","media":[]},
  "editing": {"version":1,"adapter":"existing-editor"},
  "design": {}
}
```

O trecho acima mostra apenas o envelope; `design:{}` é incompleto e não é importável. Os exemplos anexos são os documentos completos validados.

| Campo | Regra |
| --- | --- |
| `format`, `schemaVersion` | Exatamente `bio-sites-premium` e número `1`. |
| `renderer` | `id:biosite`, `version:1`, `profile:preset`, `flexible` ou `standard`; único opcional: `presetId`. |
| `components` | Até 13 declarações únicas e exatas, cada uma `{id,version:1}`. |
| `assets` | Exatamente `version:1`, `storage:references`, `media:[{path,source}]`. Não há upload automático. |
| `editing` | Exatamente `version:1`, `adapter:existing-editor`. Não oferece regras de bloqueio por campo. |
| `design` | Objeto Bio completo, com chaves públicas permitidas. Não contém `client`. |

Coerência obrigatória: se `design.layoutPreset` existe, use `profile:preset` e `presetId` igual ao preset. Sem preset e com `renderMode:flexible`, use `profile:flexible` e omita `presetId`. Nos demais casos use `profile:standard`, sem `presetId`. O nome do pacote não instala renderizadores, bibliotecas, fontes ou presets.

Declare `hero` quando `heroEnabled` não for `false`. Declare `section.<kind>` uma única vez para cada tipo presente em `design.sections`, **incluindo seções desativadas**. A ordem do catálogo `components` não controla o layout; a ordem do array `sections` controla a sequência da composição flexível. Nenhum componente arbitrário pode ser declarado.

Versões desconhecidas são rejeitadas. A versão 1 aponta para o runtime/CSS instalado, sem embutir uma cópia congelada deles. Uma evolução visual futura precisa de compatibilidade ou migração testada.

## 2. Conteúdo: obrigatórios e opcionais

### Design

**Obrigatórios, sempre presentes:**

- Strings: `id`, `style`, `name`, `category`, `headline`, `tagline`, `description`, `color`, `phone`, `address`, `hours`, `instagram`, `cover`, `logo`.
- Arrays, mesmo vazios: `sections`, `actions`, `services`, `products`, `highlights`, `benefits`, `photos`.

`id` é UUID válido, não um slug nem ID de template. Na importação o sistema atribui novo UUID raiz sem sobrescrever o original. IDs internos permanecem iguais para edição e destinos. `name` deve ter conteúdo além de espaços, até 300 caracteres; `category` até 100, pertencente a `catalogo.json.categories` (comparação em minúsculas). `style` pertence a `catalogo.json.styles`, mesmo para a composição flexível: use `clean-minimal` no exemplo sem preset. As demais strings comuns têm limite de 100.000 caracteres, sem caractere NUL; mídias têm regra própria. O validador exige `color` como string; para autoria use sempre `#RRGGBB`.

**Opcionais permitidos:** `manual`, `appearance`, `heroEnabled`, `telephone`, `email`, `facebook`, `tiktok`, `reviewsUrl`, `mapsUrl`, `website`, `menuUrl`, `heroLayout`, `heroVisual`, `textVisual`, `composition`, `renderMode`, `designVisual`, `identity`, `layoutPreset`.

Não use `null` para omitir valores; remova a propriedade opcional. Para contatos ausentes use `""`. A aceitação do JSON não torna um telefone inválido funcional: botões sem contato adequado ficam sem destino. Os exemplos não devem ser publicados sem substituir contatos, fotos e dados demonstrativos.

### Objetos de conteúdo

| Objeto | Obrigatórios | Opcionais permitidos |
| --- | --- | --- |
| Seção | `id`, `kind`, `title`, `text`, `enabled` | `image`, `badge`, `ctaLabel`, `subtitle`, `auxiliary`, `textOptions`, `entryTextOptions`, `action`, `entryIcons`, `layout`, `visual`, `content`, `block`, `titleVisual`, `video` |
| Produto/serviço | `id`, `title`, `description`, `price`, `image` | `categoryId`, `action`, `textOptions`, `visual` |
| Coleção/destaque | `id`, `label`, `image` | `caption`, `textOptions`, `action` |
| Botão/action | `id`, `label`, `message` | `kind`, `enabled`, `source`, `mode`, `url`, `number`, `email`, `icon`, `iconColorMode`, `subtitle`, `description`, `textOptions`, `destination`, `sectionId`, `visual`, `appearanceMode`, `titleVisual` |
| Conteúdo da seção | Nenhum | `items`, `actions`, `photos`, `benefits`, `highlights`, `hours`, `address`, `mapsUrl` |

`enabled` é booleano obrigatório na seção. Strings vazias são permitidas onde não há exigência específica. `price` é texto formatado, por exemplo `R$ 129,90`, não um número. IDs de itens/listas têm de 1 a 200 caracteres e são únicos **dentro de cada coleção**; para evitar ambiguidades de edição use IDs globalmente distintos em toda a página.

`photos` é array de strings de imagem; `benefits` é array de textos `Título|Descrição`. Depoimentos são linhas em `section.text` no formato `Nome|Depoimento`, separadas por `\n`; não existe array de objetos `reviews`. O componente atual inclui representação de cinco estrelas, sem nota configurável. Use apenas depoimentos verdadeiros/autorizados; o exemplo fictício omite essa seção.

Quando `section.content` está ausente, o renderer pode usar as coleções globais correspondentes do design. Quando está presente, o conteúdo local assume o controle e o campo relevante ausente pode resultar em lista vazia. Para compor múltiplas seções independentes, prefira conteúdo local completo, mantendo os arrays globais vazios como no exemplo Aurora.

### Metadados avançados

- `textOptions` aceita chaves `label`, `subtitle`, `description`, `title`, `text`, `price`, `auxiliary`, `badge`, `ctaLabel`, `caption`, cujos valores são `{hidden?:boolean,visual?:VisualSettings}`. Use apenas campos renderizados pelo proprietário. `textVisual` do design aceita `name`, `description`, `tagline`, `headline` com objetos visuais.
- `entryIcons` e `entryTextOptions` usam chaves calculadas pelo editor como `benefits-<hex>-<hex>` e `reviews-<hex>-<hex>`; até 500. Preserve essas chaves ao editar um exportado; não invente hashes para autoria nova. Os valores são actions e textOptions, respectivamente.
- `identity` aceita listas de até 16 cores `brandColors`, `extractedColors`, `logoPalette`, `instagramPalette`, `referencePalette`, string `instagram` até 500 caracteres e até 32 `sources:{name,role,colors}`, com `role` igual a `logo`, `instagram` ou `reference`. `colorBindings` usa os tokens descritos adiante. Paletas vinculadas podem substituir cores explícitas; evite bindings se quiser fixar as cores.
- `composition` é opcional e não é necessário para um novo JSON. Se presente, exige `engineVersion:1`, `compositionSeed`, `preferences` e `initialVisual`. A seed tem 1–100 caracteres `[a-zA-Z0-9:_-]`. Preferências e snapshot estão detalhados em `$defs.design.properties.composition` do schema e no código de referência. Preserve metadados exportados sem inventá-los: eles servem ao mecanismo de composição/restauração, não instalam recursos visuais novos.

## 3. Componentes, layouts e blocos

| `kind` | Fonte principal | `layout` aceito |
| --- | --- | --- |
| `actions` | `content.actions` ou `design.actions` | `square`, `rounded`, `two`, `three`, `four`, `list`, `pill`, `inline` |
| `categories` | `content.highlights` ou `design.highlights` | `two`, `three`, `four`, `grid`, `carousel` |
| `products` / `services` | `content.items` ou arrays globais | `compact`, `large`, `two`, `three`, `list`, `carousel` |
| `gallery` | `content.photos` ou `design.photos` | `grid`, `mosaic`, `carousel` |
| `benefits` | `content.benefits` ou `design.benefits` | `cards`, `list` |
| `testimonials` | Linhas de `text` | `cards`, `carousel`, `spotlight` |
| `promotion` | `image`, textos, `action`/`ctaLabel` | Omitir |
| `about` | `image`, textos | Omitir, exceto `block:cards` |
| `hours` | `content.hours` ou `design.hours` | Omitir |
| `location` | Endereço/maps locais ou globais | Omitir |
| `whatsapp` | Textos, contato/action | Omitir |

`block` só é permitido com `kind:about`: `text`, `image-text`, `picture-text`, `image`, `cards`, `cta`, `list`. Com `block:cards`, os layouts aceitos são os de produtos e os dados vêm de `content.items`. `block:list` usa linhas de `text`. Blocos não são uma árvore DOM arbitrária nem podem conter componentes aninhados livremente.

Um layout aceito não garante um tratamento exclusivo em todos os renderizadores: algumas variantes compartilham CSS/fallbacks. Para designs externos use `renderMode:flexible` sem `layoutPreset` e valide a prévia; presets podem impor comportamentos próprios. Por exemplo, o carrossel flexível de produtos/galeria usa rolagem horizontal; não suponha autoplay ou um plugin de slider em toda seção que aceita `carousel`.

## 4. Visual: cores, fundos, fontes e proporções

### Níveis de configuração

- `appearance`: identidade global. Se existir, exige `theme:light|dark`, `secondary:#RRGGBB`, `font:sans|serif|condensed`, `buttons:rounded|square|pill`, `cards:rounded|square`.
- Cores opcionais de `appearance`: `background`, `text`, `panel`, `muted`, `highlight`, `border`, `buttonDefault`, `buttonBackground`, `buttonIcon`, `buttonText`, `buttonHover`. Todas `#RRGGBB`. `buttonMode`: `original`, `theme`, `mono`, `light`, `dark`, `custom`.
- `designVisual`: configura a composição flexível, como fundo, largura máxima e recuo global. `heroVisual`: capa. `section.visual`: região da seção. `item.visual` e `action.visual`: conteúdo individual. `titleVisual`/`textOptions`: textos específicos.

**Cores visuais permitidas:** `surfaceText`, `background`, `text`, `titleColor`, `iconColor`, `textColor`, `hoverColor`, `highlight`, `panel`, `border`, sempre seis dígitos. Sem `rgba()`, nomes de cor, `transparent`, CSS variables ou hexadecimal abreviado.

`colorBindings` associa chaves `background`, `panel`, `text`, `titleColor`, `highlight`, `border`, `iconColor`, `textColor`, `hoverColor` a tokens `background`, `panel`, `primary`, `secondary`, `highlight`, `text`, `muted`. A resolução passa pela paleta instalada.

**Fundos:** `background` para sólido; `backgroundGradient` e `overlayGradient` apenas no formato `linear-gradient(135deg, #22170f 0%, #080706 100%)`. Ângulo inteiro entre -360 e 360, de 2 a 6 stops, cores hex de 6 dígitos, porcentagens opcionais inteiras 0–100, até 240 caracteres. Sem gradiente radial, alfa, `url()` ou código dentro do gradiente.

`backgroundImage` aceita uma referência de imagem no validador, mas o helper visual exibe URL HTTP(S) validada ou data image: caminho relativo permitido para imagens pode ser aceito e ainda assim não funcionar como background nesse helper. Para autoria externa use URL HTTPS absoluta. Se `backgroundGradient` e `backgroundImage` coexistirem, o helper prioriza o gradiente em vez de compor múltiplas camadas. `overlayGradient` é uma variável consumida apenas nos contextos CSS que a suportam; não equivale a qualquer máscara livre.

**Tipografia:** três famílias finitas, normalmente Arial (`sans`), Georgia (`serif`) e Impact (`condensed`) com fallback. Não há importação de Google Fonts/@font-face por pacote. `fontSize`, `bodySize`, títulos e preços usam números; `lineHeight:150` corresponde a 1,5; `letterSpacing:10` corresponde a 1px. `fontWeight` é inteiro até 900 (prefira pesos reais 400/600/700). `weight:regular|bold`, `textStyle:normal|italic`, `align:left|center|right`.

**Banners:** uma seção `promotion` com imagem e cópia, ou `about` com bloco suportado. `mediaPlacement:top|bottom|left|right|background`, `mediaWidth` em porcentagem, `imageFit:cover|contain`, posição X/Y 0–100, `mediaAspect:150` significa razão 1,5 (largura/altura). O renderer/CSS deve consumir a propriedade naquele componente para ela ter efeito. Não há liberdade para criar camadas posicionadas arbitrariamente.

**Capa flexível:** `heroVisual.heroComposition` aceita `cover`, `stacked`, `split`, `profile`, `overlap`; `contentPosition:top|center|bottom`. `heroLayout` legado aceita `full`, `compact`, `center`, `overlap`, `left`, mas a capa flexível usa especialmente `heroComposition`. Defina a composição no campo certo em vez de esperar que o nome legado imponha o mesmo desenho.

### Todos os enums visuais

Os valores exatos estão em `catalogo.json.visualEnumValues` e no schema. Além dos citados: `radius:square|rounded|pill`, `shadow`/`surfaceShadow:none|soft|strong`, `spacing:compact|normal|wide`, `titleSize:small|medium|large`, `imagePosition:center|top|bottom`, `style:solid|outline|soft`, `borderStyle:solid|dashed|dotted`, `actionFormat:tiles|cards|rows|icons`, `iconPosition:top|left`, `cardMedia:top|left|background`, `cardSurface:plain|panel`.

### Todos os limites numéricos

Inteiros, mínimo 0, máximo a seguir; **`columns` é somente 1, 2, 3 ou 4**. Zero é aceito em muitos campos, mas alguns helpers tratam zero como ausência/fallback. Não use zero supondo que ele ocultará o elemento; use os controles de visibilidade.

| Propriedade | Máximo | Unidade/uso principal |
| --- | --- | --- |
| `paddingX`, `cardPaddingX`, `cardPaddingY` | 100 | px |
| `paddingY` | 160 | px |
| `gap`, `cardGap`, `headingGap` | 80 | px |
| `minHeight`, `mediaHeight` | 900 | px |
| `iconSize` | 96 | px |
| `borderWidth`, `surfaceBorderWidth` | 12 | px |
| `radiusPx`, `surfaceRadius` | 80 | px |
| `maxWidth` | 1200 | px; flex usa 480 como fallback |
| `mediaWidth`, `contentWidth`, `widthPercent` | 100 | % |
| `fontSize`, `cardTitleSize` | 60 | px |
| `bodySize`, `cardBodySize` | 36 | px |
| `priceSize` | 48 | px |
| `logoSize` | 160 | px |
| `glyphSize` | 64 | px |
| `buttonHeight` | 220 | px |
| `labelSize` | 28 | px |
| `subtitleSize` | 22 | px |
| `overlay` | 95 | porcentagem |
| `imagePositionX`, `imagePositionY` | 100 | % |
| `mediaAspect` | 1000 | razão largura/altura × 100 |
| `heightPercent` | 600 | unidade relativa à largura do contêiner (`cqw`), não altura da tela |
| `lineHeight` | 240 | razão × 100 |
| `letterSpacing` | 20 | décimos de px |
| `fontWeight` | 900 | peso numérico |

### Botões e destinos

`kind` aceita `whatsapp`, `instagram`, `facebook`, `tiktok`, `reviews`, `location`, `phone`, `email`, `website`, `menu`, `booking`, `quote`, `order`, `custom`. A ausência de kind usa WhatsApp. `source:business` (ou omitido) reutiliza contatos do design; `source:custom` usa `url`, `number` ou `email` no botão. `booking`, `quote`, `order` aceitam `mode:whatsapp|url`. Para um link genérico use `kind:custom,source:custom,url:https://...`.

Para navegar na própria página use `destination:section,sectionId:<id de seção habilitada>`, sem criar URL com o UUID raiz, pois ele muda na importação. O validador pode aceitar uma referência órfã, mas o botão ficará sem destino: confira todas as referências. Para WhatsApp use país+DDD+número, somente dados autorizados. Texto em `message` é codificado pelo renderer. Não envie `javascript:`, `data:` ou HTML em URLs de botões.

`icon` deve existir em `catalogo.json.icons`; nenhum SVG/custom icon enviado é instalado. `appearanceMode:brand|theme|custom`; `iconColorMode:original|theme|custom`; `action.visual` pode definir cores, raio e gradiente compatíveis. Um campo visual aceito não altera todos os estados de todos os botões em todos os presets.

### Responsividade

O pacote não aceita `@media`, breakpoints arbitrários nem dois documentos mobile/desktop. Usa o CSS responsivo instalado, grids, largura máxima e regras do renderizador. Para a composição flexível, o padrão é uma página vertical de até 480px; `designVisual.maxWidth` ajusta o limite. A prévia do importador usa largura máxima de 390px. Revise também 360px e 430px, textos longos e imagens com proporções diferentes. Fontes, arquivos, browser e largura devem ser os mesmos ao gerar demonstração e página final.

## 5. Mídia e inventário obrigatório

O importador preserva referências, não baixa/copia/hospeda os arquivos e não verifica disponibilidade remota. Para autoria externa prefira HTTPS público estável, sem login, sem expiração e com direitos de divulgação. URL de página do Instagram/Google Drive não é necessariamente uma URL direta de imagem. Caminhos `C:\\...`, `file:`, blob temporário e links internos de anexos do ChatGPT não são portáveis. Fotos em HTTP podem ser aceitas e falhar por mixed content na página HTTPS.

Imagens aceitas: string vazia; URL HTTP(S) absoluta sem usuário/senha; `data:image/png|jpeg|webp;base64,...`; ou os caminhos instalados `/images/{paty-galetos,sueli-nascimento,official-batch-2,lote-two,lote-three,lote-four,lote-five,lote-six,lote-seven}/<nome>.(png|jpeg|webp|svg)` com nome alfanumérico/hífen conforme o validador. `.jpg` e diretórios inventados **não são aceitos nesse ramo de caminhos relativos**. SVG embutido em data URI é rejeitado; não confunda uma imagem SVG referenciada com autorização para código arbitrário.

O limite da string de imagem no validador Bio é 16 MiB, mas o pacote inteiro tem limite efetivo menor: **4.000.000 bytes**, incluindo base64 e inventário duplicado. O endpoint admite envelope de 4.100.000 bytes; o importador usa timeout de 30 segundos para validação, sem geração de IA. Base64 cresce cerca de um terço; use fotos otimizadas e URLs para evitar excesso.

`assets.media` deve corresponder exatamente aos campos de mídia **não vazios** presentes em design, incluindo os que não estejam visíveis. Exemplos de caminhos:

```json
[
  {"path":"cover","source":"https://cdn.example.com/capa.webp"},
  {"path":"sections[1].content.items[0].image","source":"https://cdn.example.com/peca.webp"},
  {"path":"sections[2].visual.backgroundImage","source":"https://cdn.example.com/fundo.webp"},
  {"path":"sections[3].content.photos[0]","source":"https://cdn.example.com/galeria.webp"}
]
```

O inventário é gerado percorrendo `design`: chaves `cover`, `logo`, `image`, `backgroundImage`, `poster`, entradas de arrays `photos` e `video.src`. `source` é cópia literal do valor. Uma mesma URL em três campos gera três entradas, cada uma com seu caminho; não deduplique por URL. Índices são base zero e mudam ao reordenar seções/itens. Após editar/reordenar qualquer mídia, recalcule o inventário. Não omita imagens de seções desativadas. A ordem do inventário pode variar, mas o conjunto de pares (com suas ocorrências) precisa ser igual.

Vídeo: `section.video` permite apenas `{src,poster?}`. `src` deve passar por `safeVideoSource`: HTTPS sem credenciais, até 4.000 caracteres, ou caminho instalado `/videos/essencia-cachos/<nome>.mp4`. Aceitação não significa exibição: a composição flexível atual não renderiza `section.video`; o suporte está ligado a layouts específicos. Não inclua vídeo esperando um player genérico.

## 6. Limites e segurança

- Profundidade até 32; até 100.000 nós; arrays gerais até 1.000 entradas; coleções Bio/locais até 500; IDs únicos por coleção.
- Não use chaves `__proto__`, `prototype`, `constructor` em qualquer objeto. Sem números não finitos ou NUL em strings.
- Links públicos precisam passar por `safeWebUrl`: HTTP(S), hostname com ponto, sem espaços/credenciais; `instagram` permite também `@usuario` na validação do pacote, mas o destino do botão deve ser conferido. Para autoria prefira URL completa.
- O servidor repete a validação completa autenticada. A aprovação explícita usa o fluxo existente de criação de **outro rascunho**; importação/prévia não salva nem publica.
- Um layout histórico preso ao UUID `5f056c3b-192d-49ff-acb4-48743839161f` é rejeitado. Presets exigem IDs instalados; não copie um preset esperando criar outro renderer.

## 7. Procedimento para validar um arquivo do ChatGPT

### Pelo painel — inclusive celular, sem Codex ou Gemini

1. Compartilhe os arquivos do kit e o conteúdo autorizado com o ChatGPT. Peça o JSON completo, sem Markdown dentro do arquivo, sem comentários/trailing commas e sem propriedades inventadas.
2. Salve/download como `nome.biosite.json` em UTF-8. Use o envelope completo, não só `design`.
3. No painel autenticado: **Novo BioSite → Importar Design Premium → Importar pacote .biosite.json**. O upload de arquivo é independente do seletor de origem. Não envie o ZIP deste kit ao importador.
4. Só considere o pacote **aceito pelo importador** quando passar pela validação do servidor e abrir a prévia. Aprovação de JSON Schema por ferramenta externa não basta.
5. Confira fotos carregadas, recortes, títulos, preços, ordem, contraste, rolagem, botões e referências internas. A prévia pode mostrar links para destinos reais: durante revisão não envie mensagens ou pedidos.
6. Para testar sem gravar, pare na prévia. Somente **Aprovar e criar novo rascunho** cria registro; publicar continua sendo outra decisão.
7. Quando a composição for aprovada, capture dela as três partes/celulares da demonstração. Uma imagem imaginada separadamente não comprova fidelidade.

### Validação técnica opcional no repositório

Requer dependências do projeto e Node compatível (`24.x` no projeto); não requer chaves Gemini nem acesso ao Neon:

```powershell
node docs/kit-autoria-premium/validar.mjs docs/kit-autoria-premium/exemplos/aurora-flexivel.biosite.json docs/kit-autoria-premium/exemplos/xavier-biblioteca.biosite.json
```

Retorna `accepted:true`, bytes, perfil, seções, mídia e `persisted:false`, ou erro com exit code 1. Usa os mesmos validadores reais e confirma que exportar novamente não altera a estrutura pública. Não lê nem grava clientes, não faz chamadas de rede, não publica e não mede pixels/ disponibilidade de fotos. O script depende da sua posição no repositório; não é um validador autônomo para executar dentro do ChatGPT.

O mantenedor pode regenerar schema, catálogo, exemplos e referências após revisão de contratos com `node docs/kit-autoria-premium/atualizar-kit.mjs`. Isso escreve apenas arquivos deste kit. Não é um passo por cliente.

### Erros típicos

| Sintoma | Conferir |
| --- | --- |
| Formato/versão não suportado | Literais e números de versão do envelope. |
| Componentes não correspondem | Tipos únicos das seções, inclusive desativadas, e hero. |
| Inventário não corresponde | Paths, índices e valores literais depois de qualquer edição. |
| Conteúdo inválido | UUID, strings obrigatórias, enums, layout por kind, arrays, números inteiros e imagens. |
| Propriedade não suportada | Chaves fora do contrato; `locationVisual` também é rejeitada. |
| Aceitou, mas botão não funciona | Contato/URL e sectionId; aceitação não valida todos os destinos. |
| Aceitou, mas efeito não aparece | O renderer escolhido pode não consumir a propriedade nesse contexto. |
| Foto não carrega | Link direto, HTTPS, permissões, origem estável e arquivo instalado. |

## 8. O que ainda impede designs inteiramente novos como Paty Galetos

O preset instalado pode preservar seu layout próprio. **Um JSON externo flexível não recebe automaticamente todas as capacidades do preset Paty.** Ainda não há contrato genérico para árvore livre de componentes, overlays multicamada independentes, recortes/máscaras livres, posições absolutas arbitrárias, textura/fumaça parametrizada, efeitos e estados por região interna, fontes enviadas, SVG livre, animações/timelines, breakpoints por componente, player de vídeo flexível nem campos de edição estrutural bloqueada. Grades e cards variam dentro do catálogo atual.

O pacote não executa React, JavaScript, HTML ou CSS arbitrário. Não traz arquivos ZIP, runtime nem upload de assets; não instala um novo preset a partir de nome. Exigir recurso ausente requer ampliar uma vez a biblioteca versionada e testá-la, não esconder código no pacote. “100% idêntico” a um mockup independente não é garantido.

### Diferenças conhecidas entre tipos, schema e runtime

- `locationVisual` aparece no tipo TypeScript, mas está fora das chaves visuais do validador: não usar.
- `section.titleVisual` e `action.titleVisual` têm lacunas na validação de subpropriedades atual. O schema do kit limita ambos ao vocabulário visual seguro; não dependa de valores fora do contrato para contornar a validação.
- Alguns objetos avançados de `composition.initialVisual` aceitam campos extras; o kit documenta somente os consumidos. Não use essa tolerância para enviar código/campos novos.
- O schema recomenda limites seguros por tipo e obrigatoriedade prática; runtime tem tolerâncias pontuais (`renderer.presetId` ausente vs indefinido, campos opcionais/fallbacks). O resultado dos validadores reais e a prévia são os critérios finais, não essas tolerâncias.
- Exemplo/catalogo foram gerados da árvore **local** nesta revisão; a separação das origens ainda não foi publicada. Não se afirma que toda mídia remota foi baixada/testada ou que snapshots visuais foram feitos.

## 9. Revisão e testes desta entrega

As quatro alterações anteriores tratam somente do seletor de origem, testes de interface/render e sua documentação. Modelos Prontos usa `readyTemplates` com `previewBio || bio`, cópia em memória com UUID transitório e o mesmo `BioSite`. A lista de clientes só é requisitada na origem clientes. Mudança de seleção limpa prévia anterior. Importação externa continua separada. Não há chamada de criação/publicação automática.

Os testes do kit validam os dois exemplos, igualdade estrutural após round-trip, composição sem preset, inventários e rejeição de adulterações; a renderização é verificada pelo renderer existente. Veja `VALIDACAO.md` para resultados desta revisão. Nenhum teste deste kit precisa alterar Neon ou clientes de produção.
