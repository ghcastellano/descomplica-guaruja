# Descomplica V2 — versão local para aprovação

Branch: `feat/descomplica-v2-aprovacao`. Pasta independente: `descomplica-guaruja-v2`. Origem: `b9130c7`. A produção estática e o app antigo continuam disponíveis.

## Direção implementada

Uma home, uma pergunta dominante: **O que você precisa no Guarujá?** Busca primeiro, quatro caminhos e exploração visual abaixo. Mesmos tokens, Fraunces/Jost e componentes base; navegação móvel Início / Descomplica / Pedidos / Você. As telas de serviço são objetivas; experiências usam fotografias do acervo. Sem avaliações ou parceiros fictícios.

A conversa compartilhada e o texto complementar orientam o produto. Exemplos de preço, comissões, garantias e profissionais desses materiais não são dados reais nem regras comerciais aprovadas. O arquivo de handoff citado dentro da conversa não estava anexado ao compartilhamento; foi usado o conteúdo acessível da conversa e o texto entregue nesta tarefa.

## O que já funciona

- Home unificada, Resolver, Casa, Experiências, Descobrir, interessados em parceria e área Você.
- Entrada progressiva em cinco passos: necessidade, momento, local, contato e revisão. Categoria reconhecida aparece como resumo editável; opções avançadas não precisam ficar abertas. Classificação inicial por regras simples e editáveis; **não é integração com modelo de IA**.
- Experiências mantêm as quatro coleções. A Dois: 2 pessoas. Demais: 2–8. Simulador de faixas usa o catálogo e a mesma função de provisão de taxas do app atual.
- Intenção de descoberta abre a curadoria; demais intenções viram um briefing editável. Não inferimos endereço, identidade ou disponibilidade.
- Pedidos e eventos persistidos no Neon. Chave de idempotência evita duplicação em retry. Link privado de 256 bits derivados por HMAC, hash armazenado no banco, validade de 90 dias. Protocolo sozinho não abre um pedido.
- Cliente acompanha apenas categoria, etapa, recados públicos e proposta liberada. Nome, contato, descrição original e notas internas não entram no DTO público de acompanhamento.
- Sophia acessa `/operacao`, recebe a fila e registra mudanças com controle de versão e histórico imutável. Campos de notas públicas/internas são separados.
- Pedido de experiência é convertido de forma transacional em atendimento do motor existente. Nome, contato, quantidade e preferências ficam preservados. Sophia qualifica/revisa/libera; a proposta liberada aparece no acompanhamento. Revogar ou revisar remove o acesso à versão antiga.
- Proposta, agenda, aceite, sinal e saldo preservam o motor anterior, **em modo de teste**. Locais e slots são de demonstração, não autorizações de praias.
- Atalhos de pedidos ficam no navegador; link privado funciona em outro navegador acessível ao mesmo servidor. O endereço local `127.0.0.1` só funciona no Mac; a homologação online usa domínio Vercel e pode ser aberta pelo celular com o código de acesso.

## Publicação de homologação autorizada

Gustavo autorizou publicar uma versão online de testes **separada**, preservando o site comercial. O projeto é `descomplica-guaruja-homolog`. Consulte [como publicar e testar](publicar-homologacao.md). O ambiente adiciona uma entrada protegida de visitante e mantém o acesso de equipe separado; Stripe segue exclusivamente sandbox.

## Banco e configuração

Gustavo confirmou o Neon recém-criado: projeto `descomplica-guaruja` (`summer-truth-88078562`), branch `staging`, banco `descomplica_staging`, São Paulo. Apesar do pedido inicial mencionar produção, o destino confirmado é homologação dedicada. Não usa o banco de AtGangway.

- `.env.local`: APP_MODE=local-neon, APP_ORIGIN=http://127.0.0.1:3002, usuário `descomplica_app`, segredo estável próprio da V2 e mesmo código de acesso local da versão anterior. A identidade criptográfica é separada; não trocar LOCAL_SECRET sem planejar migração dos dados cifrados e links.
- `.env.migration.local`: somente conexão de proprietário, usada por `npm run db:migrate:neon`. Não carregada pelo Next.
- Migração 006 acrescenta `city_requests` e `city_request_events`. Não reescreve as cinco migrações existentes.
- Papel web pode inserir/atualizar pedidos e apenas inserir/ler eventos; não pode alterar histórico, criar tabelas ou gerenciar migrações. TLS com validação de certificado, máximo cinco conexões pelo pooler.
- APP_MODE=local-test continua restrito ao Postgres local. `npm test` força modo local e verifica host, porta e nome do banco antes de executar; nunca roda testes destrutivos no Neon.
- A homologação usa códigos de teste separados para visitante e equipe, cookies assinados HttpOnly e Secure no HTTPS, sessões com escopos distintos e limite de tentativas em memória. É uma prévia restrita, não autenticação individual de produção. Antes de exposição pública: login individual, papéis, MFA para equipe, recuperação de acesso e rate limit durável.

## Stripe e WhatsApp

