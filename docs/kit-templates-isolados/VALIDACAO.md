# Entrega local — Templates HTML/CSS isolados

Branch de implementação: `codex/templates-isolados`. Publicação controlada autorizada em 17/10/2026. Nenhuma gravação em clientes ou no Neon foi realizada durante a validação. Alterações anteriores não relacionadas permanecem no working tree e foram excluídas da cópia de publicação.

## Implementação

O Admin oferece Criar por Código com upload de `.biosite.zip`. Manifesto JSON versionado, HTML, CSS, imagens e fontes são validados sem Gemini. O layout é renderizado diretamente em iframe de origem opaca; não é convertido em componentes de segmento. Prévia, editor e página pública usam o mesmo compilador e pacote.

Campos declarados permitem editar textos, imagens, preços, links, WhatsApp e itens de coleções. O editor preserva HTML/CSS e identidade do pacote. Pacotes grandes usam Blob privado para o ZIP e Blob público para mídias validadas; o JSON existente guarda referências e prova de integridade, sem depender do computador de origem ou exigir migração do banco. Pacotes pequenos continuam compatíveis com mídia incorporada. A criação depende de aprovação explícita; a publicação mantém o fluxo existente.

## Evidência

- 57 testes de backend, transporte direto, segurança, Premium V1/V2, Gemini e publicação aprovados; testes específicos foram repetidos após as últimas alterações de validação e armazenamento.
- 22 testes de interface aprovados, incluindo importação, edição, aprovação, erros HTTP e compatibilidade dos fluxos anteriores.
- Build TypeScript/Vite aprovado. Aviso de bundle acima de 500 kB permanece; não impede compilação.
- Paty Galetos, Maison Lume e Nexo Digital: 24 verificações no navegador (três designs × quatro larguras × prévia/público), em 360, 390, 430 e 1024 px. Sem overflow horizontal, textos cortados, imagens pendentes/ausentes ou falha de fontes detectados.
- 15 pares de capturas comparados pixel a pixel: zero pixels diferentes. Escopo: viewport inicial em quatro larguras e uma seção interna por design, no mesmo navegador e ambiente. Isso não constitui comparação integral com um mockup externo ou garantia entre navegadores diferentes.
- Salvar, publicar e reabrir foi testado em repositório isolado de teste, preservando outro registro. Nenhum cliente real foi importado.
- ZIP válido de 18.770.670 bytes testado no armazenamento real. Processamento concluído em aproximadamente 10 segundos e resposta de 20.675 bytes, sem transportar os 18,8 MB pela função HTTP. Mídias/fontes persistentes também passaram em 360, 390, 430 e 1024 px no navegador.

## Segurança e limites

Scripts de usuários, eventos HTML, iframes, formulários, URLs de recursos remotos, CSS desconhecido e recursos incompatíveis são rejeitados. Somente a ponte interna do sistema recebe autorização CSP. O manifesto rejeita chaves duplicadas. O ZIP não é extraído no filesystem; são verificados caminhos, duplicatas, tipos, tamanhos e hashes. Descompressão ocorre em worker com limite de memória e prazo de três segundos.

Limites: ZIP de 20 MB e soma descompactada de 40 MB; referências e conteúdo editável persistidos de até 3,7 MB; 80 arquivos; HTML/CSS de até 150 kB cada; profundidade HTML 40; 5.000 nós de origem e 10.000 nós expandidos. As demais regras estão no schema, política de runtime e UPLOAD-20MB.md.

## Limitações e próxima aprovação

Não há suporte a JavaScript de template, React enviado pelo usuário, vídeos, embeds externos, animações/transições ou coleções aninhadas. SVG como arquivo não é aceito; ícones SVG inline possuem um subconjunto validado. As propriedades CSS aceitas estão documentadas na política de runtime. Apenas campos e coleções declarados são editáveis; alterar a estrutura exige novo pacote.

O diagnóstico automático não detecta toda sobreposição, problema de contraste ou decisão visual inadequada. Textos e fotos diferentes podem alterar a composição; a revisão visual continua obrigatória. A demonstração deve ser renderizada do mesmo pacote, com os mesmos recursos e dimensões.

A cópia de publicação parte dos arquivos exatos da implantação anterior READY, preservando arquivos não relacionados e imagens existentes. A conferência final da implantação e do worker deve usar o relatório de publicação, incluindo um upload validado sem aprovar a criação de cliente.

Para compartilhar com ChatGPT: envie o Kit completo, especialmente README, PROMPT-CHATGPT, manifest.schema.json, HTML-CSS-SUPORTADO e politica-runtime.json, além de um dos exemplos. Para importar no Admin, selecione somente o `.biosite.zip` do design, não o ZIP do Kit completo.
