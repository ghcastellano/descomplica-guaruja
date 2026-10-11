/* Original home presentation retained in isolated complete-page studies. */
(()=>{
 window.phErr=el=>{el.onerror=null;el.closest('picture')?.querySelector('source')?.remove();el.src='/logo.webp';};
 document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
 document.querySelectorAll('.faq-q').forEach(btn=>btn.addEventListener('click',()=>{const open=btn.closest('.faq-item').classList.toggle('open');btn.setAttribute('aria-expanded',String(open));}));
 document.querySelectorAll('.wa-link').forEach(a=>{a.href='https://wa.me/5513988523663?text='+encodeURIComponent('ESTUDO — SIMULAÇÃO. Olá! Quero ajuda para escolher uma experiência da Descomplica Guarujá.');a.target='_blank';a.rel='noopener noreferrer';});
 const config=document.getElementById('config'),dock=document.getElementById('dock'),review=document.getElementById('review');
 function sync(){const r=config.getBoundingClientRect(),active=r.top<innerHeight*.85&&r.bottom>100&&!review.open;dock.hidden=!active;document.body.classList.toggle('compact-dock-visible',active);document.getElementById('top')?.classList.toggle('scrolled',scrollY>10);document.getElementById('fab')?.classList.toggle('show',scrollY>innerHeight*.8);}
 new IntersectionObserver(sync,{threshold:[0,.1,.5,1]}).observe(config);addEventListener('scroll',sync,{passive:true});addEventListener('resize',sync);review.addEventListener('close',sync);sync();
})();
