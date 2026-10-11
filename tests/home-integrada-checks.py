"""Exercise only the isolated hybrid home; never send WhatsApp messages or real leads."""
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  browser=getattr(p,engine).launch()
  for width,height in [(320,700),(390,844),(768,1024),(1440,900),(844,390)]:
   ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   external=[]
   def route(r):
    if r.request.url.startswith(BASE+'/'):r.continue_()
    else:external.append(r.request.url);r.abort()
   ctx.route('**/*',route)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE+'/home-proposta.html?ocasiao=pedido&utm_source=instagram&utm_medium=organic_social&utm_campaign=pedido_intimista&utm_content=story_buque#colecoes')
   assert page.locator('meta[name=robots]').get_attribute('content')=='noindex,nofollow'
   assert not page.locator('section#quiz').count()
   assert page.locator('[data-occasion=pedido]').get_attribute('aria-pressed')=='true'
   assert page.locator('#hiGuests').is_disabled()
   assert '549' in page.locator('#hiTotal').inner_text()
   assert 'pedido-casamento' not in page.locator('#hiPhoto').get_attribute('src')
   initial_height=page.locator('#hiExperience').bounding_box()['height']
   assert initial_height<1700,(width,initial_height)
   rects=page.locator('.hi-fields select').evaluate_all('(els)=>els.map(e=>({height:e.getBoundingClientRect().height,font:parseFloat(getComputedStyle(e).fontSize)}))')
   assert all(r['height']==48 and r['font']>=16 for r in rects),rects
   page.locator('#hiExtras>summary').click()
   page.locator('[data-addon=tabua]').check();page.locator('[data-addon=extra30]').check()
   assert '757' in page.locator('#hiTotal').inner_text()
   assert '2h30' in page.locator('#hiSummary').inner_text()
   page.locator('#hiPlace').select_option('praia');page.locator('#hiPeriod').select_option(label='Pôr do sol')
   page.locator('#hiSummary').scroll_into_view_if_needed()
   assert page.locator('#hiDock').is_visible()
   assert '757' in page.locator('#hiDockPrice').inner_text()
   page.locator('#hiDockReview').click()
   assert page.locator('#hiDock').is_hidden()
   msg=page.locator('#hiMessage').input_value()
   assert all(t in msg for t in ['SIMULAÇÃO','2h30','757','Praia','não é permitido levar alimentos ou bebidas próprios','instagram','pedido_intimista']),msg
   url=page.locator('#hiWhatsApp').get_attribute('href')
   assert urlparse(url).netloc=='wa.me' and urlparse(url).path=='/5513988523663'
   assert parse_qs(urlparse(url).query)['text'][0]==msg
   assert 'envio da mensagem não confirmado' in page.locator('#hiEmailBody').text_content()
   page.keyboard.press('Escape');assert not page.locator('#hiReview').is_visible()
   page.locator('[data-occasion=celebrar]').click()
   page.locator('.hi-included>summary').click()
   assert 'Mini bolo' in page.locator('#hiIncludedDetail').inner_text()
   page.locator('.hi-included>summary').click()
   assert page.locator('[data-addon=baloes]').count()==0
   page.locator('#hiGuests').select_option('4')
   # 399 + 2*79 +149 +59; retained extras remain visible on change of occasion.
   assert '765' in page.locator('#hiTotal').inner_text()
   page.locator('[data-addon=extra30]').uncheck();assert '2h30' not in page.locator('#hiSummary').inner_text()
   page.locator('[data-occasion=amigas]').click();page.locator('[data-addon=baloes]').check()
   assert '735' in page.locator('#hiTotal').inner_text()
   page.locator('[data-occasion=celebrar]').click();assert '706' in page.locator('#hiTotal').inner_text()
   page.locator('[data-occasion=adois]').click();assert page.locator('#hiGuests').input_value()=='2'
   page.locator('.hi-contact summary').click();page.locator('#hiPreviewEmail').click();assert page.locator('#hiContactError').inner_text()
   page.locator('#hiPhone').fill('13999999999');page.locator('#hiContactTime').select_option(label='Tarde');page.locator('#hiPreviewEmail').click()
   email=page.locator('#hiEmailBody').inner_text()
   assert all(t in email for t in ['13999999999','Tarde','instagram','story_buque','contato solicitado']),email
   assert '13999999999' not in page.evaluate('JSON.stringify(sessionStorage)')
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(engine,width,'dialog')
   page.locator('#hiBack').click()
   page.locator('[data-help]').click();assert page.locator('#hiEmailExample').is_hidden();page.locator('#hiClose').click()
   assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(engine,width)
   for img in page.locator('img').all():
    img.scroll_into_view_if_needed()
    page.wait_for_function('(img)=>img.complete && img.naturalWidth>0',arg=img.element_handle())
   if engine=='chromium' and width in [390,1440]:page.screenshot(path=f'/tmp/home-integrada-{width}.png',full_page=True)
   assert not errors,errors;assert not external,external
   print('OK',engine,width,'configuração fechada',round(initial_height),'px','ocasiões, soma, limite, adicionais, WhatsApp e prévia de e-mail',flush=True)
   ctx.close()
  ctx=browser.new_context(java_script_enabled=False);page=ctx.new_page();page.goto(BASE+'/home-proposta.html')
  assert page.locator('h1').is_visible() and page.locator('noscript').is_visible();ctx.close();browser.close()
print('PASS: 10 combinações navegador/tela, sem envio externo')
