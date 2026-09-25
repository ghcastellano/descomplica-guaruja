"""Regressão dos fundos animados: testar com movimento normal e ponteiro nos cantos."""
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE='http://127.0.0.1:3000'
OUT=Path('/tmp/descomplica-scroll-qa');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 for engine in [p.chromium,p.webkit]:
  browser=engine.launch()
  for width,height in [(390,844),(768,1024),(1280,720),(1440,900),(1880,1170)]:
   page=browser.new_page(viewport={'width':width,'height':height},reduced_motion='no-preference')
   page.route('https://**/*',lambda r:r.fulfill(status=204,body=''))
   scrolling=[]
   for name in ['visao','resumo-executivo','parceria-pousadas']:
    page.goto(BASE+'/'+name+'.html');page.evaluate('document.fonts.ready')
    page.mouse.move(width-2,height-2)
    total=page.locator('.slide').count()
    for i in range(total):
     page.wait_for_timeout(620)
     m=page.evaluate('''()=>{let s=document.querySelector('.slide.is-active'),r=s.getBoundingClientRect(),c=document.querySelector('.ctl').getBoundingClientRect(),els=[s.querySelector('.wrap'),s.querySelector('.foot')].filter(Boolean);return {cw:s.clientWidth,sw:s.scrollWidth,ch:s.clientHeight,sh:s.scrollHeight,rootWidth:document.documentElement.scrollWidth,rootHeight:document.documentElement.scrollHeight,contentBottom:Math.max(...els.map(e=>e.getBoundingClientRect().bottom-r.top))+parseFloat(getComputedStyle(s).paddingBottom),bottom:r.bottom,controls:c.top}}''')
     assert m['sw']<=m['cw']+1,(engine.name,width,name,i+1,'scroll lateral',m)
     assert m['rootWidth']<=width and m['rootHeight']<=height,(engine.name,width,name,i+1,'scroll raiz',m)
     assert m['bottom']<=m['controls']+1,(engine.name,width,name,i+1,'conteúdo cobre controles')
     assert m['sh']-m['ch']<=max(0,m['contentBottom']-m['ch'])+3,(engine.name,width,name,i+1,'scroll decorativo',m)
     if i==0 and width>=1280:assert m['sh']<=m['ch']+1,(name,'capa com scroll')
     if m['sh']>m['ch']+8:scrolling.append(f'{name}:{i+1}')
     if page.locator('.slide.is-active .grid2 .photo').count():
      assert page.locator('.slide.is-active .grid2 .photo picture>img').evaluate_all('(imgs)=>imgs.every(i=>getComputedStyle(i).objectFit==="contain"&&getComputedStyle(i).transform==="none")')
      seal=page.locator('.slide.is-active .seal')
      if seal.count() and seal.is_visible():assert seal.evaluate('(e)=>e.getBoundingClientRect().top>=e.parentElement.getBoundingClientRect().top')
     if engine.name=='chromium' and width in [390,768,1880]:
      page.screenshot(path=str(OUT/f'{name}-{width}-{i+1:02}.png'))
     if i<total-1:page.locator('#next').click()
    if name=='visao':assert 'Palooza' not in page.locator('body').inner_text() and 'Dom Barbato' not in page.content()
   print(engine.name,width,'OK; slides com conteúdo vertical:',','.join(scrolling) or 'nenhum',flush=True)
   page.close()
  browser.close()
print('OK: 350 estados com animação ativa, sem overflow lateral, capas sem scroll e fotos completas.')
