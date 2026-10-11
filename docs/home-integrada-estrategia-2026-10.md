# Home integrada: proposta para avaliação

11/10/2026. Página isolada: `/home-proposta`. Referência recebida: `proto-a-proposito.html`.

## Escopo e preservação

Criados apenas arquivos novos. A home principal, o webhook Apps Script, as apresentações, o app e os quatro estudos anteriores não foram alterados. A página copia a composição e os estilos atuais da home, carrega os arquivos reais do design system e acrescenta CSS/JS exclusivos. Ela não importa analytics nem webhook da produção.

O Git remoto foi consultado antes da preparação e deve ser consultado novamente imediatamente antes do push. Se houver trabalho concorrente, integrar o commit com novos arquivos sobre a versão remota, sem force push ou substituição dos arquivos existentes.

## Experiência proposta

Preservar abertura e contexto da marca → escolher ocasião → foto e inclusões → participantes, local e período → adicionais → resumo → WhatsApp. Como funciona, galeria e FAQ vêm depois do seletor. Retirar o quiz dessa variante, pois ele repetiria decisões já presentes. Para indecisos, manter a ação secundária “Preciso de ajuda para escolher”. Reavaliar um guia só se testes de uso mostrarem que a escolha por ocasião não basta.

As quatro ocasiões não se desdobram em outros três níveis. O serviço compartilha a base e varia os detalhes. A foto de Pedido usa uma referência compacta do acervo atual, sem as grandes letras “Marry me”. A imagem não é apresentada como foto de serviço já entregue nem como prova das inclusões. Para a versão comercial, a melhor próxima fotografia é a montagem real do kit de dois lugares, plaquinha pequena e buquê: enquadramento horizontal, conjunto completo e uma foto de detalhe. Evitar imagem de estrutura maior que a vendida.

## O que veio do arquivo enviado

- A Dois: R$ 349, casal; Pedido: R$ 549, casal.
- Celebrar/aniversário: R$ 399, de duas a quatro pessoas; inclui mini bolo, balões e plaquinha.
- Entre Amigas: R$ 349 para duas pessoas, até quatro. A referência abre com três participantes mas calcula +R$ 79 além de dois; nesta página abre com duas para o valor inicial não divergir.
- Pessoa adicional: R$ 79, respeitando os limites de cada ocasião.
- Tábua de frios R$ 149; fotos profissionais R$ 250; três instantâneas R$ 39; balões personalizados R$ 79; mais 30 minutos R$ 59.
- Duração-base: duas horas. Extensão: 2h30 no máximo. A extensão altera tanto o preço como o resumo, corrigindo a divergência do arquivo enviado que mantinha “2h” no total.

São valores do estudo recebido, não um recálculo de rentabilidade nem uma tabela comercial aprovada. Nenhum preço foi transferido para a home principal. O total da página é a soma dos itens do estudo; bebidas, locação e acesso especial ficam explicitamente fora. A proposta confirma o valor antes da reserva. Não repetir o “preço fechado / reservar agora” do anexo enquanto data, local, bebidas e custos ainda precisarem de confirmação.

A tábua é adicional, e o bolo já integra o aniversário. O arquivo não contém bebida como item ou adicional. A nova regra do usuário — não permitir alimentos nem bebidas próprios — aparece ao lado da alimentação, no FAQ e no resumo para o atendimento. Bebidas precisam ser combinadas na proposta, sem inventar preço ou afirmar que estão incluídas. Balões não são cobrados de novo como adicional no aniversário, pois já integram sua base. O texto não presume fornecedores licenciados nem prazo de fotos de 48h sem confirmação.

## Instagram: continuidade entre publicação e página

Bio genérica: abrir a home para dar contexto. Stories/reels sobre uma ocasião: link com ocasião pré-selecionada e âncora para o seletor. A página mantém o cabeçalho e permite subir para conhecer a marca. Não criar uma árvore de páginas de links que repete as quatro ocasiões.

Exemplo funcional no estudo:

`/home-proposta?ocasiao=pedido&utm_source=instagram&utm_medium=organic_social&utm_campaign=pedido_intimista&utm_content=story_buque#colecoes`

Outras ocasiões: `adois`, `celebrar` (aceita `aniversario`) e `amigas`. Valores desconhecidos não alteram a seleção. A primeira origem e a origem mais recente são mantidas somente na sessão do estudo; só UTMs conhecidas são consideradas. Não guardar telefone ou nomes nessa atribuição nem encaminhá-los ao GA4/Meta. Campanhas pagas precisam de convenção distinta e documentada.

Criativo e destino devem mostrar a mesma escala de montagem e inclusões. Priorizar conteúdo de propósito (quem celebrar e por quê), bastidor do cuidado e clareza prática. Se o anúncio mostra uma experiência compacta, não receber a pessoa com um “Marry me” monumental. Guardar conteúdos recorrentes em destaques: A Dois, Celebrar, Amigas, Pedido e Como funciona.

Eventos futuros úteis: `occasion_selected`, `proposal_configured`, `addon_changed`, `whatsapp_click`, `proposal_contact_requested`, `proposal_received`, `proposal_sent`, `booking_confirmed`. Tratar clique no WhatsApp como intenção, não como prova de mensagem enviada ou venda. Na produção atual, `whatsapp_click` também chama o evento padrão Meta `Lead`; isso merece migração planejada para não avaliar a nova jornada usando uma conversão diferente da anterior.

## O e-mail hoje

