"""Slides SEMEP: navegação, notas, legibilidade e conteúdo sem chamadas externas."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('TEST_BASE_URL','http://127.0.0.1:3000')
OUT=Path('/tmp/semep-qa');OUT.mkdir(exist_ok=True)
engines=os.environ.get('TEST_BROWSERS','chromium,webkit').split(',')
with sync_playwright() as p:
 for engine in [getattr(p,name) for name in engines]:
  browser=engine.launch()
  for motion in ['reduce','no-preference']:
   for width,height in [(320,568),(390,844),(768,1024),(1440,900),(1920,1080)]:
    ctx=browser.new_context(viewport={'width':width,'height':height},reduced_motion=motion)
    ctx.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else r.abort())
    page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'/semep.html');page.evaluate('document.fonts.ready');page.mouse.move(0,0)
    assert page.locator('.slide').count()==8
    assert page.locator('meta[name=robots]').get_attribute('content')=='noindex, nofollow'
    for i in range(8):
     page.wait_for_function("()=>{const s=document.querySelector('.slide.is-active');return getComputedStyle(s).opacity==='1' && [...s.querySelectorAll('.rv')].every(e=>getComputedStyle(e).opacity==='1')}")
     slide=page.locator('.slide.is-active')
     assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(engine.name,width,i,'document')
     assert slide.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(engine.name,width,i,'slide')
     for title in slide.locator('h1,h2,h3').all():
      assert title.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1'),(width,i,'title')
     slide.evaluate('(e)=>e.scrollTop=e.scrollHeight');page.wait_for_timeout(50)
     assert slide.locator('.wrap').evaluate('(e)=>e.getBoundingClientRect().bottom')<=page.locator('.ctl').bounding_box()['y']+1,(width,i,'unreachable')
     if engine.name=='chromium' and motion=='reduce' and width in [390,1440]:
      slide.evaluate('(e)=>e.scrollTop=0');page.screenshot(path=str(OUT/f'{width}-{i+1:02}.png'))
     page.locator('#notesBtn').click();assert page.locator('#notes').is_visible();assert page.locator('#notes').inner_text().strip();page.locator('#notesBtn').click()
     if i<7:page.locator('#next').click()
    assert page.locator('#next').is_disabled();assert not errors,errors
    page.locator('#prev').click();assert page.locator('#cnt').inner_text()=='7 / 8'
    print('OK',engine.name,motion,width,flush=True);ctx.close()
  ctx=browser.new_context(java_script_enabled=False,viewport={'width':390,'height':844})
  page=ctx.new_page();page.goto(BASE+'/semep.html');assert page.locator('.slide:visible').count()==8
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  ctx.close();browser.close()
print(f'OK: {len(engines)*80} slides/estados SEMEP, notas e leitura sem JavaScript.')
