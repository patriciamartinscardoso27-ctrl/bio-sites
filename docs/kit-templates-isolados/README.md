# Kit de Autoria — Templates Isolados v1

Este é um formato novo, independente dos pacotes Premium V1/V2. Esses formatos continuam funcionando em seus renderizadores anteriores. Não tente renomear um .biosite.json V2 para ZIP.

O template HTML/CSS é o design. O sistema não o converte em componentes de segmento, nem usa IA para redesenhá-lo. A prévia, o editor de conteúdo e a página pública usam o mesmo compilador e iframe. Imagens/fontes acompanham o ZIP. Pacotes grandes usam armazenamento persistente Vercel Blob; o JSON no Neon guarda referências validadas. Pacotes pequenos mantêm compatibilidade com mídias incorporadas. Não há dependência de arquivos locais.

## Comece aqui

Envie ao ChatGPT este kit, principalmente `PROMPT-CHATGPT.md`, `manifest.schema.json`, `HTML-CSS-SUPORTADO.md` e um dos exemplos descompactados. Peça um ZIP com os arquivos abaixo na raiz, sem pasta externa:

```
manifest.json
template.html
styles.css
LICENSE.txt
assets/
  inter.woff2
  capa.webp
```

`template.html` é um fragmento de conteúdo, sem doctype/html/head/body. `styles.css` contém todo o CSS. O sistema fornece o documento, viewport, CSP e somente um script próprio de diagnóstico/navegação. Scripts do pacote nunca são permitidos. O script do sistema não dá acesso ao Admin, cookies, Neon ou DOM externo.

**Não importe o ZIP deste kit inteiro.** Extraia-o e selecione um dos arquivos `.biosite.zip` de exemplos, ou o pacote específico do seu estabelecimento.

## Manifesto e edição

O schema exato está em `manifest.schema.json`. Todas as propriedades não declaradas são rejeitadas. Versão inicial: `format: biosite-isolated-template`, `version: 1`, `html: template.html`, `css: styles.css`.

- `business`: nome/categoria/telefone/endereço usados para cadastrar o novo rascunho. A categoria deve existir no Bio-Sites, como `restaurante / lanchonete`, `salão / estética` ou `comercial geral`.
- `fields`: mapa de campos globais. Cada campo tem `type`, `label` e, para texto, `maxLength` opcional. Tipos: `text`, `price`, `image`, `link`, `whatsapp`.
- `collections`: mapa de listas repetíveis. Cada lista declara `label`, `maxItems` (1–40) e `fields` dos itens. Todos os itens têm exatamente esses campos.
- `content.fields`: valores iniciais dos campos globais.
- `content.collections`: listas de `{id, values}`; IDs são únicos por lista. IDs e nomes de campo usam letras minúsculas, números, hífen/underscore, iniciando por letra, máximo 50 caracteres.
- `message`: somente para WhatsApp; aceita texto e substituições `{{campo}}` de campos do mesmo escopo, sem expressões ou código.
- `globalField`: somente para link/WhatsApp de coleção; aponta para um campo global do mesmo tipo. O valor fica apenas em content.fields e deve ser omitido nos values dos itens. Assim, alterar um único WhatsApp atualiza todos os pedidos vinculados. O campo derivado não aceita maxLength nem bioField.
- `bioField`: opcional nos campos globais (`name`, `phone`, `address`, `instagram`); sincroniza o campo de cadastro quando editado. Não se aplica aos produtos.

O editor novo só modifica conteúdo declarado. Pode editar fotos, títulos, descrições, preços, links e números WhatsApp; adicionar/remover produtos reutiliza o mesmo HTML do item. Layout, CSS, fontes e assets originais ficam separados, identificados por SHA-256. Elementos que você não marcar permanecem texto/decoração estática do template.

### Vínculos no HTML

```html
<h1 data-field="title"></h1>
<img data-image="cover" alt="Foto do estabelecimento">
<a data-link="contact"><span data-field="contact_label"></span></a>
<div class="products" data-collection="menu">
  <template>
    <article class="product">
      <img data-image="image" alt="Foto do produto">
      <h2 data-field="title"></h2>
      <p data-field="description"></p>
      <strong data-field="price"></strong>
      <a data-link="order">Pedir</a>
    </article>
  </template>
</div>
```

Dentro de uma coleção, os nomes referem-se aos campos do item. Não há coleções aninhadas nesta versão. Não use IDs HTML dentro do bloco repetível. Todos os campos declarados precisam de vínculo no HTML: nada é descartado silenciosamente.

