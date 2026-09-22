(function(){
  var root = document.documentElement;
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length, cur = 0, rvT = null;
  var cnt = document.getElementById('cnt'), bar = document.getElementById('bar');
  var prevBtn = document.getElementById('prev'), nextBtn = document.getElementById('next');
  var notes = document.getElementById('notes'), notesBtn = document.getElementById('notesBtn');
  var fsBtn = document.getElementById('fsBtn'), dots = document.getElementById('dots');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var deckEl = document.getElementById('deck');
  var baseTitle = deckEl.getAttribute('data-title') || document.title;
  var hasNotes = slides.some(function(s){ return s.hasAttribute('data-notes'); });
  if(!hasNotes){ notesBtn.style.display = 'none'; }

  slides.forEach(function(s,k){ var b=document.createElement('button'); b.type='button'; b.setAttribute('aria-label','Ir para o slide '+(k+1)); b.addEventListener('click',function(){show(k)}); dots.appendChild(b); });
  var dotBtns = dots.querySelectorAll('button');

  // contadores animados
  function countUp(el){
    if(el.dataset.done) return; el.dataset.done='1';
    var target = parseFloat(el.dataset.count), dec = parseInt(el.dataset.dec||'0',10);
    var pre = el.dataset.prefix||'', suf = el.dataset.suffix||'', sep = el.dataset.sep==='1';
    var t0 = null, dur = reduce ? 1 : 1400;
    function fmt(v){ var s = v.toFixed(dec).replace('.',','); if(sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g,'.'); return pre+s+suf; }
    function step(ts){ if(!t0) t0=ts; var p=Math.min(1,(ts-t0)/dur); var e=1-Math.pow(1-p,3); el.textContent=fmt(target*e); if(p<1) requestAnimationFrame(step); else el.textContent=fmt(target); }
    requestAnimationFrame(step);
  }

  function fromHash(){ var n = parseInt((location.hash||'').replace('#',''),10); return (n>=1 && n<=total) ? n-1 : 0; }
  function show(i){
    if(i<0||i>=total) return;
    slides.forEach(function(s,k){ s.classList.toggle('is-active', k===i); s.classList.toggle('is-prev', k<i); s.classList.remove('rv-done'); });
    var nRv = slides[i].querySelectorAll('.rv').length;
    clearTimeout(rvT); rvT = setTimeout(function(){ slides[i].classList.add('rv-done'); }, reduce ? 220 : 140 + nRv*45 + 440);
    slides[i].scrollTop = 0; cur = i;
    cnt.textContent = (i+1)+' / '+total;
    bar.style.transform = 'scaleX('+((i+1)/total)+')';
    prevBtn.disabled = i===0; nextBtn.disabled = i===total-1;
    dotBtns.forEach(function(b,k){ b.classList.toggle('on', k===i); });
    notes.innerHTML = slides[i].getAttribute('data-notes') || '<p>Sem notas para este slide.</p>';
    if(history.replaceState) history.replaceState(null,'','#'+(i+1));
    document.querySelector('meta[name="theme-color"]').setAttribute('content', slides[i].classList.contains('dark') ? '#143438' : '#F4EDE4');
    document.title = 'Slide '+(i+1)+' · '+baseTitle;
    setTimeout(function(){ Array.prototype.forEach.call(slides[i].querySelectorAll('[data-count]'), countUp); }, 350);
  }
  function go(d){ var n = cur + d; if(n<0||n>=total) return; show(n); }
  prevBtn.addEventListener('click', function(){go(-1)});
  nextBtn.addEventListener('click', function(){go(1)});

  document.addEventListener('keydown', function(e){
    if(e.target && e.target.isContentEditable) return;
    var k = e.key;
    if(k==='ArrowRight'||k==='ArrowDown'||k==='PageDown'||k===' '||k==='Enter'){ e.preventDefault(); go(1); }
    else if(k==='ArrowLeft'||k==='ArrowUp'||k==='PageUp'||k==='Backspace'){ e.preventDefault(); go(-1); }
    else if(k==='Home'){ show(0); } else if(k==='End'){ show(total-1); }
    else if(k==='n'||k==='N'){ toggleNotes(); }
    else if(k==='f'||k==='F'){ toggleFs(); }
  });

  // roda do mouse: avança; se o slide tiver rolagem interna, rola primeiro
  var wheelAcc = 0, wheelT = null, wheelCool = 0;
  document.addEventListener('wheel', function(e){
    var s = slides[cur]; var canScroll = s.scrollHeight - s.clientHeight > 4;
    if(canScroll){ var atTop = s.scrollTop <= 0, atBottom = s.scrollTop + s.clientHeight >= s.scrollHeight - 2; if((e.deltaY>0 && !atBottom) || (e.deltaY<0 && !atTop)) return; }
    e.preventDefault(); wheelAcc += e.deltaY; clearTimeout(wheelT); wheelT = setTimeout(function(){ wheelAcc = 0; }, 200);
    if(Math.abs(wheelAcc) > 40){ wheelAcc = 0; var now = Date.now(); if(now - wheelCool < 550) return; wheelCool = now; go(wheelAcc>0?1:-1); }
  }, {passive:false});

  // toque: deslizar horizontalmente
  var tx=0, ty=0, tt=0;
  document.addEventListener('touchstart', function(e){ var t=e.changedTouches[0]; tx=t.clientX; ty=t.clientY; tt=Date.now(); }, {passive:true});
  document.addEventListener('touchend', function(e){ var t=e.changedTouches[0], dx=t.clientX-tx, dy=t.clientY-ty; if(Date.now()-tt > 700) return; if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)*1.3){ go(dx<0?1:-1); } }, {passive:true});

  // clique no slide (fora de links/botões/campos) avança
  deckEl.addEventListener('click', function(e){
    var el = e.target;
    while(el && el !== document.body){ if(el.tagName==='A'||el.tagName==='BUTTON'||el.isContentEditable) return; el = el.parentNode; }
    if(window.getSelection && String(window.getSelection())) return;
    go(1);
  });

  function toggleNotes(){ var on = !notes.classList.contains('on'); notes.classList.toggle('on', on); notesBtn.setAttribute('aria-pressed', on?'true':'false'); }
  notesBtn.addEventListener('click', toggleNotes);
  function toggleFs(){ var d = document, el = d.documentElement; if(!d.fullscreenElement && el.requestFullscreen){ el.requestFullscreen().catch(function(){}); } else if(d.exitFullscreen){ d.exitFullscreen(); } }
  fsBtn.addEventListener('click', toggleFs);
  if(!document.documentElement.requestFullscreen) fsBtn.style.display='none';

  Array.prototype.forEach.call(document.querySelectorAll('.fill'), function(f){
    var ph = f.textContent;
    f.addEventListener('focus', function(){ if(f.textContent===ph) f.textContent=''; });
    f.addEventListener('blur', function(){ if(!f.textContent.trim()) f.textContent=ph; });
  });

  // cursor personalizado + parallax (só com mouse)
  var fine = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(fine && !reduce){
    var dot = document.getElementById('curDot'), ring = document.getElementById('curRing');
    var mx = innerWidth/2, my = innerHeight/2, rx = mx, ry = my, shown = false;
    var tpx = 0, tpy = 0, cpx = 0, cpy = 0;
    document.addEventListener('mousemove', function(e){
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate3d('+mx+'px,'+my+'px,0)';
      if(!shown){ shown = true; root.classList.remove('cur-hide'); }
      var t = e.target, hov = false;
      while(t && t !== document.body){ if(t.tagName==='A'||t.tagName==='BUTTON'||t.isContentEditable||(t.classList&&(t.classList.contains('card')||t.classList.contains('col')))){ hov = true; break; } t = t.parentNode; }
      root.classList.toggle('cur-hover', hov);
      tpx = (mx/innerWidth - .5); tpy = (my/innerHeight - .5);
    });
    document.addEventListener('mousedown', function(){ root.classList.add('cur-down'); });
    document.addEventListener('mouseup', function(){ root.classList.remove('cur-down'); });
    document.addEventListener('mouseleave', function(){ root.classList.add('cur-hide'); });
    document.addEventListener('mouseenter', function(){ root.classList.remove('cur-hide'); });
    root.classList.add('cur-hide');
    (function loop(){
      rx += (mx-rx)*.18; ry += (my-ry)*.18; ring.style.transform = 'translate3d('+rx+'px,'+ry+'px,0)';
      cpx += (tpx-cpx)*.08; cpy += (tpy-cpy)*.08;
      var s = slides[cur];
      Array.prototype.forEach.call(s.querySelectorAll('.px'), function(el){ el.style.transform = 'perspective(900px) rotateY('+(cpx*5)+'deg) rotateX('+(-cpy*4)+'deg) translate3d('+(cpx*6)+'px,'+(cpy*6)+'px,0)'; });
      var orbs = s.querySelector('.orbs'); if(orbs){ orbs.style.transform = 'translate3d('+(cpx*22)+'px,'+(cpy*16)+'px,0)'; }
      requestAnimationFrame(loop);
    })();
  }

  window.addEventListener('hashchange', function(){ show(fromHash()); });
  show(fromHash());
})();
