# Validação — evolução compacta V2

- 18 testes de contrato/importação/exportação e regressão V1 aprovados.
- 14 testes de interface/renderização/editabilidade aprovados.
- Build TypeScript/Vite aprovado; permanece aviso de chunks maiores que 500 kB.
- Nenhuma operação no Neon, criação de cliente, pedido WhatsApp, commit, push ou deploy.

O arquivo real `paty-galetos-premium-v2-visual-refinado.biosite.json`, em Downloads, foi rejeitado pelo validador original por inventário de imagens divergente. A cópia `exemplos/restaurante-compacto-v2.biosite.json` recompõe o inventário pelo exportador e foi aceita sem persistência. O arquivo original e as mídias foram preservados.

Verificações automáticas no navegador local com o renderer real: largura de documento igual ao viewport; 4 colunas de atalhos; 4 de diferenciais; 3 de destaques e cardápio; nenhuma largura de título/legenda excedendo o contêiner; altura máxima de destaque inferior a 260 px. Asserções executadas em 360, 390 e 430 px. Relatório bruto e capturas ficam em `artifacts/premium-v2/compact-responsive-results.json` e `compact-*.png`.

| Largura | Scroll horizontal | Destaques (altura máxima) | Falhas nas asserções |
| --- | --- | --- | --- |
| 360 | Não | 214 px | 0 |
| 390 | Não | 226 px | 0 |
| 430 | Não | 240 px | 0 |

Após percorrer as seções, todas as imagens carregaram, com 0 falhas e 0 pendentes. Horários usam fundo escuro rgb(36,20,7). Os links de pedido foram conferidos por endereço, sem clicar ou enviar mensagem.

Limitações: não houve comparação pixel a pixel com uma nova imagem de mockup Paty anexada nesta etapa. O fundo claro da logo faz parte da imagem original. A composição final depende do JSON, dos textos e das mídias corretas; não há análise automática de mockup nem alteração dos dados do cliente. Um rótulo ou palavra arbitrariamente longa ainda pode exceder um card estreito; use conteúdo adequado e valide nas três larguras.
