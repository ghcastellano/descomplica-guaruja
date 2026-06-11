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
