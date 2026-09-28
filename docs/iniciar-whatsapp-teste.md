# WhatsApp oficial — início com número de teste

Atualizado em 28/09/2026. Gustavo escolheu começar com o número de teste da Meta e pediu a criação da integração.

## Situação confirmada

- Neon `descomplica_staging` respondeu com o papel restrito `descomplica_app`.
- Login de visitante e equipe validado na homologação; home, cadastro de parceiros, guia, operação, rede e agenda responderam HTTP 200.
- PostgreSQL local de testes iniciado; 58 testes passaram, incluindo cinco de WhatsApp. Esse banco é separado do Neon.
- Backend de teste implementado: webhook assinado, eventos cifrados e deduplicados, visualização autenticada e comando explícito de envio.
- O painel Meta exige verificar o celular da conta de desenvolvedor antes de criar o aplicativo. A aba foi deixada aberta para Gustavo. App Secret, token de acesso, WABA e Phone Number ID ainda não foram obtidos.
- Nenhuma mensagem foi enviada e nenhum número comercial foi migrado. O modo fica desativado até concluir a configuração.
- Publicado em `descomplica-guaruja-homolog.vercel.app` em 28/09: desafio válido retornou 200 com o valor esperado, token errado retornou 403 e POST desativado retornou 503. Painel protegido redireciona visitantes sem sessão; tela da equipe conferida no Chrome com leitura do Neon.
- O token de callback está na Vercel como sensitive e no arquivo privado `Downloads/Descomplica-WhatsApp-Configuracao-Privada.txt`. Não versionar esse arquivo.
- O campo de origem WhatsApp e os textos preparados pelo sistema não são integração com a API.

## Primeiro passo no painel Meta

1. Acesse https://developers.facebook.com/apps/ com a conta que administrará o Descomplica.
2. Crie um aplicativo para o caso de uso WhatsApp/contato com clientes. Os nomes das opções podem variar conforme a conta. Vincule o portfólio empresarial do Descomplica quando solicitado.
3. Entre na configuração da API do WhatsApp (API Setup/Getting Started) e obtenha o número de teste fornecido pela Meta. Nesta etapa não cadastre nem migre o número comercial.
4. Adicione um telefone seu como destinatário de teste e confirme o código recebido. Adicione Sophia depois, se ela participar desse teste.
5. O painel oferece um teste com o template `hello_world`. Faça esse envio pelo próprio painel para o seu telefone verificado. Isso valida a conta Meta, ainda sem conectar o nosso aplicativo.
6. Guarde Phone Number ID, WhatsApp Business Account ID (WABA), App ID e a versão da Graph API indicada pelo painel. O token de acesso e o App Secret são credenciais privadas; a configuração deverá ser feita no servidor, fora do Git e do frontend. O token inicial serve para testes; a configuração durável precisa de credencial apropriada antes de depender dela.

O primeiro teste pelo painel é feito pelo proprietário da conta. Nenhuma mensagem foi enviada por esta tarefa.

## Base implementada no Descomplica

