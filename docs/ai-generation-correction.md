# Geração com IA — verificação de 16/10/2026

Texto e imagem usam POST /api/reference/analyze, atendido por api/handler.mjs e server/vision-reference.mjs. Não há gravação no Neon durante a análise.

## Defeitos reproduzidos

- Respostas HTTP de proxy sem JSON escondiam status e Content-Type.
- O Gemini atual recusou a gramática completa com HTTP 400 INVALID_ARGUMENT. Um schema mínimo funcionou. O mesmo pedido completo funcionou sem o schema e com o schema sem enums repetidos. A gramática enviada foi simplificada; a validação local de valores e geometria continua ativa. O modelo não foi trocado.
- A instrução final do modo criativo solicitava correção contra um contrato inexistente. Agora solicita a composição completa; referências exigem inventário não vazio.
- As imagens eram reduzidas apenas depois do upload. Agora a cópia destinada à análise é compactada no navegador, preservando os originais do formulário. Orçamento de 4.000.000 bytes para o JSON UTF-8 inteiro, abaixo do limite da plataforma.
- Erros de chamadas internas podiam virar erro genérico de validação. Os códigos específicos são preservados.

## Configuração verificada (consulta somente leitura)

API Vercel: projeto bio-sites, plano Hobby, Fluid Compute ativo, functionDefaultTimeout=300. Configuração local anterior: maxDuration=30. Configuração preparada: 150 segundos, compatível com o projeto. Backend mantém limite de 120 segundos por chamada e orçamento compartilhado de 125 segundos; navegador mantém 135 segundos. Nenhuma configuração remota foi alterada e nenhum deploy foi realizado.

## Validação e limites

Os testes automatizados cobrem HTTP 413/429/500/502/504 em JSON e HTML, Content-Type, falhas de conexão e timeout, JSON malformado, truncamento, validação, limite em bytes, compactação e preservação do formulário. Os registros contêm apenas metadados operacionais.

O teste real de texto passou localmente com o mesmo Gemini. As tentativas com a referência real de três telas também encontraram resposta estrutural incompleta e indisponibilidade por capacidade do provedor. Não equivalem a validação de produção.

Após revisão e publicação autorizada: validar sessão de administrador, GET /api/reference/status e POST /api/reference/analyze com texto e com a referência real. Conferir status, Content-Type, duração e registros reference-api / gemini-reference. A mudança de duração só terá efeito em novo deploy. Não publicar BioSites durante o teste.

Se houver necessidade comprovada de duração maior que a permitida, propor antes um job com fila e estado durável isolado, autenticação por proprietário, idempotência, expiração e consulta de progresso. Não usar memória do processo nem tarefas soltas após responder HTTP. Essa arquitetura não foi implementada e exige aprovação de escopo/armazenamento.
