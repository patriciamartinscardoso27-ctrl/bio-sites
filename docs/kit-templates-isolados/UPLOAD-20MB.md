# Upload de até 20 MB

O contrato de autoria continua `biosite-isolated-template`, versão 1. Não adicione URLs internas ou `storageProof` ao manifesto criado pelo ChatGPT. Esses campos são gerenciados exclusivamente pelo servidor após validar o ZIP.

## Limites independentes

- ZIP: 20.000.000 bytes (20 MB decimais).
- Soma dos arquivos descompactados: 40.000.000 bytes (40 MB).
- Até 80 arquivos; HTML e CSS até 150.000 bytes cada.
- Até 24 milhões de pixels por imagem e 40 milhões no conjunto.
- WOFF2: até 5 MB de tamanho descomprimido declarado por fonte.
- Descompressão em worker com heap limitado e prazo de três segundos.
- Manifesto, referências e edições persistidas: até 3.700.000 bytes. As mídias originais de pacotes grandes ficam no Blob, não são duplicadas no JSON do cliente.

O limite maior não permite scripts, HTML ativo, CSS incompatível, ZIP64, criptografia, traversal, links simbólicos ou bombas de descompactação.

## Transporte e publicação

Pacotes até 2,5 MB mantêm o caminho de validação JSON existente. Acima desse tamanho, o navegador solicita autorização autenticada e envia o ZIP diretamente ao Vercel Blob privado. Nenhuma requisição de 20 MB atravessa uma função Vercel.

A autorização é limitada ao administrador, caminho aleatório, tamanho e validade. O servidor lê o arquivo com limite de bytes, valida integralmente HTML/CSS/mídias e somente então promove imagens/fontes para o armazenamento público, com nomes de conteúdo SHA-256 e sem sobrescrita. O ZIP original nunca é público e sua remoção é tentada ao concluir ou rejeitar o processamento. Upload abandonado antes dessa etapa permanece privado; a retenção desses objetos deve ser acompanhada na área de Storage.

O pacote retornado contém referências imutáveis e prova de integridade do servidor. Alterar URLs ou o pacote invalida a prova. A chave `TEMPLATE_ASSET_SIGNING_KEY` precisa ser preservada em backups e futuras configurações: sua remoção/rotação sem migração invalida a validação de pacotes persistentes anteriores. Nunca envie essa chave ao ChatGPT ou ao navegador.

Salvar, pré-visualizar e publicar utilizam as mesmas referências e o mesmo HTML/CSS. O Neon recebe apenas o conteúdo e as referências do novo template, usando a estrutura existente. Nenhuma migration é necessária. Os formatos Premium V1/V2 e os clientes anteriores não são convertidos.

## Configuração de operação

- `BLOB_READ_WRITE_TOKEN`: store privado dos ZIPs.
- `TEMPLATE_MEDIA_READ_WRITE_TOKEN`: store público separado de mídias validadas.
- `TEMPLATE_ASSET_SIGNING_KEY`: segredo exclusivo da integridade.
- Função Vercel mantém `maxDuration: 150`; o upload direto não consome esse tempo de execução. Processamento é síncrono, limitado e testado com pacote real de 18,8 MB; não é uma fila em background.

Ausência da configuração retorna HTTP 503, sem tentar enviar o ZIP grande em JSON. O validador independente confirma formato e segurança; limites de rede, imagens editadas e fidelidade devem ser conferidos no importador antes da aprovação.
