"""Functional checks of the two compact studies. No real outbound traffic or leads."""
import os
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  browser=getattr(p,engine).launch()
  for width,height in [(320,700),(390,844),(768,1024),(820,1180),(1024,768),(1440,900),(844,390)]:
   for slug in ['compacto-tabs','compacto-linha']:
    ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion='reduce');external=[]
    def route(r):
     if r.request.url.startswith(BASE+'/'):r.continue_()
     else:external.append(r.request.url);r.abort()
    ctx.route('**/*',route);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/prototipos/'+slug+'.html?ocasiao=pedido&utm_source=instagram&utm_campaign=pedido')
    assert page.locator('[data-occasion=pedido]').get_attribute('aria-pressed')=='true'
    assert '549' in page.locator('#price').inner_text()
    assert page.locator('[data-guests="3"]').is_disabled()
    page.locator('[data-extra=bebidas]').check();page.locator('[data-extra=tabua]').check()
    page.locator('#more>summary').click();page.locator('[data-extra=extra30]').check()
    assert '806' in page.locator('#price').inner_text() and '2h30' in page.locator('#priceContext').inner_text()
    page.locator('[data-occasion=amigas]').click();assert page.locator('[data-extra=bebidas]').is_checked()
    page.locator('[data-guests="4"]').click();page.locator('[data-extra=baloes]').check()
    page.locator('[data-occasion=aniversario]').click();assert page.locator('[data-extra=baloes]').count()==0
    assert 'Balões já estão incluídos' in page.locator('#changeNotice').inner_text()
    assert '814' in page.locator('#price').inner_text()
    page.locator('[data-period="Pôr do sol"]').click();page.locator('#reviewButton').click()
    assert page.locator('#dock').is_hidden()
    msg=page.locator('#message').input_value()
    assert all(t in msg for t in ['814','4','2h30','Pôr do sol','instagram','não é permitido']),msg
    assert '3h' not in msg
    href=page.locator('#whatsapp').get_attribute('href');assert urlparse(href).path=='/5513988523663';assert parse_qs(urlparse(href).query)['text'][0]==msg
    page.locator('.optional>summary').click();page.locator('#name').fill('<img onerror=alert(1)>')
    assert '<img' in page.locator('#message').input_value() and page.locator('#review img').count()==0
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(slug,width,'dialog')
    page.keyboard.press('Escape');expect(page.locator('#review')).not_to_be_visible();expect(page.locator('#dock')).to_be_visible()
    page.locator('[data-occasion=adois]').focus();page.keyboard.press('Home');assert page.locator('[data-occasion=adois]').get_attribute('aria-pressed')=='true'
    assert '2 pessoas' in page.locator('#priceContext').inner_text()
    # All visible primary options are usable touch targets, not compressed chips.
    dims=page.locator('#occasions button,#guests button,#periods button').evaluate_all('(els)=>els.map(e=>e.getBoundingClientRect().height)')
    assert min(dims)>=44,(slug,width,dims)
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(slug,width)
    assert not errors,errors;assert not external,external
    if engine=='chromium' and width in [390,768,1440]:
     page.locator('#more>summary').click();page.locator('#config').scroll_into_view_if_needed();page.screenshot(path=f'/tmp/{slug}-{width}.png',full_page=True)
    ctx.close()
   print('OK',engine,width,height,'duas opções',flush=True)
  browser.close()
print('PASS 28 fluxos: mobile, tablet, desktop e horizontal; sem tráfego externo')
