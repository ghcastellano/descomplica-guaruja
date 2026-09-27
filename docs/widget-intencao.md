# Entrada por intenção — widget na própria home

A entrada anterior redirecionava imediatamente para um formulário em outra página, quebrando a expectativa criada pelo prompt. O fluxo foi alterado para uma resposta visual dentro da home; os acessos diretos a `/descomplicar` usam o mesmo componente.

## Comportamento

- Texto inicial fica visível como contexto; categoria reconhecida oferece card, foto de acervo e estimativa existente quando aplicável.
- Sem correspondência clara, a pessoa escolhe opções. Não inventar prestadores, preço de serviço ou vaga.
- Quantidade, data/período e local são ajustados por escolhas no widget. Detalhes adicionais ficam recolhidos quando o pedido inicial já contém texto suficiente.
- Contato e consentimento entram ao final. Revisão precede a gravação no Neon.
- Confirmação permanece no widget; navegar para acompanhamento passa a ser ação explícita do cliente.
- Falhas de envio preservam respostas e chave de idempotência. Não há envio de WhatsApp ou pagamento nesta etapa.

## Limites atuais

A interpretação usa regras, não modelo de IA. Não há consumo de tokens nem nova chave de IA configurada. Catálogo e preços vêm dos arquivos existentes, com a mesma função de estimativa; o Neon persiste os pedidos e o motor operacional. O widget não pesquisa livremente o banco nem recupera dados de outros clientes.

## Próxima integração, após escolha do provedor

A IA pode transformar linguagem livre em campos e chamar funções restritas da aplicação: buscar catálogo público, pedir campos faltantes e consultar disponibilidade de uma proposta autorizada. O servidor valida entradas e resultados. Preços, quantidade, política de reserva, consentimento e pagamentos continuam determinísticos.

A chave de API fica somente no servidor. Não permitir SQL livre, acesso a dados pessoais de outros pedidos, reserva por inferência ou envio automático de mensagens. Começar com poucas chamadas curtas, timeout e limite de uso; a interface de escolhas deve funcionar quando a IA estiver indisponível. Catálogo estruturado não exige banco vetorial para essa primeira integração.

## Validação

`app/tests/intent-widget-checks.py`: Chrome e Safari, 320/390/768/1440; mesma URL durante interpretação, escolhas e confirmação, estimativa do catálogo, falha/retry preservando payload, imagens e overflow. API interceptada, sem leads reais.

`app/tests/city-browser-checks.py`: páginas públicas e jornada existente, com um pedido fictício no Neon encerrado após teste.
