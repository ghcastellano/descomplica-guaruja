// Run locally with --env-file=.env.local --import tsx. Browser writes are mocked.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createHmac } from "node:crypto";
const { chromium, webkit } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const BASE = "http://127.0.0.1:3002";
assert.equal(process.env.APP_ORIGIN, BASE);
const out = ".local/ui-review";
await mkdir(out, { recursive: true });
const { db } = await import("../lib/db.ts");
const { config } = await import("../lib/config.ts");
const [row] =
  await db`SELECT request_key FROM city_requests ORDER BY created_at DESC LIMIT 1`;
const tracking = row
  ? "/pedidos/" +
    createHmac("sha256", config().secret)
      .update("city-tracking:" + row.request_key)
      .digest("base64url")
  : null;
await db.end();
const publicRoutes = [
  "/",
  "/resolver",
  "/casa",
  "/experiencias",
  "/descobrir",
  "/parceiros",
  "/descomplicar",
  "/pedidos",
  "/voce",
  "/privacidade",
  "/login",
  "/guia-de-testes",
];
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => {} },
    });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let calls = 0;
  await page.route("**/api/city/interpret", async (r) => {
    calls++;
    await r.fulfill({ status: 503, body: "{}" });
  });
  const sent = [];
  await page.route("**/api/city/requests", async (r) => {
    sent.push(r.request().postDataJSON());
    await r.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        url: "/pedidos/" + "a".repeat(43),
        protocol: "GU-TESTE",
      }),
    });
  });
  const login = await context.request.post(BASE + "/api/login", {
    headers: { Origin: BASE },
    data: { code: process.env.LOCAL_ACCESS_CODE },
  });
  assert.equal(login.status(), 200);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      ...publicRoutes,
      "/solicitar",
      "/operacao",
      "/operacao/rede",
      "/agenda",
      "/operacao/whatsapp",
    ]) {
      const res = await page.goto(BASE + route);
      await page.locator("main").waitFor();
      await page.evaluate(() => document.fonts.ready);
      assert.equal(res.status(), 200, route);
      assert.equal(
        new URL(page.url()).pathname,
        route,
        "unexpected redirect " + route,
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        engine.name() + " " + width + " " + route + " overflow",
      );
      assert.equal(await page.locator("h1").count(), 1, route);
    }
    await page.goto(BASE);
    const input = page.getByLabel("Conte pra gente");
    await input.fill("Preciso limpar o ar-condicionado no Tombo");
    const before = calls;
    await input.press("Shift+Enter");
    assert.equal(calls, before);
    assert((await input.inputValue()).includes("\n"));
    await input.press("Enter");
    await page
      .getByRole("heading", { name: "Qual destas opções resolve?" })
      .waitFor();
    assert.equal(calls, before + 1);
    assert.match(
      await page.locator(".intent-result").first().innerText(),
      /Limpeza de ar-condicionado/,
    );
    assert.equal(await page.getByLabel("Seu nome", { exact: true }).count(), 0);
    await page
      .locator(".intent-result-region")
      .screenshot({ path: `${out}/${engine.name()}-${width}-search.png` });
    await page.locator(".intent-result").first().click();
    assert.equal(
      await page
        .getByLabel("Qual serviço combina com seu pedido?")
        .inputValue(),
      "ar-limpeza",
    );
    await page
      .getByLabel("Quantos aparelhos e de quais tipos?")
      .fill("Um split");
    await page
      .getByLabel("As unidades são acessíveis e quando foi a última limpeza?")
      .fill("Acessível, há seis meses");
    await page.getByRole("button", { name: "Continuar com a ideia" }).click();
    await page.getByRole("button", { name: /Continuar/ }).click(); // bairro already retained: goes to contact
    await page.getByLabel("Seu nome", { exact: true }).fill("TESTE UI");
    await page
      .getByLabel("WhatsApp ou e-mail", { exact: true })
      .fill("teste@example.invalid");
    const checkbox = page.locator(".consent-field input"),
      label = page.locator(".consent-field span");
    const a = await checkbox.boundingBox(),
      b = await label.boundingBox();
    assert(
      a.width <= 22 && a.x + a.width <= b.x && Math.abs(a.y - b.y) < 10,
      "checkbox alignment",
    );
    await checkbox.check();
    await page
      .locator(".concierge-response")
      .screenshot({ path: `${out}/${engine.name()}-${width}-consent.png` });
    await page.getByRole("button", { name: /Continuar/ }).click();
    await page.getByRole("button", { name: "Enviar para avaliação" }).click();
    await page
      .getByRole("heading", { name: "Sua ideia já tem um próximo passo." })
      .waitFor();
    assert.equal(sent.at(-1).serviceId, "ar-limpeza");
    assert.equal(sent.at(-1).neighborhood, "Tombo");
    if (tracking) {
      const r = await page.goto(BASE + tracking);
      assert.equal(r.status(), 200, "tracking token");
      const refresh = page.getByRole("button", {
          name: "Atualizar acompanhamento",
        }),
        copy = page.getByRole("button", { name: "Copiar link privado" });
      for (const updated of [false, true]) {
        if (updated) {
          await refresh.click();
          await page
            .getByText("Situação atualizada.", { exact: true })
            .waitFor();
          await copy.click();
        }
        const x = await refresh.boundingBox(),
          y = await copy.boundingBox();
        if (width > 600)
          assert(Math.abs(x.y - y.y) < 2, "tracking button top alignment");
        else assert(y.y >= x.y + x.height, "tracking stacked buttons");
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
        );
      }
      await page.screenshot({
        path: `${out}/${engine.name()}-${width}-tracking.png`,
        fullPage: true,
      });
    }
    await page.goto(BASE + "/operacao/rede");
    await page.getByLabel("Buscar na rede").fill("ZZZ-NENHUM-RESULTADO");
    assert.match(
      await page.locator("main").innerText(),
      /Nenhum resultado|Comece por um negócio/,
    );
    console.log(
      engine.name(),
      width,
      "routes, Enter/Shift+Enter, service choice, consent, mocked request, tracking and network OK",
    );
  }
  assert.deepEqual(errors, []);
  await browser.close();
}
