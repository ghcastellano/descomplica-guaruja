"""Functional review of isolated home prototypes; no external requests or real leads."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
ENGINES=os.environ.get('TEST_BROWSERS','chromium,webkit').split(',')
SLUGS=['por-ocasiao','tres-perguntas','experiencia-unica','conversa-direta']
checks=0
with sync_playwright() as p:
 for engine in ENGINES:
  browser=getattr(p,engine).launch()
  for width,height in [(320,700),(390,844),(768,1024),(1440,1000)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   external=[]
   def route(r):
    if r.request.url.startswith(BASE):r.continue_()
    else:external.append(r.request.url);r.abort()
   ctx.route('**/*',route)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   for slug in SLUGS:
    page.goto(BASE+'/prototipos/'+slug+'.html');page.evaluate('document.fonts.ready')
    assert page.locator('meta[name=robots]').get_attribute('content')=='noindex,nofollow'
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(slug,width)
    if slug=='por-ocasiao':
     page.locator('[data-purpose=aniversario]').click();page.locator('#guests').select_option('4');page.locator('#place').select_option('praia')
    elif slug=='tres-perguntas':
     page.locator('[data-answer=aniversario]').click();page.locator('[data-answer="4"]').click();page.locator('#wizardBack').click();page.locator('[data-answer="4"]').click();page.locator('[data-answer=praia]').click()
    elif slug=='experiencia-unica':
     page.locator('[data-chip=aniversario]').click();page.locator('#guests').select_option('4');page.locator('#place').select_option('praia')
    else:
     page.locator('button[type=submit]').click();assert not page.locator('#review').is_visible()
     page.locator('#briefPurpose').select_option('adois');assert page.locator('#briefGuests').is_disabled();assert page.locator('#briefGuests').input_value()=='2'
     page.locator('#briefPurpose').select_option('aniversario');page.locator('#briefGuests').select_option('4');page.locator('#briefPlace').select_option('praia');page.locator('details').first.locator('summary').click();page.locator('#briefNotes').fill('<img src=x onerror=alert(1)> mãe & família');page.locator('button[type=submit]').click()
    if slug!='conversa-direta':page.locator('[data-review]').click()
    assert page.locator('#review').is_visible();msg=page.locator('#message').input_value()
    assert '90 minutos' in msg and '2h30' in msg,(slug,msg)
    assert 'R$ 630–830' in msg and '4 pessoas' in msg and 'Mini bolo' in msg and 'Praia' in msg,(slug,msg)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(slug,width,'dialog')
    page.keyboard.press('Escape');assert not page.locator('#review').is_visible()
    if slug!='conversa-direta':
     page.locator('#detail').uncheck();assert 'R$ 530–670' in page.locator('#price').inner_text()
     page.locator('#guests').select_option('5');assert page.locator('#price').inner_text()=='Vamos orçar com você';page.locator('[data-review]').click();assert '5–8 pessoas' in page.locator('#message').input_value();assert 'Estimativa ilustrativa total' not in page.locator('#message').input_value();page.locator('#editReview').click()
     if slug=='por-ocasiao':page.locator('[data-purpose=adois]').click()
     if slug=='experiencia-unica':page.locator('[data-chip=adois]').click()
     if slug!='tres-perguntas':assert page.locator('#guests').input_value()=='2' and page.locator('#guests').is_disabled()
     else:page.locator('#restart').click();assert page.locator('[data-answer=adois]').is_visible()
    else:
     assert '<img' in msg and not page.locator('#review img').count()
     page.locator('#briefPurpose').select_option('pedido');page.locator('#briefGuests').select_option('2');page.locator('#briefPlace').select_option('turistico');page.locator('button[type=submit]').click();assert 'R$ 630–830' in page.locator('#message').input_value() and 'Buquê' in page.locator('#message').input_value();page.locator('#closeReview').click()
     page.locator('#detail').uncheck();page.locator('button[type=submit]').click();assert 'R$ 450–550' in page.locator('#message').input_value();assert 'Buquê' not in page.locator('#message').input_value();page.locator('#closeReview').click()
    if engine=='chromium' and width in [390,1440]:page.screenshot(path=f'/tmp/checked-{slug}-{width}.png',full_page=True)
    assert not errors,errors;assert not external,external;checks+=1
    print('OK',engine,width,slug,flush=True)
   page.goto(BASE+'/laboratorio-home.html');assert page.locator('.compare-card').count()==4
   assert '520,54' in page.locator('#costPrice').inner_text()
   page.locator('#costCount').fill('4');assert '683,21' in page.locator('#costPrice').inner_text()
   page.locator('#costCount').fill('0');assert 'Revise' in page.locator('#costPrice').inner_text()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),('hub',width)
   ctx.close()
  ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844});page=ctx.new_page()
  for slug in SLUGS:
   page.goto(BASE+'/prototipos/'+slug+'.html');assert page.locator('noscript').inner_text();assert page.locator('h1').is_visible()
  ctx.close();browser.close()
print('PASS',checks,'fluxos completos + simulador, sem tráfego externo ou erros JS')
