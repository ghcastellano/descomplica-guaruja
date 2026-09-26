"""Teste local real: app em 127.0.0.1:3001, dados fictícios; nunca chama serviços externos."""
from pathlib import Path
import json, re
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
CODE=re.search(r'^LOCAL_ACCESS_CODE=(.+)$',(ROOT/'.env.local').read_text(),re.M).group(1)
BASE='http://127.0.0.1:3001'

def no_overflow(page):
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), page.url

with sync_playwright() as p:
    for engine in ['chromium','webkit']:
        browser=getattr(p,engine).launch()
        context=browser.new_context(viewport={'width':390,'height':844})
        context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        page=context.new_page()
        errors=[]
        page.on('pageerror',lambda e: errors.append(str(e)))
        denied=context.request.post(BASE+'/api/requests',data={},headers={'Origin':BASE})
        assert denied.status==401
        csrf=context.request.post(BASE+'/api/requests',data={},headers={'Origin':'https://example.invalid'})
        assert csrf.status==403
        page.goto(BASE+'/');page.wait_for_url('**/login')
        page.locator('input[name=code]').fill(CODE)
        page.get_by_role('button',name='Entrar na operação').click();page.wait_for_url(BASE+'/')
        page.get_by_role('link',name='+ Solicitação de teste').click()
        page.locator('[name=name]').fill('Demonstração '+engine)
        assert page.locator('[name=guests]').is_disabled()
        page.locator('[name=packageId]').select_option('amigas_ess')
        page.locator('[name=guests]').select_option('8')
        page.locator('[name=place]').fill('Hospedagem de demonstração')
        page.locator('[name=notes]').fill('DETALHE_PRIVADO_TESTE')
        no_overflow(page)
        page.get_by_role('button',name='Criar solicitação de teste').click();page.wait_for_url('**/propostas/*')
        page.locator('[name=amount]').fill('1200.00')
        page.locator('[name=internalNote]').fill('SEGREDO_INTERNO_TESTE')
        page.get_by_role('button',name='Salvar revisão').click()
        page.get_by_text('VERSÃO 2',exact=False).first.wait_for()
        page.locator('input[type=checkbox]').check()
        page.get_by_role('button',name='Liberar proposta de teste').click()
        link=page.get_by_role('link',name='Abrir visão do cliente')
        link.wait_for();url=link.get_attribute('href')
        for width,height in [(350,680),(390,844),(768,1024),(1440,900)]:
            page.set_viewport_size({'width':width,'height':height});no_overflow(page)
        page.screenshot(path=f'/tmp/descomplica-app-{engine}-review.png',full_page=True)
        page.set_viewport_size({'width':390,'height':844})
        page.screenshot(path=f'/tmp/descomplica-app-{engine}-mobile.png',full_page=True)
        page.get_by_text('Versão 1 ·',exact=False).last.click()
        assert page.locator('.revision-history[open]').count()==1
        client_context=browser.new_context(viewport={'width':390,'height':844})
        client_context.route('**/*',lambda route: route.continue_() if route.request.url.startswith(BASE) else route.abort())
        client=client_context.new_page()
        response=client.goto(url)
        assert response.status==200
        assert response.headers.get('x-robots-tag')=='noindex, nofollow, noarchive'
        assert 'no-store' in response.headers.get('cache-control','')
        body=client.locator('body').inner_text()
        assert 'R$\xa01.200,00' in body or 'R$ 1.200,00' in body
        assert 'SEGREDO_INTERNO_TESTE' not in body and 'DETALHE_PRIVADO_TESTE' not in body
        for width,height in [(350,680),(768,1024),(1440,900)]:
            client.set_viewport_size({'width':width,'height':height});no_overflow(client)
        page.locator('[name=amount]').fill('1250.00');page.get_by_role('button',name='Salvar revisão').click()
        page.get_by_text('VERSÃO 3',exact=False).first.wait_for()
        client.reload();client.get_by_text('Este link não está disponível',exact=False).wait_for()
        assert not errors,errors
        browser.close()
        print(engine+': fluxo, privacidade, CSRF e 4 tamanhos OK')
