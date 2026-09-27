"""Intent response stays on the home. API intercepted: no real lead or payment."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3002')
OUT=Path('.local/widget-checks');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch()
  for width in [320,390,768,1440]:
   context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce');page=context.new_page();errors=[]
   page.on('pageerror',lambda e:errors.append(str(e)));sent=[]
   def receive(route):
    sent.append(route.request.post_data_json)
    route.fulfill(status=503 if len(sent)==1 else 201,content_type='application/json',body=json.dumps({'error':'Teste de falha. Tente novamente.'} if len(sent)==1 else {'url':'/pedidos/'+'a'*43,'protocol':'GU-TESTE'}))
   page.route('**/api/city/requests',receive)
   # Deterministic fallback tests never call a paid provider.
   page.route('**/api/city/interpret',lambda route:route.fulfill(status=503,body='{}'))
   page.goto(BASE);page.get_by_label('Conte pra gente').fill('Uma experiência para 4 amigas na praia')
   page.get_by_role('button',name='Descomplicar',exact=True).click()
   expect(page.locator('.concierge-match h3')).to_have_text('Entre Amigas');expect(page.get_by_role('button',name='4 pessoas',exact=True)).to_have_attribute('aria-pressed','true')
   assert page.url==BASE+'/'
   expect(page.locator('.concierge-price')).to_contain_text('R$');assert page.locator('.intake-aside').count()==0
   for img in page.locator('.concierge-match img').all():expect(img).to_have_js_property('complete',True)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   page.locator('.intent-open').screenshot(path=str(OUT/f'{engine.name}-{width}.png'))
   page.get_by_role('button',name='Continuar com a ideia').click();page.get_by_role('button',name='Pôr do sol',exact=True).click();page.get_by_role('button',name='Continuar',exact=False).click()
   page.get_by_role('button',name='Astúrias',exact=True).click();page.get_by_role('button',name='Continuar',exact=False).click()
   page.get_by_label('Seu nome').fill('TESTE WIDGET');page.get_by_label('WhatsApp ou e-mail').fill('teste@example.invalid');page.locator('input[type=checkbox]').check();page.get_by_role('button',name='Continuar',exact=False).click()
   expect(page.locator('.request-review')).to_contain_text('Pôr do sol');page.get_by_role('button',name='Enviar para avaliação').click();expect(page.locator('.feedback[role=alert]')).to_contain_text('Teste de falha')
   page.get_by_role('button',name='Enviar para avaliação').click();expect(page.get_by_role('heading',name='Sua ideia já tem um próximo passo.')).to_be_visible()
   assert page.url==BASE+'/'
   assert sent[0]==sent[1] and sent[1]['guests']==4 and sent[1]['period']=='por-do-sol' and sent[1]['neighborhood']=='Astúrias'
   expect(page.get_by_role('link',name='Acompanhar meu pedido')).to_have_attribute('href','/pedidos/'+'a'*43)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
   page.goto(BASE);page.get_by_label('Conte pra gente').fill('O que fazer no Guarujá?');page.get_by_role('button',name='Descomplicar',exact=True).click();expect(page.get_by_role('link',name='Conhecer a cidade')).to_be_visible();assert page.url==BASE+'/'
   page.goto(BASE);page.get_by_role('button',name='Limpeza da casa').click();expect(page.locator('.concierge-match h3')).to_have_text('Limpeza');assert page.locator('.concierge-price').count()==0
   context.close()
  browser.close();print(engine.name+': widget inline, catálogo, confirmação, retry e 4 larguras OK',flush=True)
