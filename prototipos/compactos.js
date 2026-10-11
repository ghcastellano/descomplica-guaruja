/* Independent review prototypes. No lead submission, analytics transport or automatic messages. */
(()=>{'use strict';
const $=id=>document.getElementById(id),money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const offers={
 adois:{name:'A Dois',price:349,max:2,title:'Um tempo só de vocês.',desc:'Uma data especial ou uma surpresa só porque sim.',detail:'Pétalas, velas LED e cartão com a mensagem de vocês.',image:'hero-experiencia-por-do-sol-hero-800'},
 aniversario:{name:'Aniversário',price:399,max:4,title:'Uma nova volta ao sol.',desc:'Um pequeno encontro para celebrar quem importa.',detail:'Mini bolo, balões e plaquinha com o nome incluídos.',image:'experiencia-flores-col-800'},
 amigas:{name:'Entre Amigas',price:349,max:4,title:'O melhor motivo é estar junto.',desc:'Uma tarde para colocar as histórias em dia.',detail:'Cantinho de fotos e plaquinha do grupo incluídos.',image:'experiencia-boho-praia-col-800'},
 pedido:{name:'Pedido',price:549,max:2,title:'Um grande sim, do seu jeito.',desc:'Uma montagem intimista para a história de vocês.',detail:'Buquê, plaquinha pequena e roteiro combinado em segredo.',image:'experiencia-flores-col-800'}
};
const extras=[{id:'tabua',name:'Tábua de frios',note:'Para o grupo · composição a confirmar',price:149,food:true},{id:'bebidas',name:'Bebidas sem álcool',note:'Água, suco e espumante sem álcool',price:49,food:true},{id:'fotos',name:'Registro fotográfico',note:'30 minutos · entrega a combinar',price:149},{id:'drone',name:'Imagens de drone',note:'Sujeito à viabilidade no local',price:199},{id:'instax',name:'3 fotos instantâneas',note:'Uma lembrança para levar',price:39},{id:'baloes',name:'Balões personalizados',note:'Cor e frase a combinar',price:79},{id:'extra30',name:'Mais 30 minutos',note:'De 2h para 2h30 · limite máximo',price:59}];
const state={occasion:'adois',guests:2,period:'A combinar',extras:new Set()};
const params=new URLSearchParams(location.search),source=Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content'].filter(k=>params.has(k)).map(k=>[k,params.get(k).slice(0,120)]));
const id='SIM-'+(crypto.randomUUID?.()||Math.random().toString(36).slice(2));
const selected=()=>extras.filter(x=>state.extras.has(x.id)),duration=()=>state.extras.has('extra30')?'2h30':'2h';
const total=()=>offers[state.occasion].price+(state.guests-2)*79+selected().reduce((s,x)=>s+x.price,0);
$('occasions').innerHTML=Object.entries(offers).map(([id,o])=>`<button type="button" data-occasion="${id}" aria-pressed="false">${o.name}<small>${money(o.price)} · 2 pessoas</small></button>`).join('');
$('guests').innerHTML=[2,3,4].map(n=>`<button type="button" data-guests="${n}" aria-pressed="false">${n} pessoas</button>`).join('');
$('periods').innerHTML=['A combinar','Manhã','Tarde','Pôr do sol','Noite'].map(t=>`<button type="button" data-period="${t}" aria-pressed="false">${t}</button>`).join('');
function options(){
 const markup=x=>`<label class="extra"><input type="checkbox" data-extra="${x.id}" ${state.extras.has(x.id)?'checked':''}><span>${x.name}<small>${x.note}</small></span><b>+${money(x.price)}</b></label>`;
 $('foodOptions').innerHTML=extras.filter(x=>x.food).map(markup).join('');$('otherOptions').innerHTML=extras.filter(x=>!x.food&&!(state.occasion==='aniversario'&&x.id==='baloes')).map(markup).join('');
 document.querySelectorAll('[data-extra]').forEach(el=>el.onchange=()=>{el.checked?state.extras.add(el.dataset.extra):state.extras.delete(el.dataset.extra);update();});
}
function update(){
 const o=offers[state.occasion];
 document.querySelectorAll('[data-occasion]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.occasion===state.occasion)));
 document.querySelectorAll('[data-guests]').forEach(el=>{const n=Number(el.dataset.guests);el.disabled=n>o.max;el.setAttribute('aria-pressed',String(n===state.guests));});
 document.querySelectorAll('[data-period]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.period===state.period)));
 $('guestNote').textContent=o.max===2?'Exclusivo para 2 pessoas.':'+ R$ 79 por pessoa além de duas · máximo de quatro.';
 $('price').textContent=money(total());$('priceContext').textContent=`${state.guests} pessoas · ${duration()}`;
 $('selection').textContent=`${o.name} · ${state.guests} pessoas · ${duration()} · ${state.period}`;
 $('selectionExtras').textContent=selected().length?'Adicionais: '+selected().map(x=>x.name).join(', ')+'.':'Sem adicionais selecionados.';
 const n=selected().filter(x=>!x.food).length;$('extraCount').textContent=n?n+' selecionado(s)':'Opcional';
}
function choose(key){
 if(!Object.hasOwn(offers,key))return;
 const oldGuests=state.guests;state.occasion=key;state.guests=Math.min(state.guests,offers[key].max);
 const included=key==='aniversario'&&state.extras.delete('baloes');
 $('changeNotice').textContent=[oldGuests!==state.guests?'Quantidade ajustada para duas pessoas nesta ocasião.':'',included?'Balões já estão incluídos no aniversário e saíram dos adicionais.':''].filter(Boolean).join(' ');
 const o=offers[key];$('photo').src='/img/'+o.image+'.webp';$('photo').alt='Referência de ambientação compacta para '+o.name;$('occasionName').textContent=o.name;$('experienceTitle').textContent=o.title;$('meaning').textContent=o.desc;$('includedDetail').textContent=o.detail;options();update();
}
function message(){const name=$('name').value.trim(),date=$('date').value;return `ESTUDO — SIMULAÇÃO, SEM RESERVA\nReferência: ${id}\nOlá! ${name?'Sou '+name+'. ':''}Gostaria de uma proposta para ${offers[state.occasion].name}.\nParticipantes: ${state.guests}. Período: ${state.period}. Duração: ${duration()} (máximo 2h30).\n${date?'Data desejada: '+date+'.\n':''}Inclui: mesa baixa, tapete, almofadas, flores, velas LED, louça, montagem, retirada e deslocamento urbano. ${offers[state.occasion].detail}\nAdicionais: ${selected().map(x=>x.name+' ('+money(x.price)+')').join('; ')||'nenhum'}.\nEstimativa do estudo: ${money(total())}. Confirmar disponibilidade, local, itens e valor final; locação e acessos especiais à parte.\nEstou ciente de que não é permitido levar alimentos ou bebidas próprios.\nOrigem: ${source.utm_source||'site'}${source.utm_campaign?' / '+source.utm_campaign:''}.`;}
function refreshMessage(){$('message').value=message();$('whatsapp').href='https://wa.me/5513988523663?text='+encodeURIComponent(message());}
function review(){
 const box=$('reviewSummary');box.replaceChildren();for(const text of [$('selection').textContent,offers[state.occasion].detail,$('selectionExtras').textContent,'Estimativa: '+money(total()),'Alimentos e bebidas próprios não são permitidos.']){const p=document.createElement('p');p.textContent=text;box.append(p);}
 refreshMessage();$('review').showModal();$('dock').hidden=true;
}
document.querySelectorAll('[data-occasion]').forEach(el=>el.onclick=()=>choose(el.dataset.occasion));
document.querySelectorAll('[data-guests]').forEach(el=>el.onclick=()=>{state.guests=Number(el.dataset.guests);update();});
document.querySelectorAll('[data-period]').forEach(el=>el.onclick=()=>{state.period=el.dataset.period;update();});
// Selection groups support arrows, Home and End as a convenience, in addition to Tab/Enter.
document.querySelectorAll('[role=group]').forEach(group=>group.addEventListener('keydown',e=>{if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;const buttons=[...group.querySelectorAll('button:not(:disabled)')],i=buttons.indexOf(document.activeElement);if(i<0)return;e.preventDefault();const n=e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[n].focus();buttons[n].click();}));
$('reviewButton').onclick=review;$('closeReview').onclick=$('edit').onclick=()=>$('review').close();$('review').addEventListener('close',()=>{$('dock').hidden=false;});
['name','date'].forEach(id=>$(id).addEventListener('input',refreshMessage));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());$('date').min=today;
$('whatsapp').onclick=e=>{if(!$('date').checkValidity()){e.preventDefault();$('date').closest('details').open=true;$('date').reportValidity();}};
choose(Object.hasOwn(offers,params.get('ocasiao'))?params.get('ocasiao'):'adois');
})();
