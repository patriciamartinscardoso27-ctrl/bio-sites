# Composições compactas Premium V2

Ampliação opcional do contrato V2, com componentes versão 1. Pacotes V1 e V2 anteriores continuam válidos; nenhuma migração de clientes é necessária.

## Novas propriedades seguras

- `page.font` e `type.family`: `modern` usa a pilha de fontes do sistema, sem download externo.
- `page.padding`: inteiro 0–40 px (padrão anterior 12).
- `page.wordWrap: "words"`: quebra entre palavras, sem hifenização ou corte no meio. Não garante que textos arbitrariamente longos caibam; revise títulos e rótulos nas três larguras.
- `catalog.variant` e `profiles.variant`: `compact`. Use `columns: 3`, `cardPadding: 6`, `cardGap: 5` e tamanhos de título 11/12/13 px. `cardPadding` aceita 0–32; `cardGap`, 0–24. As variantes anteriores preservam os padrões anteriores quando os campos são omitidos.
- `button.padding` e `button.gap`: 0–24 px. `showIcon: false` oculta apenas o ícone visual, preservando ação e edição. Para quatro atalhos: `columns: 4`, botão `layout: "tile"`, ícone 30 e padding 4. Cada legenda deve caber na largura disponível.
- `benefits.icons`: um ícone para cada benefício, na mesma ordem: `flame`, `food`, `delivery`, `heart`, `star`, `check`, `leaf`, `shield-check`. `iconSize`: 12–56; `iconColor`: #RRGGBB. Padding/gap dos cards também são aceitos.
- `hours.dividerColor`: #RRGGBB. Combine `text.color`, `cardSurface` e `surface` para composição inteiramente escura. Localização e contato já aceitam superfícies e botões independentes.

## Hero e mídia

Os recursos existentes já permitem foto de fundo (`photo.box` com x/y 0 e width/height 100), recorte `position`, gradientes com opacidade em `layers` e regiões de texto independentes e responsivas. Não se deve criar espaços vazios para acomodar uma foto lateral quando a intenção é uma capa de fundo.

Não há fundo adicional aplicado à logo pelo componente. Um fundo claro gravado no JPEG/WebP continuará visível: forneça PNG/WebP com transparência real para eliminá-lo. O importador não remove fundos nem altera imagens cadastradas.

## Exemplo real, sem persistência

`exemplos/restaurante-compacto-v2.biosite.json` foi preparado a partir do arquivo local Paty Galetos visual-refinado. O original foi preservado. A cópia recompõe o inventário por exportação oficial, mantém as mídias originais, usa três destaques e adiciona ações explícitas de pedido aos itens. O número deriva do contato que já estava no pacote; preços e contatos precisam de revisão comercial antes de publicar.

O pacote original tinha inventário divergente, somente dois destaques e nenhum botão nos itens. Esses problemas não podem ser resolvidos somente por CSS. Não há regra por nome/ID de cliente no renderizador.

Valide sem banco:

```powershell
node docs/kit-autoria-premium/validar.mjs docs/kit-autoria-premium-v2/exemplos/restaurante-compacto-v2.biosite.json
```

O schema estrutural está em `contrato-v2.schema.json`; a validação real verifica também vínculos, compatibilidade e inventário. Não envie HTML, CSS, JavaScript ou URLs como estilos. O pacote contém referências a mídias locais desta instalação, não incorpora um ZIP autossuficiente.
