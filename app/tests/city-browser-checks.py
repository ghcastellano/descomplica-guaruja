"""V2 preview verification. One labelled QA request is saved and closed on Neon.
No real messages or payments. Run only against the local 3002 preview.
"""
from pathlib import Path
import json, time
from playwright.sync_api import sync_playwright, expect
BASE='http://127.0.0.1:3002'
env=dict(l.split('=',1) for l in Path('.env.local').read_text().splitlines() if '=' in l and not l.startswith('#'))
assert env['APP_ORIGIN']==BASE and env['APP_MODE']=='local-neon'
out=Path('.local/v2-checks');out.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch();context=browser.new_context();page=context.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  for width,height in [(320,740),(390,844),(768,1024),(1440,1000)]:
   page.set_viewport_size({'width':width,'height':height})
   for route in ['/','/resolver','/casa','/experiencias','/descobrir','/parceiros','/descomplicar','/pedidos','/voce','/privacidade','/login']:
    print(engine.name,width,route,flush=True);r=page.goto(BASE+route);assert r.status==200,(route,r.status)
    page.evaluate('document.fonts.ready');page.locator('main').wait_for(state='visible')
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+1'),(engine.name,width,route,'overflow')
    assert page.locator('h1').count()==1,(route,'h1')
    if route=='/':

     for image in page.locator('img').all():
      image.scroll_into_view_if_needed();expect(image).to_have_js_property('complete',True)
     page.wait_for_timeout(150)
     assert page.evaluate('Array.from(document.images).every(i=>i.complete&&i.naturalWidth>0)'),('broken images',engine.name,width)
     page.evaluate('scrollTo(0,0)');page.screenshot(path=str(out/f'home-{engine.name}-{width}.png'),full_page=True)
   page.goto(BASE+'/descomplicar?tipo=experiencias&categoria=Celebrar&pessoas=8')
   expect(page.get_by_role('button',name='8 pessoas',exact=True)).to_have_attribute('aria-pressed','true')
   page.get_by_role('button',name='Escolher outra opção').click();page.locator('.choice-tile').filter(has_text='A Dois').click()
   expect(page.get_by_text('2 pessoas · exclusivo para o casal')).to_be_visible()
  page.goto(BASE+'/experiencias');page.get_by_label('Coleção').select_option('Celebrar');page.get_by_label('Total de pessoas').select_option('8')
  expect(page.locator('.estimate-amount').first).to_be_visible()
  assert not errors,errors
  context.close();browser.close()
 print('Responsive views passed: Chromium + WebKit, 320/390/768/1440, 11 routes.')
 browser=p.chromium.launch();client=browser.new_context(viewport={'width':390,'height':844});page=client.new_page()
 page.goto(BASE+'/descomplicar?tipo=resolver&categoria=Limpeza')
 page.get_by_label('Conte um pouco mais').fill('VALIDAÇÃO TÉCNICA V2. Pedido fictício para verificar o fluxo, sem atendimento real.')
 page.get_by_role('button',name='Continuar').click();page.get_by_role('button',name='Continuar').click();page.get_by_label('Bairro ou local de preferência').fill('Astúrias · teste técnico')
 page.get_by_role('button',name='Continuar').click();name='Validação técnica V2 '+str(int(time.time()))
 page.get_by_label('Seu nome').fill(name);page.get_by_label('WhatsApp ou e-mail').fill('qa@example.invalid');page.locator('input[type=checkbox]').check()
 page.get_by_role('button',name='Continuar').click();page.get_by_role('button',name='Enviar para avaliação').click()
 page.get_by_role('link',name='Acompanhar meu pedido').click();page.wait_for_url('**/pedidos/*');tracking=page.url;expect(page.get_by_role('heading',name='Pedido recebido.')).to_be_visible()
 assert 'qa@example.invalid' not in page.locator('body').inner_text()
 staff=browser.new_context();admin=staff.new_page();admin.goto(BASE+'/operacao');expect(admin).to_have_url(BASE+'/login')
 admin.get_by_label('Código de acesso da equipe').fill(env['LOCAL_ACCESS_CODE']);admin.get_by_role('button',name='Entrar na operação').click();admin.wait_for_url('**/operacao')
 admin.get_by_role('link').filter(has=admin.get_by_role('heading',name=name,exact=True)).click()
 request_id=admin.url.rsplit('/',1)[-1]
 admin.get_by_label('Atualizar etapa').select_option('reviewing');admin.get_by_label('Atualização que o cliente verá').fill('Pedido de validação em análise pela equipe.')
 admin.get_by_label('Nota interna (só a equipe vê)').fill('QA_INTERNA_NAO_PUBLICAR');admin.get_by_role('button',name='Registrar atualização').click()
 expect(admin.get_by_text('Pedido de validação em análise pela equipe.',exact=True)).to_be_visible()
 page.reload();expect(page.get_by_role('heading',name='Em avaliação.')).to_be_visible();assert 'QA_INTERNA_NAO_PUBLICAR' not in page.locator('body').inner_text()
 assert client.request.patch(BASE+'/api/city/requests/'+request_id,headers={'Origin':BASE},data={'version':2,'status':'cancelled','publicNote':'tentativa sem acesso','internalNote':''}).status==401
 assert client.request.post(BASE+'/api/city/requests',headers={'Origin':'https://example.invalid'},data={}).status==403
 admin.get_by_label('Atualizar etapa').select_option('cancelled');admin.get_by_label('Atualização que o cliente verá').fill('Validação técnica concluída. Este pedido fictício está encerrado; nenhum serviço foi solicitado.')
 admin.get_by_label('Nota interna (só a equipe vê)').fill('Teste de ponta a ponta encerrado.');admin.get_by_role('button',name='Registrar atualização').click();expect(admin.get_by_text('Este pedido está encerrado. O histórico foi preservado.')).to_be_visible()
 page.reload();expect(page.get_by_role('heading',name='Encerrado.')).to_be_visible()
 page.goto(BASE+'/pedidos');expect(page.get_by_text('Acompanhar →')).to_be_visible()
 assert page.goto(BASE+'/pedidos/'+'x'*43).status==404
 admin.screenshot(path=str(out/'operacao-pedido.png'),full_page=True)
 print('Neon end-to-end passed: intake, tracking, login, updates, PII isolation, unauthorized mutation rejection, closed QA request.')
 browser.close()
