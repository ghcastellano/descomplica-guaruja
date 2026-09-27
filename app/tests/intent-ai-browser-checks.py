"""AI-driven preferences and progressive flow, with mocked API and no paid calls/leads."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3002')
OUT=Path('.local/ai-widget-checks');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch()
  for width in [320,390,768,1440]:
   context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce');page=context.new_page();errors=[];calls=[];sent=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def ai(route):
    calls.append(route.request.post_data_json)
    route.fulfill(content_type='application/json',body=json.dumps({'source':'ai','interpretation':{'discovery':False,'vertical':'experiencias','category':'Celebrar','guests':50 if '50' in calls[-1]['text'] else 4,'neighborhood':'Tombo','date':'2027-01-15','period':'por-do-sol'}}))
   def receive(route):
    sent.append(route.request.post_data_json);route.fulfill(status=201,content_type='application/json',body=json.dumps({'url':'/pedidos/'+'b'*43,'protocol':'GU-AI-TESTE'}))
   page.route('**/api/city/interpret',ai);page.route('**/api/city/requests',receive)
   page.goto(BASE);page.get_by_label('Conte pra gente').fill('Meu aniversário com mais três pessoas no Tombo no dia 15/01/2027 ao pôr do sol')
   page.get_by_role('button',name='Descomplicar',exact=True).click()
   expect(page.locator('.concierge-match h3')).to_have_text('Celebrar')
   expect(page.get_by_role('button',name='4 pessoas',exact=True)).to_have_attribute('aria-pressed','true')
   expect(page.locator('.concierge-context')).to_contain_text('Tombo');expect(page.locator('.concierge-context')).to_contain_text('15/01/2027')
   expect(page.locator('.intent-response-note')).to_contain_text('com IA')
   page.locator('.intent-open').screenshot(path=str(OUT/f'{engine.name}-{width}.png'))
   assert page.url==BASE+'/' and page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.get_by_role('button',name='Continuar com a ideia').click()
   expect(page.get_by_label('Seu nome')).to_be_visible() # date & location already known: no repeated questions
   page.get_by_label('Seu nome').fill('TESTE PREFERÊNCIAS')
   page.get_by_role('button',name='Editar pedido',exact=True).click()
   expect(page.get_by_label('Ajuste sua ideia')).to_be_focused()
   page.get_by_role('button',name='Manter ideia anterior').click()
   expect(page.get_by_label('Seu nome')).to_have_value('TESTE PREFERÊNCIAS')
   page.get_by_label('WhatsApp ou e-mail').fill('teste@example.invalid');page.locator('input[type=checkbox]').check()
   page.get_by_role('button',name='Continuar',exact=False).click()
   expect(page.locator('.request-review')).to_contain_text('Pôr do sol')
   page.get_by_role('button',name='Enviar para avaliação').click()
   expect(page.get_by_role('heading',name='Sua ideia já tem um próximo passo.')).to_be_visible()
   assert len(calls)==1 and len(sent)==1
   assert sent[0]['guests']==4 and sent[0]['neighborhood']=='Tombo' and sent[0]['preferredDate']=='2027-01-15' and sent[0]['period']=='por-do-sol'
   page.goto(BASE);page.get_by_label('Conte pra gente').fill('Aniversário para 50 pessoas');page.get_by_role('button',name='Descomplicar',exact=True).click()
   expect(page.get_by_role('heading',name='Hoje, nossas experiências recebem de 2 a 8 pessoas.')).to_be_visible()
   assert page.locator('.concierge-price').count()==0
   page.get_by_role('button',name='Ajustar minha ideia').click();page.get_by_label('Ajuste sua ideia').fill('Aniversário para 4 pessoas');page.get_by_role('button',name='Atualizar ideia').click();expect(page.locator('.concierge-match h3')).to_have_text('Celebrar')
   before=len(calls);page.get_by_role('button',name='Editar pedido',exact=True).click();page.get_by_role('button',name='Atualizar ideia').click();expect(page.locator('.concierge-match h3')).to_have_text('Celebrar');assert len(calls)==before # same prompt uses memory cache
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
   context.close()
  browser.close();print(engine.name+': AI preferences, edits, capacity, cache and 4 widths OK',flush=True)
