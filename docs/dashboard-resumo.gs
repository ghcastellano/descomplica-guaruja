/**
 * DESCOMPLICA GUARUJÁ — Dashboard de Leads (layout premium)
 * ──────────────────────────────────────────────────────────
 * COMO USAR (1 minuto):
 * 1. Abra a planilha "Descomplica — Resumo de Leads"
 * 2. Extensões → Apps Script → apague tudo e cole este arquivo
 * 3. Selecione a função "criarDashboard" no dropdown → Executar → autorize
 * 4. Volte para a planilha: dashboard pronto, dados técnicos ocultos
 *
 * Pode rodar de novo quando quiser — ele reconstrói do zero.
 */

const LEADS_ID = '1R-f9evkwlL6tVs_XdnazG_-wex7DnvIDpjQyEefE4w8';

// paleta da marca
const PETROL = '#1F4E54', PETROL_DEEP = '#143438', CREAM = '#F4EDE4',
      SAND = '#E7D8C5', TERRACOTTA = '#C8765A', GOLD = '#C9A24B',
      INK = '#2B2B2B', MUTED = '#7A736B', WHITE = '#FFFFFF';

function criarDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  /* TRAVA DE SEGURANÇA: nunca rodar dentro da planilha de leads (apagaria os dados!) */
  if (ss.getId() === LEADS_ID) {
    throw new Error('PARE: este script foi colado na planilha de LEADS. ' +
      'Cole-o no Apps Script da planilha "Descomplica — Resumo de Leads".');
  }

  /* localidade en-US: garante que as fórmulas (sintaxe com vírgula) sejam aceitas */
  ss.setSpreadsheetLocale('en_US');
  SpreadsheetApp.flush();

  /* ── aba de dados (oculta) ── */
  let dados = ss.getSheetByName('dados');
  if (dados) ss.deleteSheet(dados);
  dados = ss.insertSheet('dados');
  dados.getRange('A1').setFormula(`=IMPORTRANGE("${LEADS_ID}","Leads Quiz!A1:P5000")`);
  // R = data como número de série (para filtros por período)
  dados.getRange('R2').setFormula('=ARRAYFORMULA(IFERROR(DATEVALUE(LEFT(A2:A5000,10)),0))');
  SpreadsheetApp.flush();

  /* ── dashboard ── */
  let dash = ss.getSheetByName('Dashboard');
  if (dash) ss.deleteSheet(dash);
  dash = ss.insertSheet('Dashboard', 0);

  // fundo geral + grade
  dash.setHiddenGridlines(true);
  dash.getRange('A1:N40').setBackground(CREAM).setFontFamily('Jost').setFontColor(INK);
  dash.setColumnWidth(1, 22);
  dash.setColumnWidths(2, 12, 88);
  dash.setColumnWidth(14, 22);

  /* título */
  dash.setRowHeight(2, 38);
  merge(dash, 'B2:M2').setValue('Descomplica Guarujá')
    .setFontSize(22).setFontWeight('bold').setFontColor(PETROL).setFontFamily('Playfair Display');
  merge(dash, 'B3:M3').setValue('Painel de leads · atualiza sozinho a partir da planilha de leads')
    .setFontSize(10).setFontStyle('italic').setFontColor(MUTED);

  /* cartões KPI */
  const kpis = [
    ['B', 'C', '=COUNTIF(dados!B:B,"quiz_start")',                 'QUIZ INICIADOS'],
    ['E', 'F', '=COUNTIF(dados!B:B,"quiz_complete")',              'QUIZ COMPLETADOS'],
    ['H', 'I', '=COUNTIF(dados!B:B,"whatsapp_click")',             'CLIQUES WHATSAPP'],
    ['K', 'L', '=IF(COUNTIF(dados!B:B,"quiz_complete")=0,"—",TEXT(COUNTIF(dados!B:B,"whatsapp_click")/COUNTIF(dados!B:B,"quiz_complete"),"0%"))', 'TAXA QUIZ → WHATSAPP']
  ];
  dash.setRowHeight(5, 52);
  dash.setRowHeight(6, 22);
  kpis.forEach(([c1, c2, f, label]) => {
    const card = dash.getRange(`${c1}5:${c2}6`);
    card.setBackground(WHITE).setBorder(true, true, true, true, false, false, SAND, SpreadsheetApp.BorderStyle.SOLID);
    merge(dash, `${c1}5:${c2}5`).setFormula(f)
      .setFontSize(26).setFontWeight('bold').setFontColor(PETROL)
      .setHorizontalAlignment('center').setVerticalAlignment('middle').setBackground(WHITE);
    merge(dash, `${c1}6:${c2}6`).setValue(label)
      .setFontSize(8).setFontColor(MUTED).setHorizontalAlignment('center').setBackground(WHITE);
  });

  /* últimos 7 dias */
  secao(dash, 8, 'ÚLTIMOS 7 DIAS');
  const seteDias = [
    ['B9', 'Iniciados',          'C9', '=COUNTIFS(dados!B:B,"quiz_start",dados!R:R,">="&(TODAY()-7))'],
    ['E9', 'Completados',        'F9', '=COUNTIFS(dados!B:B,"quiz_complete",dados!R:R,">="&(TODAY()-7))'],
    ['H9', 'Cliques WA',         'I9', '=COUNTIFS(dados!B:B,"whatsapp_click",dados!R:R,">="&(TODAY()-7))'],
    ['K9', 'Telefones', 'L9', '=COUNTIF(dados!B:B,"lead_capture")']
  ];
  dash.setRowHeight(9, 30);
  seteDias.forEach(([lc, label, vc, f]) => {
    dash.getRange(lc).setValue(label).setFontSize(10).setFontColor(MUTED);
    dash.getRange(vc).setFormula(f).setFontSize(14).setFontWeight('bold').setFontColor(TERRACOTTA);
  });

  /* por ocasião, com barras */
  secao(dash, 11, 'POR OCASIÃO  ·  quiz completados');
  const ocasioes = [['A Dois', 'adois'], ['Celebrar', 'celebrar'], ['Entre Amigas', 'amigas'], ['Pedido', 'pedido']];
  ocasioes.forEach(([nome, chave], i) => {
    const r = 12 + i;
    dash.setRowHeight(r, 24);
    dash.getRange(`B${r}`).setValue(nome).setFontSize(11);
    dash.getRange(`C${r}`).setFormula(`=COUNTIFS(dados!B:B,"quiz_complete",dados!C:C,"${chave}")`)
      .setFontWeight('bold').setFontColor(PETROL).setHorizontalAlignment('center');
    merge(dash, `D${r}:G${r}`).setFormula(
      `=IFERROR(SPARKLINE(C${r},{"charttype","bar";"max",MAX($C$12:$C$15,1);"color1","${TERRACOTTA}"}),"")`);
  });

  /* preferências: investimento e horário */
  secao(dash, 17, 'PREFERÊNCIAS  ·  quiz completados');
  dash.getRange('B18').setValue('Investimento').setFontSize(10).setFontColor(MUTED);
  dash.getRange('C18').setFormula(
    `=IFERROR(TRANSPOSE(QUERY(dados!A2:H5000,"select G, count(B) where B='quiz_complete' group by G label G '', count(B) ''",0)),"—")`);
  dash.getRange('B20').setValue('Horário').setFontSize(10).setFontColor(MUTED);
  dash.getRange('C20').setFormula(
    `=IFERROR(TRANSPOSE(QUERY(dados!A2:H5000,"select H, count(B) where B='quiz_complete' group by H label H '', count(B) ''",0)),"—")`);
  dash.getRange('C18:M21').setHorizontalAlignment('center');
  dash.getRange('C18:M18').setFontWeight('bold').setFontColor(PETROL);
  dash.getRange('C20:M20').setFontWeight('bold').setFontColor(PETROL);

  /* origem (UTM) */
  secao(dash, 23, 'ORIGEM DO TRÁFEGO  ·  utm_source');
  dash.getRange('C24').setFormula(
    `=IFERROR(TRANSPOSE(QUERY(dados!A2:L5000,"select L, count(B) where L is not null and L<>'' group by L label L '', count(B) ''",0)),"ainda sem UTM — use os links etiquetados (docs/links-utm.md)")`);
  dash.getRange('C24:M24').setFontWeight('bold').setFontColor(PETROL);
  dash.getRange('C24:M25').setHorizontalAlignment('center');
  dash.getRange('C24').setHorizontalAlignment('left');

  /* semana a semana */
  secao(dash, 27, 'SEMANA A SEMANA  ·  completados | cliques WhatsApp');
  dash.setRowHeight(28, 30);
  dash.getRange('B28').setValue('Esta semana').setFontSize(10).setFontColor(MUTED);
  dash.getRange('C28').setFormula(
    '=COUNTIFS(dados!B:B,"quiz_complete",dados!R:R,">="&(TODAY()-WEEKDAY(TODAY(),2)+1))&"  |  "&COUNTIFS(dados!B:B,"whatsapp_click",dados!R:R,">="&(TODAY()-WEEKDAY(TODAY(),2)+1))')
    .setFontSize(13).setFontWeight('bold').setFontColor(PETROL);
  dash.getRange('F28').setValue('Semana passada').setFontSize(10).setFontColor(MUTED);
  dash.getRange('G28').setFormula(
    '=COUNTIFS(dados!B:B,"quiz_complete",dados!R:R,">="&(TODAY()-WEEKDAY(TODAY(),2)-6),dados!R:R,"<"&(TODAY()-WEEKDAY(TODAY(),2)+1))&"  |  "&COUNTIFS(dados!B:B,"whatsapp_click",dados!R:R,">="&(TODAY()-WEEKDAY(TODAY(),2)-6),dados!R:R,"<"&(TODAY()-WEEKDAY(TODAY(),2)+1))')
    .setFontSize(13).setFontWeight('bold').setFontColor(MUTED);

  /* CONTATOS PARA CHAMAR — extrai telefone/horário do JSON (coluna P = payload_bruto) */
  secao(dash, 31, '📞 CONTATOS PARA CHAMAR  ·  quem deixou o WhatsApp');
  dash.getRange('B32:G32').setValues([['Data', 'Telefone', 'Melhor horário', 'Ocasião', 'Pacote', 'Origem']])
    .setFontWeight('bold').setFontColor(PETROL).setFontSize(10).setBackground('#EFE5D6');
  dash.getRange('B33').setFormula(
    '=IFERROR(QUERY({' +
      'ARRAYFORMULA(IF(dados!A2:A5000="","",MID(dados!A2:A5000,9,2)&"/"&MID(dados!A2:A5000,6,2)&" "&MID(dados!A2:A5000,12,5))),' +
      'ARRAYFORMULA(IFERROR(REGEXEXTRACT(dados!P2:P5000,"""phone"":""([^""]+)"""),"")),' +
      'ARRAYFORMULA(IFERROR(REGEXEXTRACT(dados!P2:P5000,"""best_time"":""([^""]+)"""),"")),' +
      'dados!C2:C5000,dados!I2:I5000,dados!L2:L5000,dados!B2:B5000},' +
      '"select Col1,Col2,Col3,Col4,Col5,Col6 where Col7=\'lead_capture\' order by Col1 desc",0),' +
      '"Nenhum contato deixado ainda — aparece aqui quando alguém preenche o WhatsApp no quiz.")');
  dash.getRange('B32:G32').setHorizontalAlignment('center');

  /* rodapé */
  merge(dash, 'B45:M45').setValue('Você vive o momento. A gente cuida dos detalhes.')
    .setFontSize(9).setFontStyle('italic').setFontColor(GOLD).setHorizontalAlignment('center');

  /* limpeza final */
  dados.hideSheet();
  ss.getSheets().forEach(s => {
    const n = s.getName();
    if (n !== 'Dashboard' && n !== 'dados') ss.deleteSheet(s);
  });
  ss.setSpreadsheetTheme(ss.getPredefinedSpreadsheetThemes ? ss.getSpreadsheetTheme() : null);
}

