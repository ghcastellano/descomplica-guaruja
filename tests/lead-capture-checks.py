"""Capture failures must preserve context, never promise receipt; external traffic intercepted."""
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3000'
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  b=getattr(p,engine).launch()
  for width in [320,768,1440]:
   c=b.new_context(viewport={'width':width,'height':900}, reduced_motion='reduce')
   attempts=[]; outcome=['fail']
   def route(r):
    if r.request.url.startswith(BASE):r.continue_()
    elif r.request.method=='POST' and 'lead_capture' in (r.request.post_data or ''):
     attempts.append(r.request.post_data)
     if outcome[0]=='fail':r.abort()
     else:r.fulfill(status=200,body='ok')
    else:r.fulfill(status=204,body='')
   c.route('**/*',route);page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.goto(BASE);page.locator('#qBegin').click()
   expect(page.locator('.q-title[tabindex]')).to_be_focused()
   for value in ['amigas','8','intimista','nao','1200','manha','praia']:
    page.locator('.q-opt[data-v="'+value+'"]').click()
   expect(page.locator('.q-result h3')).to_be_focused()
   expect(page.locator('#qCaptureFallback')).to_be_hidden()
   phone=page.get_by_label('Seu WhatsApp com DDD');phone.fill('123')
   page.locator('#qCaptureSend').click();assert not attempts
   phone.fill('(13) 99999-9999');page.locator('#qCaptureTime').select_option('tarde')
   page.locator('#qCaptureSend').click();expect(page.locator('#qCaptureStatus')).to_contain_text('Não foi possível')
   assert len(attempts)==1
   msg=parse_qs(urlparse(page.locator('#qCaptureFallback').get_attribute('href')).query)['text'][0]
   for value in ['8 pessoas','(13) 99999-9999','Tarde','na praia']:assert value in msg
   assert parse_qs(urlparse(page.locator('#qWa').get_attribute('href')).query)['text'][0]==msg
   expect(page.locator('#qCaptureSend')).to_be_enabled()
   outcome[0]='ok';page.locator('#qCaptureSend').click()
   expect(page.locator('#qCaptureStatus')).to_contain_text('Para confirmar o recebimento')
   assert len(attempts)==2
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine,width)
   assert not errors,errors
   c.close()
  b.close();print(engine+': captura, falha/retry, validação, teclado e 3 larguras OK',flush=True)
