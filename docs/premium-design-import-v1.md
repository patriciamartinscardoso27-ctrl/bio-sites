# Importar Design Premium — etapa 1

## Fluxo disponível

Novo BioSite → Importar Design Premium. Selecione um cliente, use **Exportar e conferir reimportação** e compare original/reimportado. **Baixar pacote JSON** gera `.biosite.json`. Outro pacote pode ser enviado pelo seletor de arquivo, inclusive no celular. A prévia usa `BioSite`, o mesmo componente usado para renderizar as páginas reais.

Nada é persistido durante exportação, validação ou prévia. **Aprovar e criar novo rascunho** usa o fluxo existente de criação, com um novo UUID. A publicação permanece uma ação separada do editor. Não há mudança de tabelas ou execução de migration nesta etapa.

## Contrato

`src/lib/premiumDesignPackage.ts` define o contrato TypeScript e as verificações de envelope/compatibilidade. `server/premium-design.mjs` aplica adicionalmente o validador completo de BioSites e links, antes de liberar a prévia.

```json
{
  "format": "bio-sites-premium",
  "schemaVersion": 1,
  "renderer": {"id": "biosite", "version": 1, "profile": "preset", "presetId": "moda-premium-gold"},
  "components": [{"id": "hero", "version": 1}, {"id": "section.products", "version": 1}],
  "assets": {"version": 1, "storage": "references", "media": []},
  "editing": {"version": 1, "adapter": "existing-editor"},
  "design": {}
}
```

Esse trecho ilustra o envelope, não é um pacote importável: `design` precisa conter um BioSite completo, `components` precisa declarar exatamente os tipos usados e `assets.media` precisa listar todas as mídias. O exportador produz esses dados automaticamente.

Perfis de renderização: `preset` referencia um preset disponível; `flexible` usa `renderMode: "flexible"` sem `layoutPreset`; `standard` usa o fluxo legado sem preset. Cada tipo de seção tem contrato `section.<kind>@1`. Os tipos são actions, categories, promotion, services, products, gallery, about, benefits, hours, location, whatsapp e testimonials. A ordem e as repetições ficam em `design.sections`, não no catálogo de componentes.

Composições flexíveis não precisam escolher um modelo fixo: aceitam combinações distintas dos componentes suportados, com cores e superfícies por seção, gradientes seguros, imagens, proporções, tipografia e layouts aceitos por `VisualSettings`. Propriedades desconhecidas de estrutura e de aparência não são interpretadas como CSS ou código.

## Preservação e edição

Exportação não normaliza/recria o layout nem seleciona outro modelo. Todos os dados públicos suportados são mantidos; notas internas `client` não entram no pacote. A importação muda apenas o UUID raiz; os IDs de seções, itens, botões e destinos internos permanecem para preservar o editor e a navegação. São verificadas versões, catálogo, preset, propriedades, limites numéricos e inventário de arquivos.

O editor continua sendo o existente, sem modificação de seus componentes. Esta versão não adiciona bloqueio de edição estrutural. Fotos, textos, produtos e links mantêm os vínculos atuais; o conteúdo pode ser editado após a aprovação do rascunho.

## Segurança e mídia

POST `/api/design-package` é autenticado e só valida/exporta/importa em memória; não acessa o repositório Neon nem o Gemini. O fluxo normal de clientes controla quais registros o administrador pode selecionar. O pacote nunca determina o proprietário do novo cliente.

São rejeitados versões desconhecidas, componentes não declarados, propriedades executáveis, chaves de poluição de protótipo, links inseguros, documentos excessivos e inventários adulterados. Código HTML/JS/React, imports, plugins e CSS arbitrário não são executados. Texto é renderizado pelo React existente, com escape normal.

Limite: 4.000.000 bytes de JSON, com margem no endpoint para o envelope de transporte. Imagens base64 aumentam o tamanho do pacote. URLs e caminhos de mídia são mantidos; nenhum arquivo remoto é buscado pelo servidor para validar o pacote. Referências locais dependem dos arquivos existentes na instalação, e URLs externas dependem da disponibilidade original. Esta etapa não transforma o pacote em um arquivo autocontido nem garante disponibilidade permanente de mídias externas.

Um layout histórico vinculado diretamente a UUID de cliente é rejeitado por enquanto, para evitar mudanças silenciosas de aparência na cópia. O caso Xavier Modas não depende dessa exceção.

## Fidelidade e versões

O caso de referência é Xavier Modas, preset moda-premium-gold, 14 seções e 17 referências de mídia. A prova de round-trip verifica igualdade dos dados (exceto novo UUID), ordem, propriedades visuais e markup emitido pelo renderizador real. Uma nova composição flexível também é testada sem preset.

A comparação por pixels no navegador ficou pendente porque a ferramenta de navegação bloqueou a observação da página local. O teste de igualdade de markup não substitui a revisão de fontes, carregamento de imagens e capturas em diferentes larguras em um navegador real.

Demonstrações devem ser produzidas do pacote validado no mesmo renderizador, com os mesmos arquivos, fontes, conteúdo e largura. Uma imagem criada separadamente não é suficiente para provar equivalência.

Versão 1 declara compatibilidade com o renderizador atual; ainda não congela uma cópia independente de todo o runtime/CSS por template. Antes de futuras alterações desse runtime, será necessário manter implementações antigas ou migrar contratos com testes visuais, sem modificar páginas existentes silenciosamente.

## Ampliações necessárias para layouts como Paty Galetos

O preset Paty existente pode ser referenciado e preservado sem editar seu código. Ele não transforma todos os seus tratamentos em componentes genéricos para outros designs. Para criar novas composições com liberdade equivalente, ampliar os contratos de:

- Banners com múltiplas camadas de imagem, máscaras e sobreposições independentes.
- Fundos e efeitos por região interna de cada card, com parâmetros finitos e seguros.
- Variantes de cards de produto, arranjos mistos e ações WhatsApp por item.
- Fontes licenciadas e carregadas por arquivo, métricas e regras responsivas por componente.
- Ícones e decorações autorizados, além do catálogo atual; SVG enviado não será executado livremente.
- Componentes responsivos e regras de edição protegida, hoje não implementadas.
- Verificação de propriedades efetivamente aplicáveis por variante, além da validação atual de valores aceitos.

Essas ampliações devem ser feitas uma vez na biblioteca versionada, não para cada cliente.

## Preparação para ZIP

Manter a leitura do contêiner separada do contrato. Uma próxima versão poderá conter manifest.json, design.json, content.json, editable.json e assets/. Será necessário upload autorizado de mídia, validação de MIME/conteúdo, limites descompactados, prevenção de travessia de diretórios e substituição de referências por URLs estáveis. A versão atual rejeita ZIP explicitamente; não tenta extrair ou executar seus arquivos.

Nenhum commit, push, deploy ou gravação de cliente é necessário para testar a validação e a prévia local.
