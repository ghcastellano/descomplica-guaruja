"""Validate all institutional slides in the shared deck system, without external requests."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
OUT=Path('/tmp/cultura-setur-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch()
  for motion in ['reduce','no-preference']:
   for width,height in [(320,568),(350,680),(390,844),(768,1024),(1024,768),(1440,900),(1920,1080)]:
    ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion=motion)
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else r.fulfill(status=204,body=''))
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/cultura-setur.html');page.evaluate('document.fonts.ready')
    assert page.locator('.slide').count()==11
    for i in range(11):
     page.wait_for_function("()=>{const s=document.querySelector('.slide.is-active');return getComputedStyle(s).opacity==='1' && [...s.querySelectorAll('.rv')].every(e=>getComputedStyle(e).opacity==='1')}")
     page.wait_for_timeout(60)
     s=page.locator('.slide.is-active')
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine.name,width,i+1,'document overflow')
     assert s.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(engine.name,width,i+1,'slide overflow')
     assert s.bounding_box()['y']+s.bounding_box()['height']<=page.locator('.ctl').bounding_box()['y']+1
     for title in s.locator('h1,h2,h3').all():
      assert title.evaluate('(e)=>(parseFloat(getComputedStyle(e).letterSpacing)||0)===0'),(width,i+1,'tracking')
      assert title.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(width,i+1,'title overflow')
     assert s.locator('.capacity strong,.pilot-numbers strong').evaluate_all('(els)=>els.every(e=>e.scrollWidth<=e.clientWidth+1)'),(width,i+1,'number wraps')
     assert s.locator('.grid2 .photo img').evaluate_all('(els)=>els.every(e=>getComputedStyle(e).objectFit==="contain")')
     if engine.name=='chromium' and motion=='reduce' and width in [390,768,1440]:page.screenshot(path=str(OUT/f'{width}-{i+1:02}.png'))
     # All content must remain reachable if a small screen needs vertical scrolling.
     s.evaluate('(e)=>e.scrollTop=e.scrollHeight');page.wait_for_timeout(30)
     last=s.locator('.wrap').evaluate('(e)=>e.getBoundingClientRect().bottom')
     assert last<=page.locator('.ctl').bounding_box()['y']+1,(width,i+1,'unreachable end')
     if i<10:page.locator('#next').click()
    assert not errors,errors
    assert page.locator('#next').is_disabled()
    page.locator('#prev').click();page.wait_for_timeout(500 if motion=='no-preference' else 30)
    assert page.locator('#cnt').inner_text()=='10 / 11'
    page.locator('#notesBtn').click();assert page.locator('#notes').is_visible()
    print('OK',engine.name,motion,f'{width}x{height}',flush=True)
    ctx.close()
  browser.close()
print('OK: 308 slides, Chrome/Safari, 7 tamanhos e movimento normal/reduzido.')
