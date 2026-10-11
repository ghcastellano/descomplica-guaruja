(() => {
 const form=document.getElementById('costForm');
 function calc(){
  if(!form.checkValidity()){document.getElementById('costPrice').textContent='Revise os valores';document.getElementById('costBreakdown').textContent='Preencha números válidos, com ao menos uma venda mensal.';return;}
  const get=id=>Number(document.getElementById(id).value),money=x=>x.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const work=get('costHours')*get('costRate'),fixed=get('costFixed')/get('costCount'),direct=get('costDirect'),subtotal=work+fixed+direct,contingency=subtotal*.07;
  const denominator=1-(get('costTax')+get('costFee')+get('costMargin'))/100;
  if(denominator<=0){document.getElementById('costPrice').textContent='Percentuais inválidos';return;}
  const price=(subtotal+contingency)/denominator;
  document.getElementById('costPrice').textContent=money(price);
  document.getElementById('costBreakdown').innerHTML=`<ul class="included"><li>Trabalho dos sócios: ${money(work)}</li><li>Outros custos: ${money(direct)}</li><li>Rateio de fixos: ${money(fixed)}</li><li>Reserva de imprevistos: ${money(contingency)}</li><li>Impostos provisionados: ${money(price*get('costTax')/100)}</li><li>Pagamento: ${money(price*get('costFee')/100)}</li><li>Resultado após remunerar o trabalho: ${money(price*get('costMargin')/100)}</li></ul>`;
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',calc);calc();
})();
