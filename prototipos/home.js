/* Simulação local: sem analytics, webhook, cadastro ou envio de mensagens. */
(() => {
'use strict';
const variant=document.body.dataset.variant;
const purposes={
 adois:{name:'Um encontro a dois',short:'A Dois',desc:'Um tempo só de vocês. Sem precisar de uma data especial.',title:'Um tempo só de vocês.',img:'hero-experiencia-por-do-sol-card-800',detail:'Cartão com a sua mensagem',range:[0,0]},
 aniversario:{name:'Um aniversário',short:'Aniversário',desc:'Uma nova volta ao sol, perto de quem importa.',title:'Um aniversário com significado.',img:'experiencia-flores-card-800',detail:'Mini bolo para compartilhar',range:[100,160]},
 amigos:{name:'Reunir pessoas queridas',short:'Um encontro',desc:'Amigas, amigos, família. O motivo é estar junto.',title:'A melhor parte é estar junto.',img:'experiencia-boho-praia-card-800',detail:'Cartão com a mensagem do grupo',range:[0,0]},
 pedido:{name:'Um pedido especial',short:'Pedido',desc:'Um grande sim pode começar com um gesto simples.',title:'Um pedido que tem a história de vocês.',img:'pedido-casamento-praia-card-800',detail:'Buquê de tamanho padrão',range:[180,280]},
 ajuda:{name:'Quero ajuda para escolher',short:'Vamos conversar',title:'Vamos encontrar uma ideia juntos.',detail:'Detalhe a combinar',range:[0,0]}
};
const places={praia:'Praia · ponto e condições a confirmar',turistico:'Ponto turístico · viabilidade a confirmar',casa:'Casa ou condomínio · com concordância do responsável',hospedagem:'Minha hospedagem · com concordância do responsável',ajuda:'Preciso de ajuda com o local'};
let state={purpose:variant==='C'?'adois':null,guests:variant==='C'?2:null,place:'',detail:true,note:'',step:0};
const money=n=>'R$ '+n.toLocaleString('pt-BR');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function estimate(){
 if(!state.purpose || state.purpose==='ajuda' || state.guests>4 || !state.guests)return null;
 const mod=state.guests>2?[80,120]:[0,0], detail=state.detail?purposes[state.purpose].range:[0,0];
 return [450+mod[0]+detail[0],550+mod[1]+detail[1]];
}
function priceText(){const p=estimate();return p?`${money(p[0])}–${money(p[1]).replace('R$ ','')}`:'Vamos orçar com você';}
function countText(){return state.guests===5?'5–8 pessoas (sob consulta)':state.guests?`${state.guests} pessoas`:'Quantidade a combinar';}
function setPurpose(p){state.purpose=p;state.detail=true;if(p==='adois')state.guests=2;}
function guestOptions(blank=true){return `${blank?'<option value="">Escolha a quantidade</option>':''}`+[2,3,4,5].map(n=>`<option value="${n}" ${state.guests===n?'selected':''} ${state.purpose==='adois'&&n!==2?'disabled':''}>${n===5?'5–8 pessoas · sob consulta':n+' pessoas'}</option>`).join('');}
function placeOptions(){return '<option value="">Escolha o local</option>'+Object.entries(places).map(([k,v])=>`<option value="${k}" ${state.place===k?'selected':''}>${v}</option>`).join('');}
function fields(){return `<div class="fields"><div class="field"><label for="guests">Quantas pessoas ao todo?</label><select id="guests" ${state.purpose==='adois'?'disabled':''}>${guestOptions()}</select><small>${state.purpose==='adois'?'A Dois é sempre para 2 pessoas.':'Inclua todas as pessoas, inclusive o casal em um pedido.'}</small></div><div class="field"><label for="place">Onde você imagina?</label><select id="place">${placeOptions()}</select><small>O ponto exato e as condições são combinados antes da reserva.</small></div>${detailControl()}</div>`;}
function detailControl(){const p=purposes[state.purpose];if(!p||!p.range[0])return '';return `<div class="field"><label class="checkline"><input type="checkbox" id="detail" ${state.detail?'checked':''}><span>${esc(p.detail)}<small>Detalhe sugerido · +${money(p.range[0])}–${money(p.range[1]).replace('R$ ','')} na simulação. Você pode retirar.</small></span></label></div>`;}
function summary(){const p=purposes[state.purpose]||purposes.ajuda;const range=estimate();return `<aside class="summary" aria-label="Resumo da experiência"><span class="eyebrow">${range?'Estimativa ilustrativa · total':'Proposta sob consulta'}</span><p class="price" id="price">${priceText()}</p><p class="fine" id="summaryCount">${countText()} · base de 90 minutos · limite de 2h30</p><h3>O que compõe seu momento</h3><ul class="included"><li>Ambientação de mesa baixa do acervo</li><li>Almofadas e decoração de base</li><li>Montagem e retirada no horário combinado</li><li>Cartão com mensagem</li>${state.detail&&p.range[0]?`<li>${esc(p.detail)}</li>`:''}</ul><p class="fine">Sem refeição, bebidas, fotógrafo ou aluguel de espaço. Deslocamento urbano básico considerado; acesso especial é avaliado à parte.</p><p class="fine estimate-status" id="placeNote">${['praia','turistico'].includes(state.place)?'Praia/ponto turístico: esta estimativa não confirma a permissão de uso. Validamos ponto, estrutura, acesso e condições.':state.place==='ajuda'?'A escolha de um espaço pode alterar o total. Locação não incluída.':'Local, data, itens e valor final precisam ser confirmados.'}</p><button class="btn btn-primary" data-review>Ver minha conversa</button><p class="fine" style="margin-top:12px">Teste de atendimento. Nada será enviado.</p><p class="errors" id="validation" role="status"></p></aside>`;}
function bindBuilder(container){
 container.querySelector('#guests')?.addEventListener('change',e=>{state.guests=e.target.value?Number(e.target.value):null;updateSummary(container);});
 container.querySelector('#place')?.addEventListener('change',e=>{state.place=e.target.value;updateSummary(container);});
 container.querySelector('#detail')?.addEventListener('change',e=>{state.detail=e.target.checked;updateSummary(container);});
 container.querySelector('[data-review]')?.addEventListener('click',()=>review(false));
}
function updateSummary(container){container.querySelector('.summary').outerHTML=summary();container.querySelector('[data-review]').addEventListener('click',()=>review(false));}
function renderBuilder(container,withTitle=true){const p=purposes[state.purpose];container.innerHTML=`<section class="builder" aria-label="Ajuste sua experiência">${withTitle?`<div class="selection-head"><span class="pill">Uma base. O seu detalhe.</span><h2 tabindex="-1">${p.title}</h2><p class="muted">A ambientação está definida. Escolha os detalhes que dão sentido ao encontro.</p></div>`:''}<div class="builder-layout">${fields()}${summary()}</div></section>`;bindBuilder(container);}
function renderA(){
 document.getElementById('intentGrid').innerHTML=Object.entries(purposes).filter(([k])=>k!=='ajuda').map(([k,p])=>`<button class="intent-card card" data-purpose="${k}" aria-pressed="${state.purpose===k}" aria-controls="intentResult"><img src="/img/${p.img}.webp" alt="" width="400" height="300" loading="lazy"><span class="inside"><strong>${p.short}</strong><small>${p.desc}</small><span class="arrow">Ver uma ideia para mim →</span></span></button>`).join('');
 document.querySelectorAll('[data-purpose]').forEach(b=>b.addEventListener('click',()=>{setPurpose(b.dataset.purpose);document.querySelectorAll('[data-purpose]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));const c=document.getElementById('intentResult');renderBuilder(c);c.querySelector('h2').focus({preventScroll:true});c.scrollIntoView({behavior:'smooth',block:'start'});}));
}
function renderC(){
 document.getElementById('purposeChips').innerHTML=Object.entries(purposes).filter(([k])=>k!=='ajuda').map(([k,p])=>`<button class="chip-choice" data-chip="${k}" aria-pressed="${state.purpose===k}">${p.short}</button>`).join('');
 document.querySelectorAll('[data-chip]').forEach(b=>b.addEventListener('click',()=>{setPurpose(b.dataset.chip);document.querySelectorAll('[data-chip]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderBuilder(document.getElementById('productResult'),false);}));renderBuilder(document.getElementById('productResult'),false);
}
function renderWizard(focus=false){
 const w=document.getElementById('wizard');
 const progress=`<div class="progress"><span style="white-space:nowrap">${state.step<3?'Escolha '+(state.step+1)+' de 3':'Sua sugestão'}</span><progress max="3" value="${Math.min(state.step+1,3)}" aria-label="Progresso"></progress></div>`;
 if(state.step===3){w.innerHTML=progress+'<h2 tabindex="-1">Uma ideia para o seu momento.</h2><div id="wizardResult"></div><div class="wizard-actions"><button class="link-button" id="wizardBack">← Voltar ao local</button><button class="link-button" id="restart">Recomeçar</button></div>';renderBuilder(document.getElementById('wizardResult'),false);document.getElementById('restart').onclick=()=>{state={purpose:null,guests:null,place:'',detail:true,note:'',step:0};renderWizard(true);};}
 else{
 let title,options;
 if(state.step===0){title='O que vamos celebrar?';options=Object.entries(purposes).filter(([k])=>k!=='ajuda').map(([k,p])=>[k,p.name,p.desc]);}
 if(state.step===1){title='Quem vai viver esse momento?';options=state.purpose==='adois'?[['2','Nós dois','A Dois é exclusivo para o casal.']]:[['2','2 pessoas','Inclua o casal, se for um pedido.'],['3','3 pessoas','Um pequeno encontro.'],['4','4 pessoas','Nossa hipótese de formato inicial.'],['5','5–8 pessoas','Vamos avaliar equipe e estrutura.']];}
 if(state.step===2){title='Onde você imagina?';options=Object.entries(places).map(([k,v])=>[k,v,k==='praia'||k==='turistico'?'Ponto exato e condições a confirmar.':'Combinamos os detalhes antes da reserva.']);}
 w.innerHTML=progress+`<h2 tabindex="-1">${title}</h2><div class="wizard-options">${options.map(([key,label,desc])=>`<button class="choice" data-answer="${key}"><span>${esc(label)}<small>${esc(desc)}</small></span><span aria-hidden="true">→</span></button>`).join('')}</div><div class="wizard-actions">${state.step?'<button class="link-button" id="wizardBack">← Voltar</button>':'<span class="fine">Nenhum cadastro para começar.</span>'}</div>`;
 w.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{const val=b.dataset.answer;if(state.step===0)setPurpose(val);if(state.step===1)state.guests=Number(val);if(state.step===2)state.place=val;state.step++;renderWizard(true);});
 }
 document.getElementById('wizardBack')?.addEventListener('click',()=>{state.step--;renderWizard(true);});if(focus)w.querySelector('h2').focus({preventScroll:true});
}
function renderD(){
 const purpose=document.getElementById('briefPurpose'),guests=document.getElementById('briefGuests');
 purpose.onchange=()=>{setPurpose(purpose.value||null);if(purpose.value==='adois'){guests.value='2';guests.disabled=true;document.getElementById('briefHint').textContent='A Dois é sempre para 2 pessoas.';}else{guests.disabled=false;document.getElementById('briefHint').textContent='';}document.getElementById('briefResult').innerHTML='';document.getElementById('briefDetail').innerHTML=detailControl();document.getElementById('detail')?.addEventListener('change',e=>{state.detail=e.target.checked;document.getElementById('briefResult').innerHTML='';});};
 document.getElementById('briefPlace').innerHTML=placeOptions();
 document.getElementById('briefForm').onsubmit=e=>{e.preventDefault();state.purpose=purpose.value;state.guests=Number(guests.value);state.place=document.getElementById('briefPlace').value;state.note=document.getElementById('briefNotes').value.trim();document.getElementById('briefResult').innerHTML=summary();document.querySelector('#briefResult [data-review]').onclick=()=>review(false);review(false);};
 ['briefGuests','briefPlace','briefNotes'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{document.getElementById('briefResult').innerHTML='';}));
}
function message(help){
 if(help)return 'SIMULAÇÃO — NÃO É UMA RESERVA\nOlá, Descomplica! Quero ajuda para escolher uma experiência no Guarujá. Podemos conversar sobre ocasião, pessoas, local e investimento?';
 const p=purposes[state.purpose];return `SIMULAÇÃO — NÃO É UMA RESERVA\nOlá, Descomplica! Quero planejar: ${p.name}.\nParticipantes: ${countText()}.\nLocal: ${places[state.place]}.\nBase: ambientação de mesa baixa, almofadas, decoração, cartão, montagem e retirada; 90 minutos como hipótese. Limite de 2h30 para a experiência do cliente; extensão da base depende do local e de orçamento prévio.\nDetalhe: ${state.detail&&p.range[0]?p.detail:'somente a base; detalhe a combinar'}.\n${estimate()?'Estimativa ilustrativa total: '+priceText()+'.':'Quantidade ou formato sob consulta; sem preço calculado.'}\nNão inclui refeição, bebidas, fotógrafo ou aluguel de espaço. Confirmar condições de acesso, local, itens e valor final.\n${state.note?'O que imaginei: '+state.note+'\n':''}A data ainda será combinada. Gostaria de avaliar viabilidade e uma proposta, sem reserva automática.`;
}
const dialog=document.getElementById('review');
function review(help){if(!help&&(!state.guests||!state.place)){const e=document.getElementById('validation');if(e)e.textContent='Escolha a quantidade e o local para preparar o resumo.';const target=!state.guests?document.getElementById('guests'):document.getElementById('place');target?.focus();return;}
 document.getElementById('message').value=message(help);document.getElementById('copyStatus').textContent='';dialog.showModal();}
document.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>review(true));
document.getElementById('closeReview').onclick=()=>dialog.close();document.getElementById('editReview').onclick=()=>dialog.close();
document.getElementById('copyMessage').onclick=async()=>{try{await navigator.clipboard.writeText(document.getElementById('message').value);document.getElementById('copyStatus').textContent='Simulação copiada. Nenhuma mensagem foi enviada.';}catch{document.getElementById('message').select();document.getElementById('copyStatus').textContent='Selecione e copie o texto acima. Nenhuma mensagem foi enviada.';}};
if(variant==='A')renderA();if(variant==='B')renderWizard();if(variant==='C')renderC();if(variant==='D')renderD();
document.querySelectorAll('.prototype-nav a').forEach(a=>{if(new URL(a.href).pathname.replace(/\.html$/,'')===location.pathname.replace(/\.html$/,''))a.setAttribute('aria-current','page');});
})();
