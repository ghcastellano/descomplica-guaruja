# Operação Descomplica · etapa 1

Protótipo funcional **somente local, com dados fictícios**. Solicitação → rascunho → revisão de Sophia → liberação explícita → link de proposta → mensagem simulada. PostgreSQL separado do Supabase existente. Nada é enviado ao WhatsApp ou e-mail; não há cobrança nem reserva.

## Rodar no Mac

Pré-requisitos: Node 22.13+ e PostgreSQL 17 (`/opt/homebrew/opt/postgresql@17/bin`; outro caminho via `PG_BIN`). A partir de `app/`:

```sh
npm ci
npm run local:setup
npm run db:migrate
npm run dev
```

Abra http://127.0.0.1:3001 e use o `LOCAL_ACCESS_CODE` gerado em `.env.local`. Não use `localhost`: a origem está deliberadamente restrita a `127.0.0.1:3001`. O arquivo `.env.local` contém segredos e nunca deve ser publicado.

O banco fica em `.local/postgres`, porta TCP 54339, sem socket Unix, com dois bancos: `descomplica_local` e `descomplica_test`. O setup não altera outros clusters ou bancos. Usa autenticação local trust, adequada apenas a dados fictícios nesta máquina. Para desligar o cluster:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D .local/postgres stop
```

Para testar o build otimizado, pare `npm run dev`, execute `npm run build` e `npm start`.

## Roteiro de teste da Sophia

1. Entre e escolha **Solicitação de teste**. Use nome e contato fictícios.
2. Escolha uma das 11 experiências. A Dois aceita exatamente 2 pessoas; as demais, de 2 a 8. Registre preferência de local e período, sem reservar nada.
3. Abra o rascunho, revise valor, inclusões e recado. A nota interna fica somente com a equipe.
4. Salve a revisão. Marque a confirmação e libere explicitamente a versão revisada.
5. Abra a visão do cliente. Veja o valor e as inclusões. A mensagem simulada está disponível para copiar, mas não há envio automático.
6. Edite de novo: a proposta volta para revisão, o link anterior deixa de funcionar e uma nova liberação cria outro link.

O questionário público ainda não envia dados para esta instalação local. Não é possível abrir o link em outro dispositivo: isso exigirá ambiente hospedado, autenticação real e banco isolado de produção. O painel responsivo pode ser validado no modo móvel do navegador.

## Regras e rastreamento

- Rascunho determinístico: média da faixa estimada do catálogo por pacote e número de pessoas. Não é uma pesquisa nova nem uma cotação validada. O catálogo foi extraído do site, é versionado e precisa de revisão comercial antes do uso real.
- Solicitações possuem protocolo, chave de idempotência e impressão digital do conteúdo. Repetir o envio com a mesma chave não duplica o pedido; mudar o conteúdo com a mesma chave retorna conflito.
- Revisões e eventos são imutáveis no banco; cada alteração cria uma versão. Edições concorrentes usam bloqueio transacional e controle de versão. Aprovar uma versão antiga é recusado.
- Cada versão pode gerar apenas uma mensagem na outbox. A mensagem é **simulada**, criptografada em repouso com AES-256-GCM, e nunca marcada como enviada.
- Links usam 256 bits aleatórios, hash SHA-256 persistido, expiração de 7 dias e revogação automática na edição. GET não aprova nem altera a proposta. O link bruto existe apenas no payload cifrado da mensagem.
- A visão do cliente é montada por uma lista explícita de campos permitidos. Não contém contato, história privada, nota interna, histórico interno ou custos.
- Sessão local assinada, cookie HttpOnly/SameSite, checagem de origem nas mutações, restrição de host, páginas privadas com no-store/noindex/no-referrer e sem analytics.
- Ator de auditoria nesta etapa é “Sophia · sessão local de teste”. Isso não substitui identidade individual, autenticação ou permissões de produção.

## Design único

A aplicação importa diretamente `../design-system/tokens.css`, `fonts.css` e `components.css`, os mesmos arquivos usados pelo site e pelas apresentações. Cores, tipografia, botões e cartões não têm uma cópia alternativa. O layout operacional fica em `app/style.css`; imagens/fontes locais estão em `public/`. O build precisa do repositório completo, pois o design system fica acima de `app/`.

## Validação

```sh
npm run typecheck
npm test
npm run build
```

`npm test` migra e usa **somente** `TEST_DATABASE_URL`, exigindo o nome `descomplica_test`. Os dados de teste permanecem nesse banco, separados dos exemplos da interface. Cobre limites de pessoas, criação e aprovação concorrentes, idempotência, conflito de revisão, revogação e expiração de links, histórico imutável, conteúdo privado e assinaturas de sessão.

Com o app rodando e Python/Playwright instalados:

```sh
python tests/browser-checks.py
```

O teste percorre solicitação → revisão → link → revogação em Chromium e WebKit; verifica CSRF, acesso sem sessão e overflow em 350, 390, 768 e 1440 pixels. Bloqueia chamadas externas. As capturas de tela ficam em `/tmp/descomplica-app-*.png`.

## Próximas etapas (ainda não implementadas)

1. Agenda com duração por experiência, janelas de montagem/desmontagem, equipe, bloqueios concorrentes e locais aprovados. Nenhuma disponibilidade pública fictícia.
2. Ambiente hospedado isolado, autenticação individual com MFA, perfis de acesso, sessões revogáveis, backup/restauração, retenção de dados e observabilidade.
3. Integrar questionário público ao recebimento confirmado, com proteção contra abuso e consentimento. Os dados devem chegar ao sistema antes de informar sucesso.
4. WhatsApp oficial: templates aprovados, identidade do remetente, webhooks validados, fila, retries e estado de entrega. Sophia pode receber alertas e abrir o painel móvel; comandos de bot somente quando simplificarem sua rotina.
5. Aceite, pagamento, confirmação de reserva e tarefas de execução, após definição das regras de negócio e parceiros de pagamento.

Esta etapa é deliberadamente bloqueada para hosts e bancos remotos. Não publicar este diretório no projeto Vercel estático nem remover as restrições para transformá-lo em produção.
