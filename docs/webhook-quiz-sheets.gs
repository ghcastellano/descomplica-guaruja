/**
 * DESCOMPLICA GUARUJÁ — Webhook Quiz → Google Sheets
 * ───────────────────────────────────────────────────
 * COMO INSTALAR (5 minutos):
 * 1. Crie uma planilha no Google Sheets chamada "Descomplica — Leads"
 * 2. Menu Extensões > Apps Script → apague tudo e cole este arquivo
 * 3. Botão "Implantar" > Nova implantação > tipo "App da Web"
 *    - Executar como: Você
 *    - Quem pode acessar: "Qualquer pessoa"
 * 4. Autorize, copie a URL gerada (termina em /exec)
 * 5. Cole a URL na constante WEBHOOK_URL no topo do <script> do index.html
 *
 * O site envia eventos 'quiz_complete' e 'whatsapp_click' — cada um vira
 * uma linha na aba "Leads Quiz", com UTMs para você saber de qual Reel veio.
 */

const SHEET_NAME = 'Leads Quiz';
const HEADERS = [
  'data_hora', 'evento',
  'ocasiao', 'pessoas', 'clima', 'fotos', 'investimento', 'horario',
  'recomendacao', 'origem_clique', 'pacote',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
  'payload_bruto'
];

/* HACK #4 — alerta na hora: e-mail quando alguém deixa o WhatsApp no quiz.
   Troque pelo seu e-mail se quiser (deixe '' para desligar o alerta). */
const ALERT_EMAIL = 'ghcastellano@gmail.com';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = getSheet_();
    const a = data.answers || {};
    const u = data.utm || {};

    sh.appendRow([
      data.ts || new Date().toISOString(),
      data.event || '',
      a.ocasiao || '', a.pessoas || '', a.clima || '', a.fotos || '',
      a.budget || '', a.horario || '',
      data.result || '',
      data.source || '', data.pkg || '',
      u.utm_source || '', u.utm_medium || '', u.utm_campaign || '', u.utm_content || '',
      JSON.stringify(data)
    ]);

    /* HACK #4 — dispara alerta só quando alguém deixa o telefone (lead quente) */
    if (data.event === 'lead_capture' && ALERT_EMAIL) {
      enviarAlerta_(data, a, u);
    }

    return ContentService.createTextOutput('ok');
  } catch (err) {
    // Registra o erro numa aba separada para depuração
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const log = ss.getSheetByName('Erros') || ss.insertSheet('Erros');
      log.appendRow([new Date(), String(err), e && e.postData ? e.postData.contents : '']);
    } catch (_) {}
    return ContentService.createTextOutput('error');
  }
}

/* HACK #4 — monta e envia o e-mail de lead quente */
function enviarAlerta_(data, a, u) {
  try {
    const fone = data.phone || '';
    const foneLimpo = ('55' + String(fone).replace(/[^0-9]/g, ''));
    const msg = encodeURIComponent('Oi! Vi que você montou seu piquenique no site do Descomplica Guarujá. Posso te ajudar a reservar sua data?');
    const waLink = 'https://wa.me/' + foneLimpo + '?text=' + msg;
    const origem = u.utm_source ? (u.utm_source + (u.utm_medium ? ' / ' + u.utm_medium : '')) : 'direto';
    const corpo =
      '🌅 Novo lead deixou o WhatsApp no quiz!\n\n' +
      '📱 Telefone: ' + fone + '\n' +
      '⏰ Melhor horário: ' + (data.best_time || '—') + '\n' +
      '🎀 Ocasião: ' + (a.ocasiao || '—') + '\n' +
      '📦 Pacote recomendado: ' + (data.result || '—') + '\n' +
      '💰 Investimento: ' + (a.budget || '—') + '\n' +
      '📍 Origem: ' + origem + '\n\n' +
      '👉 Chamar agora no WhatsApp:\n' + waLink + '\n\n' +
      '— Responda rápido: leads contatados em minutos têm muito mais chance de fechar.';
    MailApp.sendEmail(ALERT_EMAIL, '🔥 Novo lead — ' + fone + ' (' + (a.ocasiao || 'quiz') + ')', corpo);
  } catch (_) {}
}

/** Garante que a aba existe com cabeçalho formatado */
function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#1F4E54')
      .setFontColor('#FFFFFF');
  }
  return sh;
}

/**
 * ABA RESUMO — rodar UMA vez: selecione "criarAbaResumo" no menu de funções e clique Executar.
 * Cria a aba com métricas automáticas (atualizam sozinhas conforme chegam leads).
 */
