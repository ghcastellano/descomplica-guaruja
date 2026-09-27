"""Responsive onboarding and service briefing; mocked writes and AI, no messages or payments."""
import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3002');OUT=Path('.local/network-checks');OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch()
  for width in [320,390,768,1440]:
   context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce');page=context.new_page();errors=[];sent=[];city=[]
   page.on('pageerror',lambda e:errors.append(str(e)))
   def apply(route):
    sent.append(route.request.post_data_json);route.fulfill(status=503 if len(sent)==1 else 201,content_type='application/json',body=json.dumps({'error':'Falha de teste. Tente novamente.'} if len(sent)==1 else {'url':'/rede/'+'a'*43,'protocol':'REDE-TESTE'}))
   page.route('**/api/network/apply',apply)
   page.goto(BASE+'/parceiros');page.get_by_label('Nome profissional ou do negócio').fill('TESTE PROFISSIONAL');page.get_by_label('Telefone ou e-mail para contato').fill('teste@example.invalid')
   page.locator('summary').filter(has_text='Hidráulica').click();page.get_by_label('Reparo ou troca de torneira',exact=True).check();page.get_by_role('button',name='Continuar').click()
   page.get_by_label('Bairros e regiões em que atende').fill('Tombo e Astúrias');page.get_by_label('Quando costuma atender?').fill('Dias úteis de manhã');page.get_by_label('Conte sobre seu trabalho').fill('TESTE: experiência em reparos de torneiras e vazamentos.');page.get_by_role('button',name='Continuar').click()
   boxes=page.locator('input[type=checkbox]');assert boxes.count()==4
   for checkbox in boxes.all():expect(checkbox).not_to_be_checked()
   expect(boxes.nth(3)).to_be_disabled() # no WhatsApp opt-in with email-only contact
   boxes.nth(0).check();boxes.nth(1).check();page.locator('.partner-form').screenshot(path=str(OUT/f'{engine.name}-{width}.png'))
   page.get_by_role('button',name='Aceitar e enviar cadastro').click();expect(page.locator('.partner-form .feedback[role=alert]')).to_contain_text('Falha de teste')
   page.get_by_role('button',name='Aceitar e enviar cadastro').click();expect(page.get_by_role('heading',name='Seu trabalho merece ser conhecido.')).to_be_visible()
   assert sent[0]==sent[1] and not sent[1]['publishPermission'] and not sent[1]['whatsappPermission'] and sent[1]['accepted']
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   def intake(route):
    city.append(route.request.post_data_json);route.fulfill(status=201,content_type='application/json',body=json.dumps({'url':'/pedidos/'+'b'*43,'protocol':'GU-TESTE'}))
   page.route('**/api/city/requests',intake)
   page.goto(BASE+'/descomplicar?servico=torneira');expect(page.get_by_label('Qual serviço combina com seu pedido?')).to_have_value('torneira')
   page.get_by_label('Em qual ambiente e o que acontece com a torneira?').fill('Cozinha, está pingando');page.get_by_label('É reparo ou você já tem uma peça para substituir?').fill('Preciso de reparo');page.get_by_label('Conte um pouco mais').fill('Minha torneira da cozinha está pingando há dois dias.')
   page.get_by_role('button',name='Continuar com a ideia').click();page.get_by_role('button',name='Continuar',exact=False).click();page.get_by_role('button',name='Tombo',exact=True).click();page.get_by_role('button',name='Continuar',exact=False).click();page.get_by_label('Seu nome').fill('TESTE CLIENTE');page.get_by_label('WhatsApp ou e-mail').fill('teste@example.invalid');page.locator('input[type=checkbox]').check();page.get_by_role('button',name='Continuar',exact=False).click()
   expect(page.locator('.request-review')).to_contain_text('Cozinha, está pingando');page.get_by_role('button',name='Enviar para avaliação').click();expect(page.get_by_role('heading',name='Sua ideia já tem um próximo passo.')).to_be_visible();assert city[0]['serviceId']=='torneira' and len(city[0]['serviceAnswers'])==2
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');assert not errors,errors
   page.goto(BASE+'/resolver');page.locator('.service-catalog summary').filter(has_text='Hidráulica').click();expect(page.get_by_role('link',name='Sob consulta Reparo ou troca de torneira Detalhar meu pedido')).to_be_visible()
   context.close()
  browser.close();print(engine.name+': onboarding, independent choices, retries, service questions and four widths OK',flush=True)