O `index.html` envia eventos ao Apps Script. O arquivo `docs/webhook-quiz-sheets.gs` contém a implementação documentada: grava os eventos e dispara e-mail somente em `lead_capture`, quando o formulário envia o telefone. `quiz_complete` e `whatsapp_click` não disparam esse alerta de contato. O site usa `fetch` com `mode: no-cors`; uma resposta opaca não comprova gravação na planilha ou entrega de e-mail.

Essas conclusões vêm do código no repositório. Não foi confirmado nesta tarefa que a implantação remota do Apps Script contém exatamente essa versão, e não foram enviados leads ou e-mails de teste.

## Fluxo recomendado para os leads

1. Caminho principal: cliente monta o pedido e abre o WhatsApp com a mensagem pronta. Não exigir telefone novamente para usar o aplicativo. Abrir o WhatsApp não revela ao site o número do cliente e não confirma que ele enviou a mensagem.
2. Caminho secundário: “Prefiro que vocês me chamem”, com WhatsApp e período para contato. Esse pedido explícito de contato gera o registro e o alerta por e-mail. Não exigir um endereço de e-mail do cliente só para avisar os sócios.
3. Criar uma referência de proposta antes da saída e incluí-la na mensagem e no registro. Na produção, o servidor deve validar ou emitir o identificador; o prefixo `SIM-` da página de estudo deixa evidente que não é proposta real.
4. E-mail aos destinatários atuais: referência, revisão, telefone quando fornecido, ocasião, participantes, duração, local/período, inclusões, adicionais, subtotal/pendências, política de alimentos, UTMs inicial/recente e próxima ação. Exemplo funcional está no diálogo da nova página, em “Prévia do alerta para a equipe”.
5. Mensagem já recebida no WhatsApp: conferir a referência e registrar o status manualmente nesta fase. Automatizar confirmação de recebimento só com uma integração oficial de mensagens que realmente observe esse evento.

### Atualização não é reenvio indiscriminado

Não é possível alterar retroativamente um e-mail já entregue. Atualizar a linha principal da proposta na planilha e, se necessário, enviar outro e-mail com o mesmo identificador e a revisão no assunto. A equipe deve consultar a versão vigente da proposta, não uma mensagem antiga como se ainda fosse atual.

Mudanças locais de ocasião/adicional não devem disparar e-mails. Disparar apenas quando a pessoa envia/atualiza explicitamente seu pedido de contato, ou quando houver mudança operacional relevante configurada. Usar chave de idempotência por `proposal_id + revision + event`, validar conteúdo e controlar concorrência (por exemplo, `LockService` no Apps Script) antes de gravar/enviar. Repetir uma requisição após falha não pode duplicar alertas.

Planilha sugerida: uma aba `Propostas` com estado atual por referência e uma aba `Eventos` para histórico. Preservar a aba antiga e compatibilidade com `lead_capture` durante uma migração; não substituir silenciosamente a captura do quiz antes de a home nova entrar em produção.

### Contrato de dados proposto

```
schema_version: 2
proposal_id, revision, event, source
occasion, guests, duration_minutes, place, period
included_detail
addons: [{id, name, estimated_amount}]
estimate: {currency, amount, status, excludes}
own_food_drink_allowed: false
phone, best_contact_period  // somente no pedido explícito de contato
attribution: {first_touch, last_touch}
```

Preço e inclusões devem ser recalculados/validados no servidor na implementação real; não confiar em valores enviados pelo navegador. Validar o telefone, limitar tamanho/frequência e neutralizar fórmulas em dados gravados no Sheets. Nunca enviar telefone, resumo livre ou outras informações pessoais como parâmetros de analytics.

Para confirmar recebimento na tela, será necessário um endpoint que responda de forma legível e confiável ao navegador, ou outra solução de confirmação efetiva. Com o fluxo opaco atual, mostrar apenas tentativa e alternativa pelo WhatsApp. Uma gravação confirmada e o envio do e-mail são estados distintos: se o e-mail falhar, preservar a proposta e registrar a falha para tratamento.

## Implementação desta entrega versus ativação

Implementado no estudo: seletor, fotos, limites, adicionais, soma, duração, regra de consumo próprio, resumo editável voltando ao formulário, link WhatsApp com marca de simulação, entrada por ocasião/UTM e prévia do alerta. Não há fetch, webhook, rastreador externo ou disparo real de e-mail. O telefone digitado na simulação fica apenas em memória/DOM e não é persistido.

A ativação comercial depende de validar preços/escopo e aplicar as mudanças de integração em uma tarefa de produção. Atualizar um `.gs` no Git não publica por si só uma nova implantação no Google Apps Script. Esta entrega não alterou esse serviço.

## Revisão responsiva após avaliação visual

O seletor passa a vir após a abertura, antes de Como funciona. Inclusões e adicionais usam detalhes expansíveis nativos, sem transformar a seleção em quiz. O aviso sobre consumo próprio permanece visível. O valor, a quantidade e a duração acompanham o botão de revisão em uma barra inferior enquanto o configurador está em uso; a barra desaparece no diálogo e fora desse trecho. O WhatsApp flutuante não compete com ela.

Desktop: foto e configuração lado a lado. Mobile/tablet: foto compacta e campos Pessoas/Período na mesma linha, Local em largura completa. Controles têm 48 px de altura e texto de 16 px; a grade não estica os selects conforme a ajuda de outro campo. A área de configuração de Pedido, inicialmente fechada em 390 px, passou de aproximadamente 2.584 para 1.176 px (cerca de 54% menor). É redução de altura observada, não medição de conversão ou teste com usuários.

Validação inclui 320, 390, 768 e 1440 px, além de 844 × 390 na horizontal, em Chromium e WebKit. Adicionais, totais, limite de duração e prévia do contato mantêm o mesmo funcionamento.