/** Permite disparar o dashboard pela URL do App da Web (acessar /exec no navegador).
 *  Com ?diag=1 retorna diagnóstico em vez de recriar. */
function doGet(e) {
  if (e && e.parameter && e.parameter.diag) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const dash = ss.getSheetByName('Dashboard');
    const dados = ss.getSheetByName('dados');
    const out = {
      locale: ss.getSpreadsheetLocale(),
      sheets: ss.getSheets().map(s => s.getName()),
      kpi_completados: dash ? { formula: dash.getRange('E5').getFormula(), display: dash.getRange('E5').getDisplayValue() } : null,
      dados_A1: dados ? { formula: dados.getRange('A1').getFormula(), display: dados.getRange('A1').getDisplayValue(), B2: dados.getRange('B2').getDisplayValue() } : null
    };
    return ContentService.createTextOutput(JSON.stringify(out, null, 2));
  }
  criarDashboard();
  return ContentService.createTextOutput('✓ Dashboard criado com sucesso! Pode fechar esta aba e abrir a planilha.');
}

/* helpers */
function merge(sh, a1) {
  const r = sh.getRange(a1);
  r.merge();
  return r;
}
function secao(sh, row, titulo) {
  sh.setRowHeight(row, 26);
  sh.getRange(row, 2, 1, 12).merge()
    .setValue(titulo)
    .setBackground(PETROL).setFontColor(WHITE).setFontWeight('bold')
    .setFontSize(10).setVerticalAlignment('middle');
}