Campos text/price só substituem texto, com escape de HTML. Não envie tags em valores para criar novos elementos. Para quebras de linha, declare `white-space: pre-line` no CSS desejado. O motor não inventa tipografia ou espaçamentos.

## Imagens e fontes persistentes

Use PNG, JPEG ou WebP em `assets/`. Fontes: WOFF2, com licença redistribuível em `LICENSE.txt`. Caminhos são relativos à raiz do ZIP, como `assets/capa.webp`, inclusive em `url("assets/inter.woff2")` no CSS.

No importador, arquivos são validados e incorporados em base64. Ao editar uma foto no painel, ela é incorporada ao conteúdo. Não use URLs externas para imagens/fontes, caminhos C:\, file:, blob:, Google Fonts por @import ou links que expiram. SVG como arquivo, GIF e vídeo ainda não são aceitos; ícones SVG simples podem estar no HTML conforme a política detalhada.

Limites: ZIP até 20.000.000 bytes; descompactado até 40.000.000; até 80 arquivos; HTML e CSS até 150.000 bytes cada; pacote+edição persistidos até 3.700.000 bytes. Use fotos WebP otimizadas e fontes com subconjunto adequado. Imagens até 24 milhões de pixels cada e 40 milhões no conjunto. Pacotes acima de 2,5 MB usam upload direto privado e referências de mídia, preservando a margem HTTP da Vercel. Veja UPLOAD-20MB.md.

## Aprovação e publicação

Em Admin → Novo BioSite → Criar por Código, envie o ZIP. O servidor retorna uma prévia em memória, sem gravar cliente. O painel verifica 360, 390, 430 e 1024 px, fontes, imagens, textos recortados e rolagem horizontal. Corrija problemas e confira visualmente antes de marcar a aprovação e criar um NOVO rascunho. Publicar continua sendo outra ação no sistema existente.

A verificação automática ajuda, mas não detecta toda sobreposição, contraste, alinhamento ou erro comercial. Alterações extensas de conteúdo podem exigir ajustar o template no ChatGPT. A publicação preserva a revisão aprovada e os mesmos bytes de HTML/CSS/recursos; não faz nova interpretação. O editor antigo de composição não altera esses templates; há um editor de conteúdo próprio no mesmo fluxo de salvar/publicar.

Para uma demonstração fiel, renderize primeiro este pacote e capture três trechos consecutivos da mesma página. Uma imagem gerada separadamente não comprova fidelidade. Fontes próprias estabilizam o desenho, mas diferenças de antialiasing entre navegadores/sistemas ainda podem ocorrer.

## Validar e reproduzir testes

O importador é o validador definitivo. Para uso técnico no repositório com dependências instaladas:

```powershell
node scripts/validate-isolated-template.mjs docs/kit-templates-isolados/exemplos/paty-galetos.biosite.zip
node --test --experimental-test-isolation=none tests/isolatedTemplates.test.mjs
node --test tests/isolatedTemplatesUI.test.mjs
npm run build
```

O kit também contém um validador independente, copiado do mesmo código de segurança do servidor, sem Neon ou Gemini. Na pasta extraída, com Node 24 instalado, execute:

```powershell
npm install
node validar.mjs exemplos/paty-galetos.biosite.zip
```

Ele verifica ZIP, manifesto, HTML, CSS e mídia; a revisão visual continua sendo realizada pelo importador. Não exige Gemini ou Codex para importar novos ZIPs.

Exemplos: Paty Galetos (cardápio escuro), Maison Lume (editorial claro e assimétrico), Nexo Digital (geométrico, Flexbox e lista horizontal no desktop). São pacotes de teste; revise preços, contatos e direitos das mídias antes de utilizá-los comercialmente. Eles não substituem clientes cadastrados.

### WhatsApp global nos produtos

No exemplo Paty, o campo de item `order` usa `{ "type": "whatsapp", "label": "Pedir", "globalField": "phone", "message": "Olá, tenho interesse em {{title}}" }`. O HTML continua com `data-link="order"`; os itens não duplicam um número em `values.order`. A mensagem usa os dados do item, e o destino vem do campo global phone.

## Atualização de armazenamento
Consulte UPLOAD-20MB.md: limite ZIP 20 MB, descompactação 40 MB, transporte direto privado e mídias persistentes. Esta seção substitui as descrições anteriores de armazenamento integral no Neon para pacotes grandes.
