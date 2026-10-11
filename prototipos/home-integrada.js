/* Isolated study: no webhook, analytics transport, automatic email or WhatsApp send. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const occasions={
 adois:{name:'A Dois',title:'Um tempo só de vocês.',meaning:'Um encontro, uma data especial ou uma surpresa só porque sim.',price:349,max:2,detail:'Pétalas, velas LED e uma mensagem de vocês',photo:'hero-experiencia-por-do-sol-hero-800',alt:'Referência de mesa baixa e almofadas à beira-mar'},
 celebrar:{name:'Celebrar',title:'Um aniversário para lembrar.',meaning:'A mesma base acolhedora, com o detalhe de quem você quer celebrar.',price:399,max:4,detail:'Mini bolo, balões e plaquinha com o nome',photo:'experiencia-flores-col-800',alt:'Referência de uma montagem compacta com almofadas e mesa baixa'},
 amigas:{name:'Entre Amigas',title:'O melhor motivo é estar junto.',meaning:'Um reencontro, uma despedida ou uma tarde para guardar.',price:349,max:4,detail:'Cantinho de fotos e plaquinha do grupo',photo:'experiencia-boho-praia-col-800',alt:'Referência de uma ambientação intimista na praia'},
 pedido:{name:'Pedido',title:'Um grande sim, perto de vocês.',meaning:'Buquê, uma pequena mensagem e um roteiro combinado em segredo. Uma montagem intimista, sem letras gigantes.',price:549,max:2,detail:'Buquê, plaquinha pequena “Casa comigo?” e roteiro combinado',photo:'experiencia-flores-col-800',alt:'Referência da base compacta para duas pessoas, sem letreiro gigante'}
};
const addons=[
 {id:'tabua',name:'Tábua de frios para o grupo',note:'Composição e quantidade confirmadas na proposta',price:149},
 {id:'fotos',name:'Fotos profissionais · 30 minutos',note:'Disponibilidade e prazo de entrega confirmados na proposta',price:250},
 {id:'instax',name:'3 fotos instantâneas',note:'Uma lembrança física para levar',price:39},
 {id:'baloes',name:'Balões personalizados',note:'Cor e frase combinadas com a equipe',price:79},
 {id:'extra30',name:'Mais 30 minutos',note:'De 2h para 2h30 · nosso máximo',price:59}
];
const state={occasion:null,guests:2,place:'ajuda',period:'a combinar',addons:new Set(),revision:0};
const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
const keys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
const params=new URLSearchParams(location.search);
const incoming=Object.fromEntries(keys.filter(k=>params.get(k)).map(k=>[k,params.get(k).slice(0,150)]));
const getStored=k=>{try{return JSON.parse(sessionStorage.getItem(k)||'null');}catch{return null;}};
const save=(k,v)=>{try{sessionStorage.setItem(k,JSON.stringify(v));}catch{}};
const firstTouch=getStored('hi_first_touch')||incoming;
const lastTouch=Object.keys(incoming).length?incoming:getStored('hi_last_touch')||{};
save('hi_first_touch',firstTouch);save('hi_last_touch',lastTouch);
const id=getStored('hi_proposal_id')||'SIM-'+(globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2));save('hi_proposal_id',id);
const places={ajuda:'Quero ajuda com o local',praia:'Praia · ponto e condições a confirmar',turistico:'Ponto turístico · condições a confirmar',casa:'Casa ou condomínio',hospedagem:'Hospedagem'};
const picked=()=>addons.filter(a=>state.addons.has(a.id));
const duration=()=>state.addons.has('extra30')?150:120;
const durationLabel=()=>duration()===150?'2h30':'2h';
const total=()=>occasions[state.occasion].price+Math.max(0,state.guests-2)*79+picked().reduce((s,a)=>s+a.price,0);
function noteChange(){state.revision++;}
function renderOptions(){
 const markup=a=>`<label class="hi-option"><input type="checkbox" data-addon="${a.id}" ${state.addons.has(a.id)?'checked':''}><span>${a.name}<small>${a.note}</small></span><strong>+ ${money(a.price)}</strong></label>`;
 $('hiDetails').innerHTML=addons.filter(a=>a.id!=='tabua'&&!(a.id==='baloes'&&state.occasion==='celebrar')).map(markup).join('');
 $('hiFoodOptions').innerHTML=markup(addons[0]);
 document.querySelectorAll('[data-addon]').forEach(input=>input.onchange=()=>{input.checked?state.addons.add(input.dataset.addon):state.addons.delete(input.dataset.addon);noteChange();update();});
}
function update(){
 $('hiSummary').textContent=`${occasions[state.occasion].name} · ${state.guests} pessoas · ${durationLabel()} · ${state.period}`;
 $('hiAddSummary').textContent='Adicionais: '+(picked().map(a=>a.name).join(', ')||'nenhum selecionado')+'.';
 $('hiTotal').textContent=money(total());
 $('hiGuestNote').textContent=occasions[state.occasion].max===2?'Exclusivo para o casal.':'+ R$ 79 por pessoa além de duas · até quatro neste estudo.';
}
function choose(key,focus=true){
 if(!Object.hasOwn(occasions,key))return;
 const o=occasions[key];state.occasion=key;state.guests=Math.min(Math.max(2,state.guests),o.max);if(key==='celebrar')state.addons.delete('baloes');noteChange();
 document.querySelectorAll('[data-occasion]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.occasion===key)));
 $('hiExperience').hidden=false;$('hiOccasion').textContent=o.name;$('hiTitle').textContent=o.title;$('hiMeaning').textContent=o.meaning;$('hiIncludedDetail').textContent=o.detail;
 $('hiPhoto').src='/img/'+o.photo+'.webp';$('hiPhoto').alt=o.alt;
 $('hiCaption').textContent=key==='pedido'?'Referência da base compacta. Buquê e plaquinha pequena são definidos na proposta; os itens da foto não definem as inclusões.':'Imagem de referência. Alimentação e demais itens seguem as inclusões e os adicionais selecionados.';
 $('hiGuests').innerHTML=Array.from({length:o.max-1},(_,i)=>i+2).map(n=>`<option value="${n}" ${n===state.guests?'selected':''}>${n} pessoas</option>`).join('');$('hiGuests').disabled=o.max===2;
 renderOptions();update();
 if(focus){$('hiTitle').focus({preventScroll:true});$('hiExperience').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
}
function payload(phone=''){
 return {schema_version:2,event:phone?'proposal_contact_requested':'proposal_whatsapp_intent',proposal_id:id,revision:state.revision,source:'home_integrada_estudo',simulation:true,
 occasion:state.occasion,occasion_name:occasions[state.occasion].name,guests:state.guests,duration_minutes:duration(),place:state.place,period:state.period,
 included_detail:occasions[state.occasion].detail,addons:picked().map(a=>({id:a.id,name:a.name,estimated_amount:a.price})),estimate:{currency:'BRL',amount:total(),status:'illustrative_not_final',excludes:['bebidas','locação','acessos especiais']},
 own_food_drink_allowed:false,...(phone?{phone,best_contact_period:$('hiContactTime').value,contact_purpose:'responder a esta solicitação'}:{}),attribution:{first_touch:firstTouch,last_touch:lastTouch}};
}
function message(help=false){
 if(help)return 'ESTUDO — SIMULAÇÃO, SEM RESERVA\nOlá, Descomplica! Quero ajuda para escolher uma experiência no Guarujá.';
 return `ESTUDO — SIMULAÇÃO, SEM RESERVA\nReferência: ${id} · revisão ${state.revision}\nOlá! Gostaria de uma proposta para ${occasions[state.occasion].name}.\nParticipantes: ${state.guests}.\nLocal: ${places[state.place]}.\nPeríodo: ${state.period}.\nDuração: ${durationLabel()} (máximo de 2h30).\nBase: mesa baixa decorada, tapete, almofadas, flores, velas LED, louça, montagem, desmontagem e deslocamento urbano.\nDetalhe incluído: ${occasions[state.occasion].detail}.\nAdicionais: ${picked().map(a=>a.name+' ('+money(a.price)+')').join('; ')||'nenhum'}.\nEstimativa do estudo: ${money(total())}; valor final a confirmar.\nBebidas, locação e acessos especiais não estão neste cálculo. Quero combinar as bebidas na proposta.\nEstou ciente de que não é permitido levar alimentos ou bebidas próprios.\nData, disponibilidade e condições do local ainda serão combinadas.\nOrigem: ${lastTouch.utm_source||'site'}${lastTouch.utm_campaign?' / '+lastTouch.utm_campaign:''}.`;
}
function emailPreview(data){
 const src=u=>Object.entries(u).map(([k,v])=>`${k}: ${v}`).join('\n')||'direto / não identificado';
 return `PRÉVIA — nenhum e-mail enviado\nAssunto: [Proposta ${data.proposal_id}] ${data.occasion_name} · ${data.guests} pessoas · revisão ${data.revision}\n\nStatus: ${data.phone?'contato solicitado pelo visitante':'intenção de abrir WhatsApp; envio da mensagem não confirmado'}\nTelefone: ${data.phone||'não informado; este clique não gera alerta de contato'}\nMelhor período para contato: ${data.best_contact_period||'não informado'}\nOcasião: ${data.occasion_name}\nParticipantes: ${data.guests}\nDuração: ${data.duration_minutes} minutos\nLocal: ${places[data.place]}\nPeríodo da experiência: ${data.period}\nDetalhe incluído: ${data.included_detail}\nAdicionais: ${data.addons.map(a=>a.name+' · '+money(a.estimated_amount)).join('; ')||'nenhum'}\nEstimativa: ${money(data.estimate.amount)} — estudo, não é preço fechado\nNão inclui no cálculo: bebidas, locação, acessos especiais\nAlimentos/bebidas próprios: não permitidos\n\nPrimeira origem:\n${src(data.attribution.first_touch)}\n\nOrigem mais recente:\n${src(data.attribution.last_touch)}\n\nPróxima ação: confirmar data, ponto exato, bebidas e orçamento.\nPara atualizar: manter a referência e registrar a revisão. Clique no WhatsApp não comprova mensagem enviada.`;
}
function review(help=false,phone=''){
 $('hiMessage').value=message(help);$('hiWhatsApp').href='https://wa.me/5513988523663?text='+encodeURIComponent($('hiMessage').value);
 $('hiEmailExample').hidden=help;$('hiEmailExample').open=Boolean(phone);
 $('hiReviewNote').textContent=phone?'Simulação de pedido de contato. Nenhum telefone foi enviado ou salvo, e nenhum e-mail foi disparado.':'Simulação: a mensagem só é enviada se você confirmar no WhatsApp.';
 if(!help)$('hiEmailBody').textContent=emailPreview(payload(phone));
 $('hiReview').showModal();
}
document.querySelectorAll('[data-occasion]').forEach(b=>b.onclick=()=>choose(b.dataset.occasion));
$('hiGuests').onchange=e=>{state.guests=Number(e.target.value);noteChange();update();};
$('hiPlace').onchange=e=>{state.place=e.target.value;noteChange();update();};
$('hiPeriod').onchange=e=>{state.period=e.target.value;noteChange();update();};
$('hiForm').onsubmit=e=>{e.preventDefault();review();};
$('hiPreviewEmail').onclick=()=>{const phone=$('hiPhone').value.replace(/\D/g,'');if(!/^[1-9]{2}\d{8,9}$/.test(phone)){$('hiContactError').textContent='Informe um telefone de teste com DDD e 10 ou 11 dígitos.';$('hiPhone').focus();return;}$('hiContactError').textContent='';review(false,phone);};
$('hiClose').onclick=$('hiBack').onclick=()=>$('hiReview').close();
document.querySelectorAll('[data-help],.wa-link').forEach(el=>{if(el.tagName==='A')el.href='#colecoes';el.onclick=e=>{e.preventDefault();review(true);};});
// Existing presentation remains visible without JavaScript; no external trackers from the original home.
document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
addEventListener('scroll',()=>{$('top')?.classList.toggle('scrolled',scrollY>10);$('fab')?.classList.toggle('show',scrollY>innerHeight*.8);},{passive:true});
const aliases={aniversario:'celebrar',entre_amigas:'amigas'};const requested=params.get('ocasiao');const key=aliases[requested]||requested;if(key&&Object.hasOwn(occasions,key))choose(key,false);
})();
