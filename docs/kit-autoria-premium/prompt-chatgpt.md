# Prompt para criar um arquivo .biosite.json

Use este texto em uma conversa do ChatGPT junto com README.md, contrato.schema.json, catalogo.json, aurora-flexivel.biosite.json e, opcionalmente, xavier-biblioteca.biosite.json. Forneça também textos, contatos e URLs diretas das mídias autorizadas.

---

Quero um Bio-Site premium importável pelo sistema Bio-Sites. Gere um arquivo completo `nome.biosite.json` com base no contrato v1 e nos exemplos anexos.

1. Leia primeiro o README e o catálogo. Use apenas componentes, propriedades, enums e limites aceitos. Não gere HTML, CSS, React ou JavaScript dentro do pacote. Não acrescente `$schema` ao JSON importável.
2. Para este design novo, use `renderer:{id:"biosite",version:1,profile:"flexible"}`, `design.renderMode:"flexible"`, `design.style:"clean-minimal"` e **omita layoutPreset/presetId**. O estilo base obrigatório não restringe a autoria a um preset fixo: personalize as seções com o vocabulário aceito.
3. Entregue todos os campos e arrays obrigatórios, ainda que vazios. Use UUID válido no design e IDs internos distintos e estáveis. Cada seção tem id, kind, title, text e enabled.
4. Use conteúdo local completo por seção; escolha apenas layouts compatíveis com cada kind. Monte uma única página de rolagem contínua, com hierarquia, contraste e recortes adequados ao celular.
5. Use somente minhas mídias autorizadas em URLs HTTPS diretas e estáveis. Se não houver URL, informe qual mídia precisa ser hospedada antes de prometer arquivo pronto. Não use links temporários do ChatGPT como se fossem hospedagem permanente. Não invente fotos, depoimentos, telefone, preços ou endereço comerciais.
6. Recalcule `components`: hero quando habilitado e tipos `section.<kind>` únicos de TODAS as seções, inclusive desativadas, todos version:1.
7. Recalcule `assets.media` após concluir a ordem: uma entrada por campo de mídia não vazio, com path base zero relativo a design e source literal idêntico. Não deduplique URLs repetidas em campos diferentes. Inclua imagens em conteúdos locais e fundos.
8. Para ações internas use destination:section + sectionId existente e habilitado. Para WhatsApp use contatos fornecidos, com país e DDD; para link custom use kind:custom, source:custom e url HTTPS.
9. Não use recursos ausentes: fontes externas, breakpoints arbitrários, código, máscaras livres, múltiplas camadas independentes ou vídeo flexível. Se o pedido exigir isso, explique a limitação e proponha uma composição dentro do contrato antes de inventar propriedades.
10. Retorne o arquivo JSON válido, sem comentários, vírgulas finais ou campos inventados. Faça uma conferência de UUID, obrigatórios, enums, componentes, inventário e tamanho abaixo de 4.000.000 bytes. Diga honestamente se não pôde executar o validador real.

Não afirme que uma imagem imaginada é a renderização exata do JSON. Para demonstração aprovada, o arquivo deve passar no importador e ser capturado no mesmo renderer Bio-Sites, com fontes/mídias e largura iguais. A validação final será a prévia autenticada do sistema, antes de qualquer gravação.

Dados do estabelecimento e direção visual: [preencher].

---

Após receber o arquivo, abra o importador administrativo, envie somente `.biosite.json` e confira a prévia. Esse caminho não exige Codex/Gemini por cliente; o ChatGPT prepara o conteúdo declarativo e o sistema o valida/renderiza. A aprovação para criar rascunho e a publicação são decisões separadas.
