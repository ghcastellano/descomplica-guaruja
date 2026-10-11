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
// Modelo de oferta atual: 4 ocasiões com valor fechado, + R$ 79 por pessoa (até 4), extras fixos.
const oc = Object.fromEntries([...html.matchAll(/^ (adois|aniversario|amigas|pedido):\{.*?preco:(\d+).*?max:(\d)/gm)].map(m=>[m[1],{preco:+m[2],max:+m[3]}]));
assert.deepEqual(oc,{adois:{preco:349,max:2},aniversario:{preco:399,max:8},amigas:{preco:349,max:8},pedido:{preco:549,max:8}});
assert(html.includes('const PESSOA_EXTRA=79'));
assert.equal((html.match(/\{id:'[a-z]+',nome:'[^']+',preco:\d+\}/g)||[]).length,7,'7 extras');
for (const banido of ['#quiz','7 perguntas','Estimativa','estimativa']) assert(!html.includes(banido),`index.html: ${banido}`);
const ld = JSON.parse(html.match(/<script type="application\/ld\+json">\n(\{[\s\S]*?"@type": "LocalBusiness"[\s\S]*?)\n<\/script>/)[1]);
assert.equal(ld.hasOfferCatalog.itemListElement.length,4);
assert(['adois','aniversario','amigas','pedido'].every(s=>read('vercel.json').includes(`"/${s}"`)));
for (const name of ['visao','resumo-executivo','parceria-pousadas','cultura-setur']) {
 assert(read(name+'.html').includes('content="noindex'));
 assert(read(name+'.html').includes('deck.css?v=20260926-1'));
}
assert.equal((read('sitemap.xml').match(/<loc>/g)||[]).length,1);
assert(!/piquenique/i.test(read('llms.txt')));
for(const name of ['celebracoes.html','parceiros.html','painel.html','proposta.html','app.css']) assert(!fs.existsSync(path.join(root,name)));
for(const name of ['prototipos','prototipos-claude','laboratorio-home.html','home-completa-tabs.html','home-completa-linha.html']) assert(!fs.existsSync(path.join(root,name)),`protótipo ainda publicado: ${name}`);
JSON.parse(read('vercel.json'));
console.log('OK: scripts, assets, SEO, 4 ocasiões com valor fechado, extras e sem protótipos.');

// Brand primitives must have one source; every public page consumes it.
for (const name of ['index','visao','resumo-executivo','parceria-pousadas','cultura-setur','404']) {
 const source=read(name+'.html');
 for(const css of ['tokens','fonts','components']) assert(source.includes(`/design-system/${css}.css?v=1`),`${name}: base visual ausente`);
 assert(!source.includes('@font-face'),`${name}: declaração de fonte duplicada`);
 assert(!/--(?:cream|petrol|f-serif)\s*:/.test(source),`${name}: token de marca duplicado`);
}
assert(!/--(?:cream|petrol|f-serif)\s*:/.test(read('deck.css')));
const tokens=read('design-system/tokens.css');
assert(tokens.includes('--tracking-heading:0'));
assert(/class="[^"]*\blocal-value\b[^"]*\bgrid3\b/.test(read('cultura-setur.html')));
assert(html.includes('id="segOc"') && html.includes('id="xpSum"') && html.includes('id="xpBar"'));
assert(html.includes("const ORIGEM") && html.includes("gtag('event', event"));
console.log('OK: design system compartilhado e seção de experiências em 1 toque.');
