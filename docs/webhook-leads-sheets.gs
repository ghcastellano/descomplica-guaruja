/**
 * DESCOMPLICA GUARUJÁ — Webhook de propostas → Google Sheets + e-mail
 * ─────────────────────────────────────────────────────────────────
 * INSTALAÇÃO (5 min):
 * 1. Crie a planilha "Descomplica — Leads" no Google Sheets
 * 2. Extensões > Apps Script → cole este arquivo inteiro
 * 3. Ajuste EMAIL_DESTINO abaixo
 * 4. Implantar > Nova implantação > App da Web → Executar como: você · Acesso: Qualquer pessoa
 * 5. Copie a URL /exec e cole em WEBHOOK_URL no site
 * 6. Execute uma vez a função `setup` (menu Executar) para criar a aba, o cabeçalho e o menu de status
 *
 * O site envia 1 POST por clique em "Receber proposta no WhatsApp" com ID (ex.: DG-20261011-K7Q).
 * O mesmo ID vai na mensagem do WhatsApp → você casa a conversa com a linha da planilha.
 */

const EMAIL_DESTINO = 'ola@descomplicaguaruja.com.br';   // ← quem recebe o aviso
const SHEET = 'Leads';
const STATUS = ['novo', 'respondido', 'proposta enviada', 'sinal pago', 'agendado', 'realizado', 'perdido'];
const HEADERS = ['id','data_hora','status','nome','ocasiao','pessoas','horario','data_desejada','adicionais','total','utm_source','utm_medium','utm_campaign','utm_content','pagina','observacoes'];

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const u = d.utm || {};
    const sh = getSheet_();
    sh.appendRow([
      d.id || '', d.ts || new Date().toISOString(), 'novo',
      d.nome || '', d.ocasiao || '', d.pessoas || '', d.horario || '', d.data_desejada || '',
      d.adicionais || '', d.total || '', u.utm_source || '', u.utm_medium || '', u.utm_campaign || '', u.utm_content || '', d.pagina || '', ''
    ]);
    notificar_(d, u);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    (ss.getSheetByName('Erros') || ss.insertSheet('Erros')).appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : '']);
    return ContentService.createTextOutput('error');
  }
}

/** E-mail imediato com o resumo da proposta */
function notificar_(d, u) {
  const origem = u.utm_source ? `${u.utm_source}/${u.utm_medium || ''} ${u.utm_content || ''}`.trim() : 'direto';
  const assunto = `🌅 Nova proposta ${d.id} — ${d.ocasiao} · ${d.pessoas} pessoas · R$ ${d.total}`;
  const corpo = [
    `Nome: ${d.nome || '(não informou)'}`,
    `Ocasião: ${d.ocasiao}`,
    `Pessoas: ${d.pessoas}`,
    `Horário: ${d.horario}`,
    `Data desejada: ${d.data_desejada || '(não informou)'}`,
    `Adicionais: ${d.adicionais || 'nenhum'}`,
    `Total: R$ ${d.total}`,
    `Origem: ${origem}`,
    ``,
    `A pessoa está abrindo o WhatsApp agora com a referência ${d.id}.`,
    `Planilha: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`
  ].join('\n');
  MailApp.sendEmail(EMAIL_DESTINO, assunto, corpo);
}

/** Cria aba, cabeçalho formatado e dropdown de status na coluna C */
function setup() {
  const sh = getSheet_();
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).setAllowInvalid(false).build();
  sh.getRange(2, 3, 1000, 1).setDataValidation(rule);
  // cores por status (regras de formatação condicional)
  const cores = { 'novo':'#FDE68A', 'proposta enviada':'#BFDBFE', 'sinal pago':'#BBF7D0', 'agendado':'#A7F3D0', 'realizado':'#E5E7EB', 'perdido':'#FECACA' };
  const rules = Object.keys(cores).map(s =>
    SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(cores[s]).setRanges([sh.getRange(2, 3, 1000, 1)]).build());
  sh.setConditionalFormatRules(rules);
  sh.setColumnWidth(1, 150); sh.setColumnWidth(4, 160); sh.setColumnWidth(9, 260);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEADERS); sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#1F4E54').setFontColor('#FFFFFF');
  }
  return sh;
}

/** Lembrete diário (opcional): leads "novo" há mais de 2h sem resposta.
 *  Para ativar: Acionadores > adicionar > função lembreteNovos > baseado em tempo > a cada hora */
function lembreteNovos() {
  const sh = getSheet_(); const rows = sh.getDataRange().getValues(); const agora = Date.now();
  const atrasados = rows.slice(1).filter(r => r[2] === 'novo' && agora - new Date(r[1]).getTime() > 2 * 3600 * 1000);
  if (!atrasados.length) return;
  MailApp.sendEmail(EMAIL_DESTINO, `⏰ ${atrasados.length} proposta(s) sem resposta há mais de 2h`,
    atrasados.map(r => `${r[0]} · ${r[3] || 'sem nome'} · ${r[4]} · R$ ${r[9]}`).join('\n'));
}

/** Teste manual */
function testePost() {
  doPost({ postData: { contents: JSON.stringify({ id:'DG-TESTE-001', ts:new Date().toISOString(), nome:'Teste', ocasiao:'Pedido', pessoas:2, horario:'sol', data_desejada:'25/10', adicionais:'Registro fotográfico (30 min)', total:698, utm:{utm_source:'instagram',utm_medium:'reels',utm_content:'reel03'}, pagina:'https://descomplicaguaruja.com.br/?ocasiao=pedido' }) } });
}
