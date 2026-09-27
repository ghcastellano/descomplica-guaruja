# Rede local — etapa 1 em homologação

## O que está funcionando

- `/parceiros`: inscrição voluntária em três etapas (serviços; área/forma de atendimento; termos e escolhas).
- `/operacao/rede`: indicações internas, origem da informação, preparação manual do link de convite e fila de avaliação da Sophia.
- `/rede/[token]`: convite e acompanhamento privado, registro de termos aceitos, alterações de autorizações e encerramento voluntário.
- Catálogo inicial de 23 serviços em Casa/Resolver, com duas perguntas específicas por serviço. A IA pode selecionar o serviço a partir do texto; os campos, respostas e vínculo entre serviço/categoria são validados pelo servidor. O pedido completo chega à operação.
- Todos os serviços de terceiros estão **sob consulta**. Cadastro, aceite ou aprovação não habilitam disponibilidade, cobrança ou publicação.

## Etapas e significado

`Em prospecção → Convite preparado → Cadastro recebido → Em avaliação → Pré-cadastro aprovado`

A equipe pode não aprovar um registro; o profissional pode recusar o convite ou encerrar a participação. Aprovação aqui significa que a equipe registrou sua análise e confirmou contato/especialidades. Não significa parceria comercial ativa, garantia de identidade por terceiro ou promessa de serviço disponível. Experiências continuam no motor próprio de propostas, agenda e pagamentos existente.

Indicações internas não aparecem publicamente. Só após preparar o convite é possível abrir o link privado. O profissional escolhe participar. Copiar o link não envia WhatsApp ou e-mail. Os convites devem ser apresentados por canal autorizado; encontrar um telefone público não concede permissão para contato automatizado.

## Aceite e privacidade

Termos `cadastro-avaliacao-2026-09-27-v1`, texto em `app/lib/service-catalog.ts`.

- Declaração de maioridade e aceite dos termos são necessários para enviar.
- Autorizações de divulgação e WhatsApp são separadas, opcionais e inicialmente desmarcadas.
- Cadastro com e-mail é aceito sem WhatsApp. Autorizar WhatsApp exige um contato telefônico válido no formato; isso não comprova a posse do número.
- Cada aceite registra versão, texto integral, hash, nome/contato declarados, escolhas e horário no banco. Os eventos resistem a UPDATE e DELETE pelo trigger de histórico.
- Não existe validação de identidade por OTP ou assinatura eletrônica certificada. A identidade é autodeclarada; a Sophia precisa conferir contato/especialidades e registrar a evidência antes de aprovar o pré-cadastro.
- O link tem 90 dias de validade. O banco guarda hash do token e uma cópia cifrada para a equipe recuperar o convite; o link público não expõe telefone, e-mail, fonte ou notas internas.
- O portador do link pode alterar autorizações e encerrar a participação. Revogação vale no estado atual; o histórico permanece. Retenção e remoção de dados precisam de política operacional antes de usar dados reais em escala.
- Idempotência protege inscrições e indicações; versões evitam que duas avaliações sobrescrevam decisões. Inscrições têm limite durável de 5/h por hash de IP e 60/h no app. Os limites da IA continuam separados.

Os termos desta etapa tratam do cadastro **de teste**. Antes do uso comercial: definir responsável jurídico, papel de cada parte, comissão/remuneração, pagamentos, cancelamento, responsabilidades, qualidade e revisar o instrumento jurídico. O sistema não inventa essas condições e não ativa parceiros antes delas.

## Catálogo e IA

A lista de serviços é um catálogo de possibilidades para qualificação, sem preços ou prestadores inventados. Serviços não reconhecidos continuam com avaliação da equipe. Perguntas técnicas ajudam a descrever o problema; não fazem diagnóstico remoto ou garantem solução.

A inclusão dos 23 serviços aumenta o contexto do modelo: um teste real de torneira consumiu 1.230 tokens de entrada e 51 de saída (~US$ 0,000369 conservadores). O custo da amostra antiga, de categorias apenas, não deve ser tratado como medição do catálogo ampliado. Reserva por chamada de US$ 0,004 e os limites de 500/dia e US$ 2/dia de reservas continuam iguais.

## Como testar

1. Como visitante, abra `/parceiros`, escolha um serviço e envie usando dados fictícios. Não é necessário autorizar divulgação ou WhatsApp.
2. Guarde o link privado de acompanhamento. Confira o registro dos termos e teste retirar permissões/encerrar.
3. Como equipe, entre em `/login` e abra `/operacao/rede`. Abra a inscrição, inicie a avaliação e registre uma decisão.
4. Para testar convite, registre uma indicação fictícia, avance para Convite preparado e abra o link. Teste aceitar ou recusar.
5. Na home, descreva uma torneira pingando. Confira a identificação de reparo de torneira e responda às perguntas. Em `/resolver` e `/casa`, confira o catálogo sob consulta.

Validação: testes de domínio de aceite, idempotência, token, histórico, qualificação, retirada de permissões e serviço/categoria; Playwright Chromium/WebKit em 320/390/768/1440; jornada real de homologação com registro QA encerrado, sem mensagens ou cobranças. Migração aditiva `008_partner_network.sql` e privilégios mínimos no Neon dedicado.

## Próximas etapas

- Recrutar os primeiros profissionais por indicações e canais autorizados. Nenhuma raspagem ou importação automática foi executada.
- Validar demanda e operação por serviço/região antes de habilitar oferta.
- Definir condições comerciais e mecanismo de confirmação da identidade/contato.
- Implementar ativação, disponibilidade e distribuição de pedidos com regras de qualidade.
- Integrar envio oficial de WhatsApp com permissão registrada, templates e opt-out. A interface atual não envia mensagens.