O sandbox dedicado existente foi reaproveitado; não foram criadas cobranças reais nem produto financeiro novo. Chaves live continuam bloqueadas. Listener da V2 encaminha eventos para `3002/api/stripe/webhook`, com segredo próprio salvo sem exibição. A conta temporária precisa ser reivindicada ou substituída por sandbox permanente antes de depender dela. O listener precisa permanecer ativo somente nos testes locais. A homologação publicada tem endpoint e segredo de webhook próprios na Vercel e funciona sem o Mac ligado.

**WhatsApp não está integrado à API da Meta.** Textos de proposta ficam preparados e registrados, mas não são enviados. Atualizações da fila também não disparam WhatsApp ou e-mail. Não usar o número pessoal da Sophia como identificação de operador autenticado.

## Como abrir e validar

Na pasta `descomplica-guaruja-v2/app`:

1. `npm ci` quando necessário.
2. Credenciais já estão em arquivos privados ignorados; não rodar local:setup por cima da configuração Neon.
3. `npm run build` e `npm start` para `http://127.0.0.1:3002`.
4. `npm run stripe:listen` em outro terminal para o sandbox.
5. `npm test`: domínio, concorrência, privacidade, propostas, agenda, pagamentos e ponte entre os fluxos.
6. `tests/city-browser-checks.py`: Chromium/WebKit, 320/390/768/1440, rotas, imagens e ausência de overflow. O teste de ponta a ponta cria **um pedido fictício identificado como Validação técnica V2 no Neon** e o encerra; o histórico permanece para auditoria. Não dispara mensagem ou cobrança.

## Próximas partes — não implementadas nesta prévia

1. **Operação pública de experiências:** autenticação individual, ambientes permanentes, locais autorizados e capacidade real, observabilidade, backups/restauração, políticas comerciais, termos e revisão de privacidade. Cortar o tráfego do site antigo somente após aprovação, sem apagar apresentações.
2. **Notificações:** configurar Meta Cloud API e e-mail, opt-in, templates aprovados, webhook assinado, outbox com retry e chave de idempotência. Notificações levam ao painel autenticado; decisões de Sophia ficam no sistema.
3. **Parceiros curados:** perfil, categorias/áreas atendidas, documentos em armazenamento privado, revisão humana, aceite de contrato versionado e identidade verificada. Cadastro de interesse atual não equivale a esse onboarding.
4. **Matching e propostas de serviços:** modelo offering → request → match → quote → order; no máximo poucas opções úteis, com preço e disponibilidade reais. Contato público limitado; identificação contratual transparente no momento correto. Não implementar anonimato que inviabilize contratação responsável.
5. **Pagamento de marketplace:** avaliar Stripe Connect e requisitos locais da conta antes de integrar. Checkout atual não faz split. Requer onboarding dos recebedores, comissão aprovada, repasses, cancelamento/disputa/reembolso e conciliação. Nenhuma taxa do exemplo da conversa virou regra.
6. **Conta do cliente:** OTP, pedidos unificados entre aparelhos, endereços, repetir pedido, recuperação/revogação de links, gestão de consentimento e retenção. Hoje o acompanhamento usa links e atalhos locais, sem conta/OTP.
7. **Inteligência e conteúdo:** extração estruturada por IA com confirmação humana dos campos, upload privado de foto com validação/limite, catálogo editorial de cidade, contexto escolhido pelo usuário, analytics sem conteúdo pessoal. Cashback, assinaturas Casa+ e localização em tempo real ficam depois de validação operacional.

Evitar microserviços agora. Um monólito modular Next + Postgres é suficiente: domínios separados, transações explícitas, histórico imutável, fontes de preço e disponibilidade no servidor e gateways externos isolados. Extrair filas/serviços somente quando carga ou garantia operacional justificar.

## Referências consultadas para a composição

- [Airbnb — Summer Release 2025](https://news.airbnb.com/product-releases/airbnb-2025-summer-release): descoberta e serviços/experiências em um aplicativo.
- [Uber — redesign da home](https://www.uber.com/us/en/newsroom/were-redesigning-the-uber-app-just-for-you/): entrada por intenção e atividade unificada.
- [TaskRabbit — funcionamento](https://www.taskrabbit.com/): escolha por atributos objetivos quando houver oferta real.
- [Thumbtack — Search, Chat, Hire](https://www.thumbtack.com/how-it-works): clareza de sequência e acompanhamento.
- [Triider — pagamento](https://www.triider.com.br/pagamento): referência brasileira para continuidade entre pedido e pagamento.
- Linear é a referência de sobriedade citada no material do usuário; a marca continua sendo Descomplica. 99Freelas/Workana são referências de modelo de negócio; GetNinjas/Cronoshare/OLX aparecem como contrapontos, não como aparência desejada.

## Validação da homologação publicada

Em 26/09/2026, a jornada foi validada no endereço estável da Vercel: visitante criou pedido fictício; equipe qualificou e liberou a proposta; cliente escolheu local e horário, aceitou e pagou sinal e saldo no Checkout de teste. Os dois webhooks confirmaram os pagamentos e a agenda mostrou pagamento concluído. Nenhuma cobrança real ou mensagem foi enviada.

Também passaram 40 testes de domínio no Postgres isolado e verificação local em Chromium e WebKit nas larguras 320, 390, 768 e 1440, incluindo imagens, overflow e isolamento da área da equipe. Os pedidos de QA permanecem identificados como testes para preservar o histórico.
