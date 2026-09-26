const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root,name),'utf8');
const html = read('index.html');
for (const name of ['index.html','visao.html','resumo-executivo.html','parceria-pousadas.html','cultura-setur.html','404.html']) {
  const source = read(name);
  assert(!/piquenique/i.test(source), `${name}: posicionamento antigo`);
  assert(!/(?:href|src)=["']\/(?:celebracoes|parceiros|painel|proposta|app\.css)(?:["'?#/])/i.test(source), `${name}: módulo retirado`);
  for (const m of source.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(m[1].includes('application/ld+json')) JSON.parse(m[2]);
    else if(m[2].trim()) new vm.Script(m[2], {filename:name});
  }
  for (const m of source.matchAll(/(?:src|href)=["'](\/[^"']*)["']/g)) {
    const file = m[1].split(/[?#]/)[0];
    if (file === '/') continue;
    assert(fs.existsSync(path.join(root,file)) || fs.existsSync(path.join(root,file+'.html')), `${name}: arquivo ausente ${file}`);
  }
}
new vm.Script(read('deck.js'));
const prices = JSON.parse(html.match(/const PRICE_ESTIMATES = (.*);/)[1]);
const model = JSON.parse(read('docs/precificacao-2026-09.json'));
assert.equal(Object.keys(prices).length,11);
for (const [key, pkg] of Object.entries(model.packages)) {
  assert.deepEqual(Object.keys(prices[key]).map(Number),key.startsWith('adois') ? [2] : [2,3,4,5,6,7,8]);
  for(const row of pkg.rows) {
    assert.deepEqual(prices[key][row.guests],[row.low,row.high]);
    assert(row.high > row.low && row.modeledResult > 0);
    assert(Math.abs(Object.values(row.costs).reduce((a,b)=>a+b,0) - row.operatingCost) < .011);
  }
  if(pkg.rows.length>1) {
    assert(pkg.rows[6].low>pkg.rows[0].low);
    assert(pkg.rows[6].low<pkg.rows[0].low*4,'estrutura compartilhada deve reduzir custo médio entre 2 e 8');
  }
}
for (const name of ['visao','resumo-executivo','parceria-pousadas','cultura-setur']) {
 assert(read(name+'.html').includes('content="noindex'));
 assert(read(name+'.html').includes('deck.css?v=20260925-2'));
}
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,1);
assert(!/piquenique/i.test(read('llms.txt')));
for(const name of ['celebracoes.html','parceiros.html','painel.html','proposta.html','app.css']) assert(!fs.existsSync(path.join(root,name)));
JSON.parse(read('vercel.json'));
console.log('OK: scripts, assets, SEO, 11 pacotes/59 estimativas, custos e retirada da expansão.');
