# Publicar a homologação e testar com Sophia

O projeto de testes é **descomplica-guaruja-homolog** na equipe Vercel `gustavo-s`. Ele é separado de **descomplica-guaruja**, que continua atendendo o site comercial. O comando `--prod` deste fluxo atualiza somente o endereço estável do projeto de homologação, não o domínio comercial.

## Atualizações pelo Mac

1. Trabalhe na branch `feat/descomplica-v2-aprovacao`, na pasta `descomplica-guaruja-v2`.
2. Abra o terminal na subpasta `app`.
3. Execute `npm run deploy:staging`.
4. O comando verifica a branch, roda os testes no Postgres local isolado, compila o app, cria um pacote com código e imagens permitidos e publica na Vercel.
5. Espere a Vercel concluir. Abra `https://descomplica-guaruja-homolog.vercel.app` e faça um teste rápido pelo guia.

Não execute `vercel --prod` na pasta do site antigo. O script aponta explicitamente para o novo projeto; o pacote de publicação inclui apenas app e design system. Arquivos `.env`, conexão de proprietário do banco, `.local`, documentos e testes não são enviados.

## Dependências desta configuração local

- Vercel CLI autenticada na equipe `gustavo-s`.
- Node compatível, dependências instaladas com `npm ci`.
- Postgres local de teste ativo em `127.0.0.1:54339`; esse banco nunca é o Neon.
- `.local/vercel-project.json` com metadados do projeto separado. Contém o vínculo de projeto, sem credenciais necessárias ao site.
- Arquivos `.env.local` e `.env.migration.local` privados configurados. Chaves do ambiente online estão no painel da Vercel como sensitive.

Este fluxo usa publicação explícita por CLI. Enviar commits para o GitHub **não substitui** o comando de publicação da homologação nesta configuração. Não há mudança automática da branch `main` do site comercial.

## Banco e migrações

Ambiente online e prévia local usam o Neon dedicado confirmado por Gustavo: `descomplica_staging`. O papel web é restrito. Novas migrações precisam ser revisadas e executadas separadamente por `npm run db:migrate:neon`; o deploy não ganha credenciais de proprietário nem executa migrações automaticamente.

## Acesso e roteiro

- `/acesso`: código de visitante para testar a visão do cliente.
- `/login`: código separado da equipe para Sophia revisar pedidos e propostas.
- `/guia-de-testes`: roteiro completo dentro do site.
- `/operacao`: fila da equipe.
- `/agenda`: horários, sinal e saldo.

Os códigos foram guardados em um arquivo privado em Downloads para Gustavo compartilhar diretamente com Sophia. Não colocá-los no Git, na página pública ou em mensagens automáticas.

O cliente de teste abre uma janela anônima e entra com o código de visitante. Sophia usa a janela normal, entra como equipe e percorre a outra metade da jornada. Assim fica claro o que cada pessoa vê.

## Pagamento de teste

O Stripe usa sandbox e webhook próprio da URL pública; não depende do Mac ligado. Chaves live são rejeitadas. No Checkout, use o cartão `4242 4242 4242 4242`, validade futura (por exemplo 12/34) e CVC 123. Não usar cartão real. Fonte: [documentação oficial do Stripe](https://docs.stripe.com/testing).

A confirmação é feita pelo webhook assinado e conciliado com a reserva. A URL de retorno do Checkout sozinha não confirma pagamento. Teste o sinal de 50% e depois o saldo. O botão administrativo de simular recebimento é outro caminho de teste; não o use para validar o webhook do Stripe.

O sandbox temporário precisa ser reivindicado ou substituído por ambiente de testes permanente antes de sua expiração. A integração atual nunca deve ser apresentada como operação financeira real.

WhatsApp/e-mail seguem simulados: Sophia consulta o painel e compartilha links manualmente se desejar. Não existe bot operacional da Sophia nesta entrega.