function criarAbaResumo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('Resumo');
  if (sh) ss.deleteSheet(sh);
  sh = ss.insertSheet('Resumo', 0);

  const L = "'Leads Quiz'";
  // helper: data como número de série a partir do texto ISO (col A)
  const DT = `ARRAYFORMULA(IF(${L}!A2:A="",0,DATEVALUE(LEFT(${L}!A2:A,10))))`;

  const rows = [
    ['DESCOMPLICA GUARUJÁ — RESUMO DE LEADS', ''],
    ['', ''],
    ['FUNIL (total)', ''],
    ['Quiz iniciados',        `=COUNTIF(${L}!B:B,"quiz_start")`],
    ['Quiz completados',      `=COUNTIF(${L}!B:B,"quiz_complete")`],
    ['Cliques no WhatsApp',   `=COUNTIF(${L}!B:B,"whatsapp_click")`],
    ['Taxa conclusão do quiz',`=IFERROR(B5/B4,"—")`],
    ['Taxa quiz → WhatsApp',  `=IFERROR(B6/B5,"—")`],
    ['', ''],
    ['ÚLTIMOS 7 DIAS', ''],
    ['Quiz iniciados',        `=SUMPRODUCT((${L}!B2:B="quiz_start")*(${DT}>=TODAY()-7))`],
    ['Quiz completados',      `=SUMPRODUCT((${L}!B2:B="quiz_complete")*(${DT}>=TODAY()-7))`],
    ['Cliques no WhatsApp',   `=SUMPRODUCT((${L}!B2:B="whatsapp_click")*(${DT}>=TODAY()-7))`],
    ['', ''],
    ['POR OCASIÃO (quiz completados)', ''],
    ['A Dois',        `=COUNTIFS(${L}!B:B,"quiz_complete",${L}!C:C,"adois")`],
    ['Celebrar',      `=COUNTIFS(${L}!B:B,"quiz_complete",${L}!C:C,"celebrar")`],
    ['Entre Amigas',  `=COUNTIFS(${L}!B:B,"quiz_complete",${L}!C:C,"amigas")`],
    ['Pedido',        `=COUNTIFS(${L}!B:B,"quiz_complete",${L}!C:C,"pedido")`],
    ['', ''],
    ['POR INVESTIMENTO (quiz completados)', ''],
    ['(valores únicos automáticos) →', `=TRANSPOSE(QUERY(${L}!A2:H,"select G, count(B) where B='quiz_complete' group by G label G ''",0))`],
    ['', ''],
    ['POR HORÁRIO (quiz completados)', ''],
    ['(valores únicos automáticos) →', `=TRANSPOSE(QUERY(${L}!A2:H,"select H, count(B) where B='quiz_complete' group by H label H ''",0))`],
    ['', ''],
    ['POR ORIGEM (utm_source, todos os eventos)', ''],
    ['(valores únicos automáticos) →', `=TRANSPOSE(QUERY(${L}!A2:L,"select L, count(B) where L is not null and L<>'' group by L label L ''",0))`],
    ['', ''],
    ['POR SEMANA (quiz completados | cliques WhatsApp)', ''],
    ['Esta semana',   `=SUMPRODUCT((${L}!B2:B="quiz_complete")*(${DT}>=TODAY()-WEEKDAY(TODAY(),2)+1)) & " | " & SUMPRODUCT((${L}!B2:B="whatsapp_click")*(${DT}>=TODAY()-WEEKDAY(TODAY(),2)+1))`],
    ['Semana passada',`=SUMPRODUCT((${L}!B2:B="quiz_complete")*(${DT}>=TODAY()-WEEKDAY(TODAY(),2)-6)*(${DT}<TODAY()-WEEKDAY(TODAY(),2)+1)) & " | " & SUMPRODUCT((${L}!B2:B="whatsapp_click")*(${DT}>=TODAY()-WEEKDAY(TODAY(),2)-6)*(${DT}<TODAY()-WEEKDAY(TODAY(),2)+1))`]
  ];

  rows.forEach((r, i) => {
    sh.getRange(i + 1, 1).setValue(r[0]);
    if (r[1]) {
      const cell = sh.getRange(i + 1, 2);
      r[1].startsWith('=') ? cell.setFormula(r[1]) : cell.setValue(r[1]);
    }
  });

  // formatação
  sh.getRange('A1').setFontWeight('bold').setFontSize(14).setFontColor('#1F4E54');
  [3, 10, 15, 21, 24, 27, 30].forEach(r =>
    sh.getRange(r, 1, 1, 2).setFontWeight('bold').setBackground('#1F4E54').setFontColor('#FFFFFF'));
  sh.getRange('B7:B8').setNumberFormat('0.0%');
  sh.setColumnWidth(1, 320);
  sh.setColumnWidth(2, 160);
}

/** Teste manual: Executar > testePreenchimento (cria uma linha de exemplo) */
function testePreenchimento() {
  const fake = {
    postData: {
      contents: JSON.stringify({
        event: 'quiz_complete',
        ts: new Date().toISOString(),
        result: 'adois_ass',
        answers: { ocasiao: 'adois', pessoas: '2', clima: 'intimista', fotos: 'talvez', budget: '1200', horario: 'por do sol' },
        utm: { utm_source: 'instagram', utm_medium: 'reels', utm_campaign: 'lancamento', utm_content: 'reel01' }
      })
    }
  };
  doPost(fake);
}
