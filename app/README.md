# Operação Descomplica · propostas, agenda e pagamentos de teste

Aplicação funcional **somente local, com dados fictícios**. Entrada manual ou briefing completo → proposta revisada pela Sophia → link do cliente → local e horário → aceite → sinal de 50% → saldo até 72h antes. PostgreSQL próprio, separado do Supabase existente. Mensagens WhatsApp/e-mail ainda são simuladas; não há atendimento real nem cobrança de produção.

## Rodar no Mac

Node 22.13+ e PostgreSQL 17 (`/opt/homebrew/opt/postgresql@17/bin`, configurável por `PG_BIN`). A partir de `app/`:

```sh
npm ci
npm run local:setup
npm run db:migrate
npm run dev
```

Abra http://127.0.0.1:3001 e use `LOCAL_ACCESS_CODE` de `.env.local`. Não use `localhost`: host/origem estão restritos a `127.0.0.1:3001`. Segredos e `.local/` ficam fora do Git. Para build otimizado: pare o servidor, rode `npm run build` e `npm start`.

Banco `.local/postgres`, TCP 54339, sem socket Unix, bancos `descomplica_local` e `descomplica_test`. Autenticação local trust é apenas para dados fictícios nesta máquina; setup não altera outros clusters. Para desligar:

```sh
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D .local/postgres stop
```

## Roteiro da Sophia e do cliente

1. **Registrar conversa** guarda nome, contato, origem e mensagem inicial. Não exige questionário, pacote ou data. Pesquise o contato antes de abrir outro atendimento; eventos diferentes do mesmo cliente podem ter protocolos diferentes.
2. Complete o briefing quando tiver os dados. O mesmo protocolo acompanha a conversa e a proposta, com origem e mensagem original preservadas na auditoria. Não há importação de WhatsApp.
3. Alternativamente, **Solicitação de teste** registra um briefing completo. A Dois tem exatamente 2 pessoas; as demais experiências, de 2 a 8.
4. Revise valor, duração, inclusões e recado. Custos e nota interna não aparecem para o cliente. Salve e libere a versão explicitamente.
5. No link, o cliente consulta data/local, escolhe um horário livre, separa a vaga e aceita a versão com suas condições. Uma visita ao link não representa aceite.
6. Se o Stripe de teste estiver configurado, o cliente abre Checkout para o sinal. A confirmação vem do webhook, nunca do retorno à página. Sem configuração, Sophia pode simular o recebimento em **Agenda**.
7. O sinal confirma a reserva. O cliente pode pagar o saldo no mesmo link. A agenda reúne situação, valores, prazos e histórico de avisos simulados.
8. Alterações geram revisão e revogam links anteriores. Uma reserva ativa/confirmada ou um recebimento em conciliação bloqueia edição da proposta. Não há alteração automática de uma oferta já aprovada.

## Agenda própria, sem Calendly

Uma equipe, dois **locais fictícios**: jardim e espaço coberto. Fixtures do protótipo: janelas 9h/14h/17h conforme período solicitado, antecedência 96h, horizonte 60 dias, preparação 60min, desmontagem 45min. Noite não tem slots demonstrativos. Estas regras e locais precisam de validação operacional antes de uso real; nenhuma praia está liberada para reserva por este código.

Duração inicial 90/120/150 minutos conforme pacote; Pedido Luxo exige duração explícita. Sophia revisa a duração. Intervalos ocupados incluem preparação e desmontagem. Uma exclusão GiST no PostgreSQL impede sobreposição da equipe mesmo em locais diferentes. Transações serializam mutações e edição da proposta.

Pré-reserva dura 15min; ao criar Checkout do sinal, prazo passa a 31min para respeitar a expiração mínima de 30min do Stripe. Expiração libera capacidade. Cancelamento é permitido só sem pagamentos ou Checkout com resultado desconhecido/ativo. Recebimento tardio fica registrado para conciliação, sem confirmar uma vaga sobreposta. Não há interface de estorno ou remarcação de reservas pagas nesta etapa.

## Stripe de teste

SDK oficial; somente `sk_test_` e eventos `livemode=false`. Preencha em `.env.local`, sem enviar ao Git/chat:

```dotenv
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

O segredo do webhook deve pertencer ao endpoint/listener **deste app**. Não reutilize o segredo de outro projeto. Com Stripe CLI autenticado na conta de teste, encaminhe os eventos a:

```sh
stripe listen --forward-to http://127.0.0.1:3001/api/stripe/webhook
```

Copie o signing secret do listener para `STRIPE_WEBHOOK_SECRET` e reinicie o servidor. Este comando é um roteiro de configuração, não prova de que a conta já foi validada.

- Checkout BRL/cartão, parcelas comerciais separadas de sinal e saldo. Não é parcelamento mensal do cartão. Pix não habilitado nesta etapa.
- Valor autoritativo vem da reserva aceita, não do navegador. Tentativa e parâmetros cifrados persistem antes da API; retries usam a mesma chave de idempotência.
- Nova tentativa só após expiração confirmada pelo Stripe; passar o tempo local não autoriza uma nova cobrança com resultado desconhecido.
- Webhook verifica corpo bruto/assinatura, tipo, modo, sessão, metadados, moeda e valor. Deduplicação por evento, sessão e payment intent.
- Recebimentos tardios ou incompatíveis com a reserva vão à conciliação, com alerta registrado. Não há estorno automático nem job de reconciliação ainda.
- Simulação manual não pode misturar recebimentos com Checkout ativo ou pagamentos Stripe do mesmo agendamento.

A suíte verifica assinatura com SDK real e transporte Stripe simulado, sem chamadas à conta. A validação ponta a ponta com o provedor exige credenciais e listener reais de teste.

## Preço e tarifas

Novos rascunhos usam a média do catálogo com a provisão de pagamento **substituída**, não duplicada. Fonte comercial: https://stripe.com/br/pricing, consulta em 26/09/2026: cartão nacional 3,99% + R$0,39 por transação. Sinal e saldo geram duas tarifas fixas. Mantemos as reservas de planejamento originais de 10% fiscal e 15% margem, que não representam alíquota definida ou lucro garantido.

`lib/pricing.ts` calcula em centavos: orçamento operacional de referência = base × 0,74; preço ajustado aproximadamente `(orçamento + 2 × R$0,39) / 0,7101`, com arredondamento que preserve esse orçamento após as duas tarifas. A composição fica na nota interna do rascunho e na revisão. Uma alteração manual do preço não garante margem; Sophia confere o custo líquido mostrado.

Cartão internacional, estornos e contestações podem ter custo adicional. Taxa de produção deve ser conferida no contrato Stripe. Não existe sobretaxa adicionada no checkout. Propostas antigas e faixas estimadas publicadas no site não são reescritas por este protótipo; o preço definitivo da proposta nova é aprovado antes da liberação.

## Rastreamento e privacidade

Protocolos, idempotência, snapshots/auditoria imutáveis e controle de versão. Mensagens de proposta cifradas AES-256-GCM, sem estado falso de envio. Avisos da reserva explicitamente simulados no banco. Cliente não recebe contato, história privada, nota interna, custos ou auditoria.

Links têm 256 bits aleatórios, hash SHA-256 persistido e expiração inicial 7 dias. Após sinal confirmado, links não revogados da versão aceita permanecem válidos até 7 dias após o evento para acompanhar e pagar saldo. Nenhum link revogado é reativado.

Sessão local assinada, cookie HttpOnly/SameSite, validação de origem, no-store/noindex/no-referrer e sem analytics. Ator “Sophia · sessão local de teste” não substitui identidade individual em produção.

## Design e validação

Fonte única em `../design-system/tokens.css`, `fonts.css`, `components.css`. `app/style.css` cuida do layout operacional. O build exige o repositório completo.

```sh
npm run typecheck
npm test
npm run build
python tests/browser-checks.py
python tests/booking-browser-checks.py
```

Testes usam somente `TEST_DATABASE_URL` com nome `descomplica_test`, migram schema e cobrem concorrência, privacidade, revisões, agenda, pagamentos, retries, eventos tardios e composição de tarifas. Playwright Chromium/WebKit percorre os fluxos reais locais e verifica 350/390/768/1440px, bloqueando tráfego externo.

## Antes de operar de verdade

Ainda faltam: ambiente hospedado isolado, autenticação individual/MFA, backup restaurado/testado, observabilidade, proteção contra abuso; validação dos locais e regras; termos/cancelamento/remarcação/reembolso; checkout validado com conta de teste antes de produção; jobs de conciliação e lembretes; integração do questionário público; WhatsApp oficial e entregas/retries; ordens de produção e pós-venda.

O site público ainda usa o fluxo anterior. Links locais não abrem no celular de outra pessoa. `app/` está excluído do deploy estático Vercel; não remover as restrições para transformar este protótipo em produção.
