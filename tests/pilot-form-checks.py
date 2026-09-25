"""Valida o formulário sem enviar mensagens ou dados reais para serviços externos."""
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  b=engine.launch()
  for width,height in [(390,844),(768,1024),(1440,900)]:
   ctx=b.new_context(viewport={'width':width,'height':height},reduced_motion='reduce')
   external=[]
   def block(route):
    external.append(route.request.url);route.fulfill(status=204,body='')
   ctx.route('https://**/*',block)
   page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto('http://127.0.0.1:3000/parceria-pousadas.html#14');page.wait_for_timeout(250)
   link=page.locator('[data-pilot-whatsapp]')
   initial=parse_qs(urlparse(link.get_attribute('href')).query)['text'][0]
   assert initial.count('A combinar')==3 and 'toque para preencher' not in initial
   page.locator('#pilotSpace').fill('Jardim & varanda — Pousada São João + mar')
   page.locator('#pilotDate').fill('2026-10-18')
   page.locator('#pilotFormat').select_option('B')
   message=parse_qs(urlparse(link.get_attribute('href')).query)['text'][0]
   assert 'Jardim & varanda — Pousada São João + mar' in message
   assert '18/10/2026' in message and 'B — Parceiro comercial' in message
   assert page.locator('#cnt').inner_text()=='14 / 14'
   assert parse_qs(urlparse(page.locator('[data-pilot-email]').get_attribute('href')).query)['body'][0]==message
   page.reload();page.wait_for_timeout(250)
   assert page.locator('#pilotSpace').input_value()=='Jardim & varanda — Pousada São João + mar'
   assert page.locator('#pilotDate').input_value()=='2026-10-18'
   assert page.locator('#pilotFormat').input_value()=='B'
   assert parse_qs(urlparse(link.get_attribute('href')).query)['text'][0]==message
   page.locator('#pilotSpace').fill('');page.locator('#pilotDate').fill('');page.locator('#pilotFormat').select_option('')
   assert parse_qs(urlparse(link.get_attribute('href')).query)['text'][0].count('A combinar')==3
   assert page.locator('.slide.is-active').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
   assert not external and not errors,(external,errors)
   if engine.name=='chromium':
    page.locator('.slide.is-active').evaluate('(e)=>e.scrollTop=e.scrollHeight')
    page.screenshot(path=f'/tmp/pilot-form-{width}.png')
   print(engine.name,width,'OK: WhatsApp, e-mail, rascunho e campos sem envio automático',flush=True)
   ctx.close()
  b.close()
