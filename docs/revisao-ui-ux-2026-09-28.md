# Revisão de UI e UX — 28/09/2026

Escopo: aplicação V2 em `app/` e sua homologação. Site comercial estático e decks preservados.

## Defeitos identificados e corrigidos

- Consentimento do pedido: CSS estava preso ao ancestral antigo `.city-form`. O formulário atual usa `.concierge-response`, deixando o checkbox com largura de campo de texto. O componente agora alinha caixa e texto independentemente do formulário.
- Acompanhamento: “Atualizar” tinha um wrapper com mensagem de status; “Copiar” era um fragmento com parágrafo solto. O alinhamento central do flex deslocava os botões. Ambos usam o mesmo controle; mensagens ficam abaixo, botões alinhados no desktop e empilhados no celular.
- Checkboxes de reserva/aprovação: removido padding herdado dos campos de texto.
- Grade de campos: colunas com largura mínima zero; abas operacionais quebram de linha; badges da rede não estouram a lista.
- Navegação em tablet: menu ganha linha própria na faixa intermediária. Celular preserva área segura inferior e todos os atalhos de busca.
- Foco programático dos títulos não desenha uma caixa de foco de botão. Teclado mantém foco visível nos controles.

## Busca e pedido

- Enter envia; Shift+Enter insere linha; composição de texto não dispara busca.
- Serviços mostram até três opções reais do catálogo antes do formulário. Escolher uma opção abre o widget com o serviço preenchido.
- Sem correspondência: informa que não encontrou uma opção específica e oferece ajuda para escolher.
- Experiências continuam com coleção, participantes e estimativa, sem prometer disponibilidade.
- Fallback reconhece serviço, bairro e período explícitos. “Limpeza de ar-condicionado” não cai em faxina residencial. Limpeza pós-obra tem prioridade sobre limpeza genérica.
- Indicador de etapa e linguagem de atendimento mais diretos. Troca de categoria limpa respostas de outro serviço.
- A busca ainda é do catálogo interno; não pesquisa a internet nem lista fornecedores como se estivessem aprovados.

## Captação da rede: recomendação e primeiro passo implementado

A captação deve começar pela busca ativa da equipe, sem depender exclusivamente de interessados preencherem o formulário. Fluxo proposto:

1. Encontrar negócios por especialidade e bairro em fontes públicas permitidas.
2. Guardar nome, contato comercial, fonte e data de verificação; deduplicar por telefone/site antes de importar.
3. Revisar se o negócio atende no Guarujá e oferece o serviço necessário.
4. Registrar a abertura para contato e preparar uma mensagem personalizada.
5. Convidar; o profissional confirma seus dados e escolhas pelo link.
6. Qualificar o atendimento antes de disponibilizá-lo ao cliente.

Entregue nesta revisão: busca externa por serviço/bairro em nova aba, cadastro rápido com fonte, filtros da rede por nome/etapa e mensagem de convite pronta para copiar. Nenhum contato foi enviado.

Próxima evolução: importação de uma lista revisada ou extração de páginas comerciais com origem por campo, detecção de duplicatas e fila de revisão. Um crawler abrangente sem fontes definidas tende a acumular dados velhos e contatos sem contexto. Não foi implementado nesta revisão.

O dado público não equivale a autorização de mensagem. A [política oficial do WhatsApp Business](https://whatsappbusiness.com/policy/), atualizada em 23/09/2026 e consultada em 28/09/2026, exige número fornecido e permissão do destinatário; a Platform exige template aprovado para iniciar conversas e fora da janela de atendimento de 24h. A integração Meta de teste continua aguardando a configuração externa já discutida.

## Verificação

- `npm test`: 59 testes, banco PostgreSQL local isolado.
- `tests/ui-review.mjs`: Chromium/WebKit, 320/390/768/1440; 17 rotas, acompanhamento privado existente, Enter/Shift+Enter, opções de serviço, consentimento, botões antes/depois de feedback e filtros da rede.
- Escritas de pedidos e chamadas de IA interceptadas no teste de navegador. Dados existentes apenas lidos; nenhuma mensagem ou pagamento disparado.
- Evidências locais em `app/.local/ui-review/` (fora do Git).
