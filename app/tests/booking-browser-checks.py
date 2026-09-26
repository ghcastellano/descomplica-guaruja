"""Real local browser flow; simulated payments only, external traffic blocked."""
from pathlib import Path
import re, uuid
from datetime import date, timedelta
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
CODE=re.search(r'^LOCAL_ACCESS_CODE=(.+)$',(ROOT/'.env.local').read_text(),re.M).group(1)
BASE='http://127.0.0.1:3001'
def widths(page):
 for w,h in [(350,680),(390,844),(768,1024),(1440,900)]:
  page.set_viewport_size({'width':w,'height':h})
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),page.url
 page.set_viewport_size({'width':390,'height':844})
def local(context):context.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else r.abort())
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  browser=getattr(p,engine).launch();staff=browser.new_context(viewport={'width':390,'height':844});local(staff)
  page=staff.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/login');page.locator('[name=code]').fill(CODE);page.get_by_role('button',name='Entrar na operação').click();page.wait_for_url(BASE+'/')
  page.get_by_role('link',name='+ Registrar conversa').click();widths(page)
  page.locator('[name=name]').fill('Conversa QA '+engine+' '+str(uuid.uuid4())[:6]);page.locator('[name=contact]').fill('teste@example.invalid');page.locator('[name=notes]').fill('HISTORIA_INTERNA_NAO_PUBLICA');page.get_by_role('button',name='Registrar atendimento').click();page.wait_for_url('**/atendimentos/*')
  assert page.locator('[name=packageId]').input_value()==''
  page.locator('[name=packageId]').select_option('amigas_ess');page.locator('[name=guests]').select_option('8');page.get_by_role('button',name='Preparar proposta').click();page.wait_for_url('**/propostas/*')
  page.locator('input[type=checkbox]').check();page.get_by_role('button',name='Liberar proposta de teste').click();link=page.get_by_role('link',name='Abrir visão do cliente');link.wait_for();url=link.get_attribute('href');proposal=page.url.rsplit('/',1)[-1]
  client=browser.new_context(viewport={'width':390,'height':844});local(client);cp=client.new_page();cp.on('pageerror',lambda e:errors.append(str(e)));cp.goto(url);widths(cp)
  assert 'HISTORIA_INTERNA_NAO_PUBLICA' not in cp.locator('body').inner_text()
  cp.get_by_label('Local de demonstração').select_option('jardim-demo')
  # Find free date even when earlier QA sessions have occupied the crew.
  for days in range(7,55):
   cp.get_by_label('Data desejada').fill((date.today()+timedelta(days=days)).isoformat());cp.get_by_role('button',name='Consultar horários').click();cp.locator('.availability').wait_for()
   cp.wait_for_function("!document.querySelector('form button').disabled")
   if cp.locator('.slot input').count():break
  assert cp.locator('.slot input').count()>0
  cp.locator('.slot input').first.check();cp.get_by_role('button',name='Separar este horário').click();cp.get_by_text('Horário separado',exact=True).wait_for();widths(cp)
  cp.get_by_role('button',name='Aceitar proposta e continuar').is_disabled()
  cp.locator('input[type=checkbox]').check();cp.get_by_role('button',name='Aceitar proposta e continuar').click();cp.get_by_text('Aguardando sinal',exact=True).wait_for()
  forbidden=client.request.post(BASE+'/api/booking/payment',data={},headers={'Origin':BASE});assert forbidden.status==401
  cp.screenshot(path=f'/tmp/descomplica-booking-{engine}-mobile.png',full_page=True)
  page.goto(BASE+'/agenda?proposal='+proposal);widths(page);page.get_by_role('button',name='Simular recebimento do sinal').click();page.get_by_text('Reserva confirmada',exact=True).wait_for()
  cp.reload();cp.get_by_text('Reserva confirmada',exact=True).wait_for()
  page.get_by_role('button',name='Simular recebimento do saldo').click();page.get_by_text('Pagamento concluído',exact=True).wait_for();cp.reload();cp.get_by_text('Pagamento concluído',exact=True).wait_for();widths(cp)
  page.set_viewport_size({'width':1440,'height':900});page.screenshot(path=f'/tmp/descomplica-agenda-{engine}.png',full_page=True)
  assert not errors,errors
  browser.close();print(engine+': conversa → proposta → horário → aceite → sinal → saldo; privacidade/4viewports OK')
