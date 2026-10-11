"""Check the compact selectors inside the complete, isolated original home."""
from playwright.sync_api import sync_playwright,expect
BASE='http://127.0.0.1:3000'
with sync_playwright() as p:
 for engine in ['chromium','webkit']:
  b=getattr(p,engine).launch()
  for width,height in [(320,700),(390,844),(768,1024),(1024,768),(1440,900),(844,390)]:
   for slug in ['home-completa-tabs','home-completa-linha']:
    ctx=b.new_context(viewport={'width':width,'height':height},reduced_motion='reduce');external=[]
    def route(r):
     if r.request.url.startswith(BASE+'/'):r.continue_()
     else:external.append(r.request.url);r.abort()
    ctx.route('**/*',route);page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/'+slug+'.html')
    assert page.locator('main>section').count()==6
    assert all(page.locator(s).count()==1 for s in ['.hero','#como','#colecoes','#momentos','#faq','.final','body>footer'])
    assert not page.locator('#quiz').count()
    assert 'Experiências montadas à beira-mar' in page.locator('h1').inner_text()
    assert page.locator('#dock').is_hidden()
    page.locator('.hero a[href="#colecoes"]').click()
    page.locator('[data-occasion=aniversario]').click();page.locator('[data-guests="4"]').click()
    page.locator('[data-extra=bebidas]').check();page.locator('#more>summary').click();page.locator('[data-extra=extra30]').check()
    assert '665' in page.locator('#price').inner_text()
    page.locator('#selection').scroll_into_view_if_needed();expect(page.locator('#dock')).to_be_visible();page.locator('#reviewButton').click()
    expect(page.locator('#review')).to_be_visible();assert '2h30' in page.locator('#message').input_value()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth')
    page.keyboard.press('Escape');expect(page.locator('#review')).not_to_be_visible()
    page.locator('#faq .faq-q').first.click();assert page.locator('#faq .faq-q').first.get_attribute('aria-expanded')=='true'
    page.locator('body>footer').scroll_into_view_if_needed();expect(page.locator('#dock')).not_to_be_visible()
    assert not page.evaluate('document.documentElement.scrollWidth>innerWidth'),(slug,width)
    for img in page.locator('img').all():
     img.scroll_into_view_if_needed();page.wait_for_function('(i)=>i.complete&&i.naturalWidth>0',arg=img.element_handle())
    assert not errors,errors;assert not external,external
    ctx.close()
   print('OK',engine,width,height,'duas páginas completas',flush=True)
  b.close()
print('PASS: 24 fluxos completos, sem envio externo')
