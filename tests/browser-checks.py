"""Run with Playwright installed, local static server on port 3000. No external requests/leads."""
import json,os
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
OUT=Path(os.environ.get('TEST_OUTPUT','/tmp/descomplica-qa'));OUT.mkdir(exist_ok=True)
report=[]
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  browser=getattr(p,engine).launch()
  for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,900)]:
   ctx=browser.new_context(viewport={'width':w,'height':h},reduced_motion='reduce')
   ctx.route('**/*', lambda route: route.continue_() if route.request.url.startswith(BASE) else route.fulfill(status=204,body=''))
   page=ctx.new_page();errors=[];page.on('pageerror',lambda err: errors.append(str(err)))
   page.goto(BASE+'/');page.evaluate('document.fonts.ready');page.wait_for_timeout(100)
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),(engine,w,'home overflow')
   assert page.locator('.col-card').count()==4
   for card in page.locator('.col-card').all():
    card.locator('.col-toggle').click();page.wait_for_timeout(80)
    col=card.get_attribute('data-col');selector=card.locator('select')
    for n in ([2] if col=='adois' else range(2,9)):
     if selector.count(): selector.select_option(str(n))
     for link in card.locator('[data-pkg-key]').all():
      msg=parse_qs(urlparse(link.get_attribute('href')).query)['text'][0]
      assert f'{n} pessoas' in msg and 'Estimativa:' in msg,(col,n,msg)
      tier=link.locator('..');assert f'{n} pessoas' in tier.locator('h4 small').inner_text()
      assert tier.locator('.tier-price').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(engine,w,col,'price overflow')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine,w,col,'open overflow')
   # Complete each collection through actual controls, including groups of eight and insufficient budget.
   page.locator('#qBegin').click()
   for idx,col in enumerate(['adois','celebrar','amigas','pedido']):
    if idx: page.locator('#qRestart').click()
    page.locator(f'.q-opt[data-v="{col}"]').click()
    if col!='adois': page.locator('.q-opt[data-v="8"]').click()
    page.locator('.q-opt[data-v="intimista"]').click()
    page.locator('.q-opt[data-v="sim"]').click()
    page.locator('.q-opt[data-v="500"]').click()
    page.locator('.q-opt[data-v="manha"]').click()
    assert page.locator('#qWa').is_visible()
    msg=parse_qs(urlparse(page.locator('#qWa').get_attribute('href')).query)['text'][0]
    assert f'{2 if col=="adois" else 8} pessoas' in msg
    if col!='adois': assert page.locator('.budget-note').count()>0
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine,w,'quiz overflow')
   page.locator('#qRestart').click();page.locator('.q-opt[data-v="adois"]').click()
   page.locator('#qBack').click();page.locator('.q-opt[data-v="pedido"]').click()
   assert page.locator('#qPane .q-title').inner_text()=='Quantas pessoas ao todo?'
   page.locator('.faq-q').first.click();assert page.locator('.faq-q').first.get_attribute('aria-expanded')=='true'
   assert page.evaluate("(()=>{try{packageForGuests('adois_ess',8);return false}catch(e){return e instanceof RangeError}})()")
   page.evaluate("document.querySelectorAll('img').forEach(i=>i.loading='eager')");page.wait_for_timeout(200)
   assert page.evaluate("[...document.images].every(i=>i.complete&&i.naturalWidth>0)"),(engine,w,'broken image')
   if engine=='chromium' and w in [390,768,1440]:
    page.locator('[data-col="celebrar"]').screenshot(path=str(OUT/f'home-{w}.png'))
   for deck in ['visao','resumo-executivo','parceria-pousadas']:
    page.goto(BASE+'/'+deck+'.html');page.evaluate('document.fonts.ready')
    total=page.locator('.slide').count()
    for i in range(total):
     page.wait_for_timeout(240)
     metrics=page.evaluate('''()=>{let s=document.querySelector('.slide.is-active'), c=document.querySelector('.ctl'),r=c.getBoundingClientRect();return {horizontal:s.scrollWidth>s.clientWidth+1, doc:document.documentElement.scrollWidth>innerWidth, bottom:s.getBoundingClientRect().bottom, controls:r.top, ch:r.height, height:innerHeight, overflow:s.scrollHeight>s.clientHeight+8, hint:[...s.querySelectorAll('.hint')].map(e=>getComputedStyle(e).color)}}''')
     assert not metrics['horizontal'] and not metrics['doc'],(engine,w,deck,i+1,metrics)
     assert metrics['bottom']<=metrics['controls']+1,(engine,w,deck,i+1,'overlap',metrics)
     assert metrics['controls']>=0 and metrics['controls']+metrics['ch']<=h+1
     if engine=='chromium' and w in [390,768,1440]:
      page.screenshot(path=str(OUT/f'{deck}-{w}-{i+1:02}.png'))
      if metrics['overflow']:
       page.locator('.slide.is-active').evaluate('(e)=>e.scrollTop=e.scrollHeight')
       page.wait_for_timeout(40);page.screenshot(path=str(OUT/f'{deck}-{w}-{i+1:02}-bottom.png'))
       assert page.locator('.scroll-cue').is_hidden(),(deck,w,i+1,'cue not hidden')
     if i<total-1: page.locator('#next').click()
    assert page.locator('#next').is_disabled()
    page.locator('#prev').click();page.wait_for_timeout(80)
    assert page.locator('#cnt').inner_text()==f'{total-1} / {total}'
    report.append({'engine':engine,'width':w,'deck':deck,'slides':total,'status':'ok'})
   assert not errors,(engine,w,errors)
   print(f'OK {engine} {w}x{h}: home, cards, quiz, FAQ, imagens e todos os decks',flush=True)
   ctx.close()
  browser.close()
(OUT/'report.json').write_text(json.dumps(report,indent=2))
print('OK: 350 slides/estados, 40 quizzes e 10 viewports sem overflow ou erros JS.',flush=True)