- Callback: `https://descomplica-guaruja-homolog.vercel.app/api/whatsapp/webhook`.
- Painel autenticado: `https://descomplica-guaruja-homolog.vercel.app/operacao/whatsapp`.
- GET verifica `hub.mode`, token privado e desafio. POST valida `X-Hub-Signature-256` sobre o corpo, limita o evento a 256 KB e só grava mensagens/status da WABA, Phone Number ID e destinatários configurados.
- Migração `009_whatsapp_test.sql`: eventos imutáveis e cifrados; tentativas de envio separadas da outbox de propostas. Papel web sem privilégios para apagar eventos.
- `WHATSAPP_MODE=disabled` por padrão. Para ativar somente teste: `WHATSAPP_MODE=test`, `WHATSAPP_APP_SECRET`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_WABA_ID`, `WHATSAPP_GRAPH_VERSION` e `WHATSAPP_TEST_RECIPIENTS` (até cinco telefones internacionais, apenas dígitos, separados por vírgula).
- `WHATSAPP_VERIFY_TOKEN` gerado separadamente permite cadastrar o callback antes da ativação de mensagens. Não é o App Secret nem o token de acesso.
- Mensagens de texto são exibidas como texto no painel; anexos não são baixados. Telefone mascarado. Não cria atendimento automaticamente nem envia respostas automáticas.
- Envio explícito de `hello_world` ou texto por comando abaixo: até 10 tentativas em 24h, UUID persistente e bloqueio de duplicatas concorrentes. Texto só após mensagem recebida nas últimas 24h para o número configurado. `accepted` significa aceitação pela API; entrega/leitura dependem do webhook.
- Resultado ambíguo (`unknown`, ou `sending` após interrupção) não é reenviado automaticamente. Não gerar outra chave para contornar a proteção: conferir os eventos e o provedor primeiro.

Crie um JSON privado fora do Git, somente após confirmar o destinatário de teste:

```json
{"requestKey":"UUID-gerado-uma-unica-vez","to":"telefone-internacional-autorizado","kind":"hello_world"}
```

Depois, na pasta `app`, execute:

```sh
node --env-file=.env.local --import tsx scripts/whatsapp-test.ts /caminho/privado/teste.json
```

Para responder: novo UUID, `kind: "text"` e campo `text`. Só executar com autorização para enviar ao destinatário indicado. Os testes automatizados usam transporte simulado; não chamam a Meta.

## Próximo marco após configuração da Meta

Primeiro marco: mensagem enviada pelo seu telefone ao número de teste aparece na operação, uma resposta autorizada sai pelo sistema e o status de entrega fica registrado.

Sequência restante:

1. Configurar credenciais privadas apenas no projeto de homologação e restringir destinatários aos telefones de teste confirmados.
2. Cadastrar callback/token no painel Meta, assinar o campo `messages` e validar um evento real.
3. Vincular mensagens ao atendimento; se houver múltiplos pedidos para o mesmo contato, exigir contexto antes de alterar um pedido. Essa ponte ainda não existe.
4. Integrar envios ao fluxo de propostas, com fila, reconciliação e políticas próprias. O comando de envio de teste não processa a outbox comercial existente.
5. Respeitar consentimento, retirada de permissão, janela de atendimento e templates aprovados. O consentimento opcional dos parceiros não substitui a permissão dos clientes ou da equipe.
6. Testar duplicatas, assinatura inválida, falhas de entrega e destinatário fora da lista, antes do teste ponta a ponta com o telefone autorizado.

O webhook não exige código de visitante: o GET usa o token de verificação; o POST exige a assinatura do aplicativo. A página de operação continua exigindo sessão da equipe.

## Fluxo do produto recomendado

Cliente inicia conversa → sistema registra atendimento → Sophia recebe aviso com link para o painel → Sophia revisa e libera proposta → cliente recebe link → confirmação de reserva/pagamento atualiza o atendimento.

Inicialmente, decisões da Sophia ficam no painel. Aprovação por botões dentro do WhatsApp é uma evolução posterior, que exige vínculo verificado entre operador e telefone, versão da proposta e autorização por ação. Não basta reconhecer um número como administrador.

WhatsApp é o canal; preço, agenda, propostas e pagamentos continuam no motor atual. Credenciais Stripe seguem em sandbox.

## Fontes e limites da pesquisa

- Coleção oficial Meta: https://www.postman.com/meta/whatsapp-business-platform/documentation/wlk6lh4/whatsapp-cloud-api
- Política de mensagens: https://whatsappbusiness.com/policy/
- Guia Meta: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started

A política consultada exige permissão para contato, templates aprovados para iniciar conversas e para mensagens fora da janela de 24 horas, além de um caminho claro para atendimento humano em fluxos automatizados. Os nomes exatos das telas devem ser conferidos no aplicativo criado: a documentação direta em developers.facebook.com retornou HTTP 429 nesta consulta.
