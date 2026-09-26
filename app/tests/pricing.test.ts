import test from "node:test";
import assert from "node:assert/strict";
import { priceWithStripe, paymentEstimate } from "../lib/pricing";
import catalog from "../lib/catalog.json";
test("cada faixa preserva orçamento operacional e provisões sem duplicar taxa antiga", () => {
  for (const quantities of Object.values(catalog.prices))
    for (const range of Object.values(quantities))
      for (const reais of range) {
        const base = reais * 100,
          total = priceWithStripe(base),
          p = paymentEstimate(total);
        assert.equal(p.depositCents + p.balanceCents, total);
        assert.ok(
          p.netCents - Math.ceil(total * 0.25) >= Math.ceil(base * 0.74),
        );
        assert.ok(total > base);
        assert.ok(total < base * 1.05);
      }
});
test("sinal e saldo geram duas tarifas fixas, valor inválido não é precificado", () => {
  const p = paymentEstimate(10000);
  assert.equal(p.feesCents, 478);
  assert.equal(p.depositCents, 5000);
  const odd = paymentEstimate(10001);
  assert.equal(odd.depositCents, 5001);
  assert.equal(odd.balanceCents, 5000);
  for (const n of [0, -1, NaN, 100.3]) assert.throws(() => priceWithStripe(n));
});
