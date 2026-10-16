# Prompt de autoria — Bio-Sites Premium V2

Anexe este guia, README.md, contrato-v2.schema.json e os exemplos beleza-premium-v2.biosite.json/comparacao-v2.biosite.json. Para ícones/estilos/categorias permitidos anexe também catalogo-v1.json. Forneça conteúdo e URLs diretas de mídia autorizada.

---

Crie um arquivo completo `.biosite.json` compatível com Bio-Sites Premium V2. Use exatamente format bio-sites-premium, schemaVersion 2, renderer biosite/version 2/profile premium, editing version 1/adapter existing-editor e assets version 1/storage references.

Use o conteúdo Bio existente e `design.premiumV2:{version:2,page,hero?,sections}`. Não use layoutPreset/renderMode/composition/appearance/identity nem controles visuais V1. Não crie HTML, CSS, React, JavaScript, fontes externas, ícones ou propriedades fora do contrato.

Monte uma única página contínua, com hierarquia premium, contraste e proporções adequadas ao celular. Configure hero em regiões independentes: photo e logo vinculados a cover/logo, textos vinculados a headline/name/tagline/description e CTA ligado a uma action global. Use caixas percentuais que caibam no contêiner e valide os tamanhos de texto.

Use apenas os componentes e variantes descritos no guia, compatíveis com cada section.kind. O mapa premiumV2.sections deve ter exatamente os IDs de todas as seções. Declare em components hero.premium e section.<component> únicos usados, cada version 1. Prefira componentes genéricos, nunca condicionais baseadas no nome do estabelecimento.

Faça camadas com bindings image/cover/photo.N e gradientes tipados, incluindo opacity quando necessário. Armazene URLs somente nos campos de conteúdo correspondentes e recalcule assets.media, com paths e sources exatos, após finalizar a ordem. Não deduplique por URL. Use HTTPS estável direto; anexos temporários do ChatGPT não são hospedagem permanente.

Configure botões com surface, iconSurface, label e caption independentes. Para serviços use cards horizontais e details:true quando apropriado; resumo e detalhes podem ser separados por duas quebras de linha. Para before-after use fotos reais correspondentes e autorizadas, nunca resultados inventados.

Use as faixas responsivas fixas medium/390 e large/430, sem inventar breakpoints. sizeMedium/sizeLarge exigem size base. Preserve IDs de conteúdo para edição. Não invente contatos, depoimentos ou fotos de profissionais; informe mídia/dados faltantes.

Entregue JSON válido, sem comentários ou trailing commas, com todos os campos e arrays obrigatórios, UUID válido e até 4.000.000 bytes. Confira componentes, inventário, caixas, enums, variantes e vínculos. Se não executou o validador real, diga isso. Uma demonstração visual aprovada deve ser capturada do próprio pacote renderizado, não apenas criada como imagem independente.

Dados do estabelecimento e direção visual: [preencher].

---

Envie ao importador apenas o arquivo JSON. A prévia não grava clientes; aprove o novo rascunho somente após conferir conteúdo, imagens, botões e composição. O ZIP do kit serve para compartilhar documentação com o ChatGPT, não para importar como design.
