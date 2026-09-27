# Evoluções de confiabilidade e operação — 26/09/2026

## Escopo entregue

As duas versões continuam separadas. O site comercial mantém a oferta de experiências; a nova home e o motor operacional permanecem no projeto de homologação.

### Site comercial

- Captação de contato valida telefone com DDD e permite envio por teclado, com rótulos explícitos.
- Erros de rede e timeout oferecem nova tentativa e WhatsApp com todas as respostas, telefone e preferência de contato. O botão principal também incorpora esses dados.
- O retorno opaco do Apps Script não é apresentado como prova de recebimento. Não há promessa de retorno sem confirmação.
- Trocas de pergunta e resultado recebem foco acessível. O deslocamento respeita movimento reduzido.
- Retirada afirmação de esgotamento de horários sem inventário que a comprove.

### Homologação

- Quantidade, coleção solicitada, local, período e data desejada aparecem na qualificação. Sophia ainda escolhe o nível e aprova valores; preferências não viram reserva automática.
- Pôr do sol separado de tarde, preservado até a proposta e usado pela agenda existente.
- A ponte para experiências avança a etapa para avaliação atomicamente, sem duplicar atendimento ou histórico em retries.
- Busca por protocolo GU e DG, nome/contato e categoria de pedido; filtro de etapa nos pedidos da nova entrada. O filtro é aplicado no banco antes do limite de resultados.
- Acompanhamento mostra proposta liberada e situação atual da reserva/pagamento, incluindo conferência manual e expiração. Botão de atualizar sem sair da página.
- Links e mensagens de proposta usam o host atual da prévia, preservando o token e o documento cifrado original. Não devolvem URL externa do payload.
- Limite de notas da qualificação comporta descrição recebida com o contexto acrescentado pela ponte.

## Evidências

- 42 testes de domínio aprovados em Postgres local isolado; incluem ponte idempotente, preferências, filtros, links entre ambientes, pagamentos e privacidade do DTO público.
- Build Next/TypeScript aprovado.
- Site: checks estáticos, 40 questionários, 350 estados de apresentações, 10 combinações de navegador/tela; Chrome e Safari.
- Captura: falha, retry, telefone inválido, WhatsApp, foco e ausência de overflow em Chrome/Safari, 320/768/1440. Requisições externas interceptadas, sem envio de leads reais.
- Nova home: 11 rotas em Chrome/Safari, larguras 320/390/768/1440, mais pedido fictício encerrado no Neon.
- Fluxo de preferências/filtros/atualização verificado pelo navegador; situação de um pagamento anterior de teste conferida no acompanhamento. Nenhuma nova cobrança real.

## Próximos gaps, em ordem de dependência

1. **Identidade e operação:** login individual da equipe, permissões, rate limit durável, recuperação de acesso e observabilidade. Códigos compartilhados atuais são apenas para homologação.
2. **Comunicação:** Meta Cloud API, templates/opt-in, webhook e reenvio idempotente; e-mail transacional. Hoje há mensagens preparadas e acompanhamento pelo painel, sem bot ou envio automático.
3. **Reserva real:** locais autorizados, capacidade, bloqueios de agenda, reagendamento e cancelamento conciliados com propostas e pagamentos. Encerrar um pedido na fila não deve ser tratado como cancelamento financeiro.
4. **Pagamentos permanentes:** reivindicar/substituir sandbox temporário antes da expiração, validar políticas, estornos e conciliação. Stripe continua exclusivamente em teste.
5. **Novas verticais:** revisão e contratos de parceiros, propostas de serviços/casa, operação e políticas próprias. Receber interesse não significa oferecer serviço com preço/disponibilidade garantidos.
6. **Conta do cliente:** recuperação de links e pedidos entre dispositivos, gestão de consentimento e retenção. Atalhos atuais ficam no navegador.

Nenhuma alteração de banco foi necessária nesta rodada. Não houve ativação de canais externos, cobrança real ou substituição da home comercial.
